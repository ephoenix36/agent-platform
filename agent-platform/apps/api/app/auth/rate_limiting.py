"""
Usage Tracking & Rate Limiting
Track API usage and enforce rate limits by tier
"""

from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .models import APIUsage, APIKey, UsageAggregate
from collections import defaultdict
import time
import logging
import redis
import os

logger = logging.getLogger(__name__)

# Redis for rate limiting (in-memory cache)
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)


class UsageTracker:
    """Track API usage for billing and analytics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def track_request(
        self,
        api_key_id: str,
        user_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: int,
        feature: str,
        request_id: str,
        user_agent: str = None,
        ip_address: str = None
    ):
        """
        Track an API request for billing and analytics
        
        Args:
            api_key_id: API key UUID
            user_id: User UUID
            endpoint: API endpoint path
            method: HTTP method
            status_code: Response status code
            response_time_ms: Response time in milliseconds
            feature: Feature used (evaluation, optimization, etc.)
            request_id: Unique request ID
            user_agent: User agent string
            ip_address: Client IP address
        """
        # Get current billing period (start of month)
        now = datetime.utcnow()
        billing_period = datetime(now.year, now.month, 1)
        
        # Calculate cost (if metered)
        cost_cents = self._calculate_cost(feature)
        
        # Create usage record
        usage = APIUsage(
            api_key_id=api_key_id,
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            feature=feature,
            request_id=request_id,
            user_agent=user_agent,
            ip_address=ip_address,
            cost_cents=cost_cents,
            timestamp=now,
            billing_period=billing_period
        )
        
        self.db.add(usage)
        self.db.commit()
        
        logger.debug(f"Tracked request: {endpoint} for user {user_id}")
    
    async def get_period_usage(
        self,
        user_id: str,
        period_start: datetime
    ) -> dict:
        """Get usage statistics for a billing period"""
        from sqlalchemy import func
        
        # Get usage for period
        usage = self.db.query(
            func.count(APIUsage.id).label('total_requests'),
            func.count(func.nullif(APIUsage.status_code >= 200 and APIUsage.status_code < 300, False)).label('successful'),
            func.avg(APIUsage.response_time_ms).label('avg_response_time'),
            func.sum(APIUsage.cost_cents).label('total_cost')
        ).filter(
            APIUsage.user_id == user_id,
            APIUsage.billing_period == period_start
        ).first()
        
        # Get breakdown by feature
        feature_breakdown = self.db.query(
            APIUsage.feature,
            func.count(APIUsage.id).label('count')
        ).filter(
            APIUsage.user_id == user_id,
            APIUsage.billing_period == period_start
        ).group_by(APIUsage.feature).all()
        
        return {
            'total_requests': usage.total_requests or 0,
            'successful_requests': usage.successful or 0,
            'avg_response_time_ms': float(usage.avg_response_time or 0),
            'total_cost_cents': usage.total_cost or 0,
            'feature_breakdown': {f: c for f, c in feature_breakdown}
        }
    
    def _calculate_cost(self, feature: str) -> int:
        """Calculate cost for a feature usage (in cents)"""
        # Base cost per API call
        costs = {
            'evaluation': 1,  # $0.01
            'optimization': 2,  # $0.02
            'ood_testing': 1,
            'island_evolution': 3,
            'artifact_debug': 1,
            'auto_dataset': 1
        }
        return costs.get(feature, 1)


class RateLimiter:
    """Rate limiting for API requests"""
    
    def __init__(self):
        self.redis = redis_client
    
    async def check_rate_limit(
        self,
        api_key: APIKey,
        endpoint: str
    ) -> dict:
        """
        Check if request is within rate limits
        
        Args:
            api_key: API key record
            endpoint: Endpoint being accessed
            
        Returns:
            Dict with rate limit info
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        # Skip rate limiting for enterprise tier
        if api_key.tier == 'enterprise' or api_key.rate_limit_per_minute == 0:
            return {
                'allowed': True,
                'tier': api_key.tier,
                'limit': 'unlimited',
                'remaining': 'unlimited'
            }
        
        # Rate limit key
        key = f"rate_limit:{api_key.id}:{endpoint}"
        minute_key = f"{key}:minute"
        
        # Get current count
        current_count = self.redis.get(minute_key)
        current_count = int(current_count) if current_count else 0
        
        # Check limit
        if current_count >= api_key.rate_limit_per_minute:
            logger.warning(f"Rate limit exceeded for API key {api_key.key_prefix}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Max {api_key.rate_limit_per_minute} requests per minute.",
                headers={
                    "X-RateLimit-Limit": str(api_key.rate_limit_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + 60)
                }
            )
        
        # Increment counter
        pipe = self.redis.pipeline()
        pipe.incr(minute_key)
        pipe.expire(minute_key, 60)  # Expire after 1 minute
        pipe.execute()
        
        remaining = api_key.rate_limit_per_minute - (current_count + 1)
        
        return {
            'allowed': True,
            'tier': api_key.tier,
            'limit': api_key.rate_limit_per_minute,
            'remaining': remaining,
            'reset_in_seconds': 60
        }
    
    async def check_monthly_quota(
        self,
        db: Session,
        api_key: APIKey,
        user_id: str
    ) -> dict:
        """
        Check if monthly quota is exceeded
        
        Args:
            db: Database session
            api_key: API key record
            user_id: User UUID
            
        Returns:
            Dict with quota info
            
        Raises:
            HTTPException: If quota exceeded
        """
        # Skip quota check for enterprise or unlimited tiers
        if api_key.tier == 'enterprise' or api_key.monthly_quota == 0:
            return {
                'allowed': True,
                'quota': 'unlimited',
                'used': 0,
                'remaining': 'unlimited'
            }
        
        # Get current month usage
        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1)
        
        from sqlalchemy import func
        usage_count = db.query(func.count(APIUsage.id)).filter(
            APIUsage.user_id == user_id,
            APIUsage.billing_period == period_start
        ).scalar()
        
        usage_count = usage_count or 0
        
        # Check if over quota
        if usage_count >= api_key.monthly_quota:
            logger.warning(f"Monthly quota exceeded for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Monthly quota exceeded. Used {usage_count}/{api_key.monthly_quota} calls.",
                headers={
                    "X-Quota-Limit": str(api_key.monthly_quota),
                    "X-Quota-Used": str(usage_count),
                    "X-Quota-Remaining": "0"
                }
            )
        
        remaining = api_key.monthly_quota - usage_count
        
        return {
            'allowed': True,
            'quota': api_key.monthly_quota,
            'used': usage_count,
            'remaining': remaining,
            'percentage': (usage_count / api_key.monthly_quota) * 100
        }


# Middleware for rate limiting
async def rate_limit_middleware(
    request: Request,
    api_key: APIKey,
    db: Session
):
    """
    Rate limiting middleware
    
    Usage in route:
        await rate_limit_middleware(request, api_key, db)
    """
    limiter = RateLimiter()
    
    # Check rate limit
    rate_limit_info = await limiter.check_rate_limit(api_key, request.url.path)
    
    # Check monthly quota
    quota_info = await limiter.check_monthly_quota(db, api_key, str(api_key.user_id))
    
    # Add headers to response
    request.state.rate_limit = rate_limit_info
    request.state.quota = quota_info
    
    return {
        'rate_limit': rate_limit_info,
        'quota': quota_info
    }
