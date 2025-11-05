"""
Subscription Management
Handles subscription lifecycle, tier changes, and billing
"""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from .stripe_client import stripe_client
from .models import User, Subscription, APIKey
import secrets
import hashlib
import logging
import os

logger = logging.getLogger(__name__)


class SubscriptionManager:
    """
    Manage user subscriptions and billing
    
    Features:
    - Create subscriptions
    - Upgrade/downgrade tiers
    - Cancel subscriptions
    - Handle trials
    - Generate API keys
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.stripe = stripe_client
    
    # ========================================
    # SUBSCRIPTION CREATION
    # ========================================
    
    async def create_subscription(
        self,
        user_id: str,
        tier: str,
        trial_days: int = 0
    ) -> Dict[str, Any]:
        """
        Create new subscription for user
        
        Args:
            user_id: User UUID
            tier: Subscription tier (pro, team, enterprise)
            trial_days: Number of trial days (default: 0)
            
        Returns:
            Dictionary with subscription details and client_secret for payment
        """
        # Get user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception("User not found")
        
        # Check if user already has active subscription
        existing_sub = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(['active', 'trialing'])
        ).first()
        
        if existing_sub:
            raise Exception("User already has an active subscription")
        
        # Create Stripe customer if doesn't exist
        if not user.stripe_customer_id:
            customer = await self.stripe.create_customer(
                email=user.email,
                name=user.name,
                metadata={'user_id': str(user.id)}
            )
            user.stripe_customer_id = customer.id
            self.db.commit()
        
        # Get price ID for tier
        price_id = self._get_price_id(tier)
        if not price_id:
            raise Exception(f"Invalid tier: {tier}")
        
        # Create Stripe subscription
        stripe_sub = await self.stripe.create_subscription(
            customer_id=user.stripe_customer_id,
            price_id=price_id,
            trial_days=trial_days,
            metadata={'user_id': str(user.id), 'tier': tier}
        )
        
        # Save to database
        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=stripe_sub.id,
            stripe_customer_id=user.stripe_customer_id,
            stripe_price_id=price_id,
            status=stripe_sub.status,
            tier=tier,
            current_period_start=datetime.fromtimestamp(stripe_sub.current_period_start),
            current_period_end=datetime.fromtimestamp(stripe_sub.current_period_end),
            trial_start=datetime.fromtimestamp(stripe_sub.trial_start) if stripe_sub.trial_start else None,
            trial_end=datetime.fromtimestamp(stripe_sub.trial_end) if stripe_sub.trial_end else None
        )
        self.db.add(subscription)
        
        # Generate API key
        api_key_data = await self._generate_api_key(user.id, tier)
        
        self.db.commit()
        
        # Get client secret for payment
        client_secret = None
        if stripe_sub.latest_invoice:
            if hasattr(stripe_sub.latest_invoice, 'payment_intent'):
                client_secret = stripe_sub.latest_invoice.payment_intent.client_secret
        
        logger.info(f"Created {tier} subscription for user {user.email}")
        
        return {
            'subscription_id': str(subscription.id),
            'stripe_subscription_id': stripe_sub.id,
            'status': stripe_sub.status,
            'tier': tier,
            'api_key': api_key_data['key'],
            'client_secret': client_secret,
            'trial_end': subscription.trial_end,
            'period_end': subscription.current_period_end
        }
    
    # ========================================
    # SUBSCRIPTION UPDATES
    # ========================================
    
    async def upgrade_subscription(
        self,
        user_id: str,
        new_tier: str
    ) -> Dict[str, Any]:
        """
        Upgrade/downgrade subscription to different tier
        
        Args:
            user_id: User UUID
            new_tier: New tier to switch to
            
        Returns:
            Updated subscription details
        """
        # Get current subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(['active', 'trialing'])
        ).first()
        
        if not subscription:
            raise Exception("No active subscription found")
        
        if subscription.tier == new_tier:
            raise Exception("Already on this tier")
        
        # Get new price ID
        new_price_id = self._get_price_id(new_tier)
        if not new_price_id:
            raise Exception(f"Invalid tier: {new_tier}")
        
        # Update in Stripe
        stripe_sub = await self.stripe.update_subscription(
            subscription.stripe_subscription_id,
            new_price_id,
            proration_behavior='always_invoice'
        )
        
        # Update database
        old_tier = subscription.tier
        subscription.stripe_price_id = new_price_id
        subscription.tier = new_tier
        subscription.status = stripe_sub.status
        subscription.updated_at = datetime.utcnow()
        
        # Update API key tier and limits
        api_key = self.db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.is_active == True
        ).first()
        
        if api_key:
            api_key.tier = new_tier
            api_key.rate_limit_per_minute = self._get_rate_limit(new_tier)
            api_key.monthly_quota = self._get_monthly_quota(new_tier)
        
        self.db.commit()
        
        logger.info(f"Upgraded subscription from {old_tier} to {new_tier} for user {user_id}")
        
        return {
            'subscription_id': str(subscription.id),
            'old_tier': old_tier,
            'new_tier': new_tier,
            'status': subscription.status,
            'prorated': True
        }
    
    # ========================================
    # SUBSCRIPTION CANCELLATION
    # ========================================
    
    async def cancel_subscription(
        self,
        user_id: str,
        immediately: bool = False,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cancel user subscription
        
        Args:
            user_id: User UUID
            immediately: If True, cancel now; if False, at period end
            reason: Cancellation reason (optional)
            
        Returns:
            Cancellation details
        """
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(['active', 'trialing'])
        ).first()
        
        if not subscription:
            raise Exception("No active subscription found")
        
        # Cancel in Stripe
        stripe_sub = await self.stripe.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=not immediately
        )
        
        # Update database
        subscription.status = stripe_sub.status
        subscription.cancel_at_period_end = stripe_sub.cancel_at_period_end
        if immediately or stripe_sub.status == 'canceled':
            subscription.canceled_at = datetime.utcnow()
            
            # Deactivate API keys
            self.db.query(APIKey).filter(
                APIKey.user_id == user_id,
                APIKey.is_active == True
            ).update({'is_active': False, 'revoked_at': datetime.utcnow()})
        
        self.db.commit()
        
        logger.info(f"Canceled subscription for user {user_id} (immediately={immediately})")
        
        return {
            'subscription_id': str(subscription.id),
            'status': subscription.status,
            'canceled_immediately': immediately,
            'ends_at': subscription.current_period_end if not immediately else datetime.utcnow(),
            'reason': reason
        }
    
    # ========================================
    # API KEY MANAGEMENT
    # ========================================
    
    async def _generate_api_key(
        self,
        user_id: str,
        tier: str,
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate new API key for user
        
        Args:
            user_id: User UUID
            tier: Subscription tier
            name: Optional name for the key
            
        Returns:
            API key details (includes plaintext key - only shown once!)
        """
        # Generate secure random key
        key = f"sk_live_{secrets.token_urlsafe(32)}"
        
        # Hash for storage (never store plaintext!)
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Create API key record
        api_key = APIKey(
            user_id=user_id,
            key_hash=key_hash,
            key_prefix=key[:20] + "...",
            name=name or f"{tier.title()} API Key",
            tier=tier,
            rate_limit_per_minute=self._get_rate_limit(tier),
            monthly_quota=self._get_monthly_quota(tier),
            is_active=True
        )
        
        self.db.add(api_key)
        self.db.commit()
        
        logger.info(f"Generated {tier} API key for user {user_id}")
        
        return {
            'id': str(api_key.id),
            'key': key,  # ⚠️ ONLY returned once!
            'key_prefix': api_key.key_prefix,
            'tier': tier,
            'rate_limit': api_key.rate_limit_per_minute,
            'monthly_quota': api_key.monthly_quota
        }
    
    async def regenerate_api_key(
        self,
        user_id: str,
        old_key_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Regenerate API key (revoke old, create new)
        
        Args:
            user_id: User UUID
            old_key_id: Specific key to regenerate (optional)
            
        Returns:
            New API key details
        """
        # Get user's subscription tier
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(['active', 'trialing'])
        ).first()
        
        if not subscription:
            raise Exception("No active subscription found")
        
        # Revoke old key(s)
        if old_key_id:
            self.db.query(APIKey).filter(
                APIKey.id == old_key_id,
                APIKey.user_id == user_id
            ).update({'is_active': False, 'revoked_at': datetime.utcnow()})
        else:
            self.db.query(APIKey).filter(
                APIKey.user_id == user_id,
                APIKey.is_active == True
            ).update({'is_active': False, 'revoked_at': datetime.utcnow()})
        
        # Generate new key
        new_key = await self._generate_api_key(user_id, subscription.tier)
        
        self.db.commit()
        
        return new_key
    
    # ========================================
    # UTILITY METHODS
    # ========================================
    
    def _get_price_id(self, tier: str) -> Optional[str]:
        """Get Stripe price ID for tier"""
        price_ids = {
            'pro': os.getenv('STRIPE_PRICE_ID_PRO'),
            'team': os.getenv('STRIPE_PRICE_ID_TEAM'),
            'enterprise': os.getenv('STRIPE_PRICE_ID_ENTERPRISE')
        }
        return price_ids.get(tier.lower())
    
    def _get_rate_limit(self, tier: str) -> int:
        """Get rate limit for tier (requests per minute)"""
        limits = {
            'free': 10,
            'pro': 100,
            'team': 500,
            'enterprise': 0  # Unlimited
        }
        return limits.get(tier.lower(), 10)
    
    def _get_monthly_quota(self, tier: str) -> int:
        """Get monthly API call quota for tier"""
        quotas = {
            'free': 100,
            'pro': 10000,
            'team': 100000,
            'enterprise': 0  # Unlimited
        }
        return quotas.get(tier.lower(), 100)
    
    # ========================================
    # SUBSCRIPTION INFO
    # ========================================
    
    async def get_subscription_info(self, user_id: str) -> Dict[str, Any]:
        """Get complete subscription information for user"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription:
            return {
                'has_subscription': False,
                'tier': 'free',
                'status': 'none'
            }
        
        # Get usage for current period
        from .usage_tracker import UsageTracker
        tracker = UsageTracker(self.db)
        usage = await tracker.get_period_usage(user_id, subscription.current_period_start)
        
        return {
            'has_subscription': True,
            'subscription_id': str(subscription.id),
            'tier': subscription.tier,
            'status': subscription.status,
            'current_period_start': subscription.current_period_start.isoformat(),
            'current_period_end': subscription.current_period_end.isoformat(),
            'cancel_at_period_end': subscription.cancel_at_period_end,
            'trial_end': subscription.trial_end.isoformat() if subscription.trial_end else None,
            'usage': {
                'current': usage.get('total_requests', 0),
                'quota': self._get_monthly_quota(subscription.tier),
                'percentage': usage.get('usage_percentage', 0)
            }
        }
