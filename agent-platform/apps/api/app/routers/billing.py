"""
Billing API Routes
FastAPI endpoints for subscription management, billing, and usage
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from ..billing.subscription import SubscriptionManager
from ..billing.webhooks import process_webhook
from ..billing.stripe_client import stripe_client
from ..auth.api_key_auth import require_api_key
from ..auth.rate_limiting import rate_limit_middleware, UsageTracker
from ..database import get_db

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


# ========================================
# REQUEST/RESPONSE MODELS
# ========================================

class CreateSubscriptionRequest(BaseModel):
    tier: str  # pro, team, enterprise
    trial_days: int = 14
    payment_method_id: Optional[str] = None


class UpgradeSubscriptionRequest(BaseModel):
    new_tier: str


class CancelSubscriptionRequest(BaseModel):
    immediately: bool = False
    reason: Optional[str] = None


class CreateCheckoutSessionRequest(BaseModel):
    tier: str
    success_url: str
    cancel_url: str
    trial_days: int = 14


class RegenerateAPIKeyRequest(BaseModel):
    old_key_id: Optional[str] = None


# ========================================
# SUBSCRIPTION ENDPOINTS
# ========================================

@router.post("/subscriptions")
async def create_subscription(
    request: CreateSubscriptionRequest,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Create a new subscription
    
    Requires: Valid API key
    
    Returns: Subscription details and client_secret for payment
    """
    api_key, user = auth
    
    manager = SubscriptionManager(db)
    
    try:
        subscription = await manager.create_subscription(
            user_id=str(user.id),
            tier=request.tier,
            trial_days=request.trial_days
        )
        
        return {
            "success": True,
            "subscription": subscription
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/subscriptions/current")
async def get_current_subscription(
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Get current subscription information
    
    Requires: Valid API key
    
    Returns: Current subscription details, usage, and limits
    """
    api_key, user = auth
    
    manager = SubscriptionManager(db)
    
    subscription_info = await manager.get_subscription_info(str(user.id))
    
    return {
        "success": True,
        "subscription": subscription_info
    }


@router.post("/subscriptions/upgrade")
async def upgrade_subscription(
    request: UpgradeSubscriptionRequest,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Upgrade or downgrade subscription tier
    
    Requires: Valid API key
    
    Returns: Updated subscription details
    """
    api_key, user = auth
    
    manager = SubscriptionManager(db)
    
    try:
        result = await manager.upgrade_subscription(
            user_id=str(user.id),
            new_tier=request.new_tier
        )
        
        return {
            "success": True,
            "upgrade": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/subscriptions/cancel")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Cancel subscription
    
    Requires: Valid API key
    
    Returns: Cancellation details
    """
    api_key, user = auth
    
    manager = SubscriptionManager(db)
    
    try:
        result = await manager.cancel_subscription(
            user_id=str(user.id),
            immediately=request.immediately,
            reason=request.reason
        )
        
        return {
            "success": True,
            "cancellation": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ========================================
# CHECKOUT ENDPOINTS
# ========================================

@router.post("/checkout/create-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    email: EmailStr,
    db: Session = Depends(get_db)
):
    """
    Create Stripe Checkout session for self-service signup
    
    Public endpoint (no auth required)
    
    Returns: Checkout session URL
    """
    from ..billing.models import User
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    # Get price ID for tier
    price_ids = {
        'pro': os.getenv('STRIPE_PRICE_ID_PRO'),
        'team': os.getenv('STRIPE_PRICE_ID_TEAM'),
        'enterprise': os.getenv('STRIPE_PRICE_ID_ENTERPRISE')
    }
    
    price_id = price_ids.get(request.tier.lower())
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier: {request.tier}"
        )
    
    try:
        # Create checkout session
        session = await stripe_client.create_checkout_session(
            customer_email=email,
            price_id=price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            trial_days=request.trial_days,
            metadata={
                'tier': request.tier,
                'user_id': str(user.id) if user else None
            }
        )
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========================================
# API KEY ENDPOINTS
# ========================================

@router.post("/api-keys/regenerate")
async def regenerate_api_key(
    request: RegenerateAPIKeyRequest,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Regenerate API key
    
    ⚠️ WARNING: Old key will be revoked immediately!
    
    Returns: New API key (only shown once!)
    """
    api_key, user = auth
    
    manager = SubscriptionManager(db)
    
    try:
        new_key = await manager.regenerate_api_key(
            user_id=str(user.id),
            old_key_id=request.old_key_id
        )
        
        return {
            "success": True,
            "api_key": new_key,
            "warning": "Save this key securely - it will not be shown again!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ========================================
# USAGE & ANALYTICS ENDPOINTS
# ========================================

@router.get("/usage/current-period")
async def get_current_period_usage(
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Get usage statistics for current billing period
    
    Returns: Usage breakdown by feature, total calls, costs
    """
    api_key, user = auth
    
    # Get current billing period
    now = datetime.utcnow()
    period_start = datetime(now.year, now.month, 1)
    
    tracker = UsageTracker(db)
    usage = await tracker.get_period_usage(str(user.id), period_start)
    
    return {
        "success": True,
        "period_start": period_start.isoformat(),
        "usage": usage,
        "quota": {
            "limit": api_key.monthly_quota,
            "used": usage['total_requests'],
            "remaining": max(0, api_key.monthly_quota - usage['total_requests']) if api_key.monthly_quota > 0 else "unlimited",
            "percentage": (usage['total_requests'] / api_key.monthly_quota * 100) if api_key.monthly_quota > 0 else 0
        }
    }


@router.get("/usage/history")
async def get_usage_history(
    months: int = 3,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    Get historical usage data
    
    Args:
        months: Number of months to retrieve (default: 3)
    
    Returns: Monthly usage breakdown
    """
    from ..billing.models import UsageAggregate
    from sqlalchemy import func
    from dateutil.relativedelta import relativedelta
    
    api_key, user = auth
    
    # Get last N months of data
    now = datetime.utcnow()
    start_date = now - relativedelta(months=months)
    
    aggregates = db.query(UsageAggregate).filter(
        UsageAggregate.user_id == user.id,
        UsageAggregate.period_start >= start_date,
        UsageAggregate.period_type == 'monthly'
    ).order_by(UsageAggregate.period_start.desc()).all()
    
    history = []
    for agg in aggregates:
        history.append({
            'period': agg.period_start.isoformat(),
            'total_requests': agg.total_requests,
            'successful_requests': agg.successful_requests,
            'failed_requests': agg.failed_requests,
            'feature_breakdown': agg.feature_breakdown,
            'avg_response_time_ms': agg.avg_response_time_ms,
            'total_cost_cents': agg.total_cost_cents
        })
    
    return {
        "success": True,
        "history": history
    }


# ========================================
# WEBHOOK ENDPOINT
# ========================================

@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Stripe webhook endpoint
    
    Handles all Stripe events (payments, subscriptions, etc.)
    
    Note: This endpoint must be registered in Stripe Dashboard
    """
    # Get raw body
    body = await request.body()
    
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header"
        )
    
    try:
        # Process webhook
        result = await process_webhook(db, body, stripe_signature)
        
        return {
            "success": True,
            "event_id": result.get('event_id'),
            "status": result.get('status')
        }
        
    except Exception as e:
        # Log error but return 200 to prevent Stripe retries
        logger.error(f"Webhook processing error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


# ========================================
# INVOICE ENDPOINTS
# ========================================

@router.get("/invoices")
async def list_invoices(
    limit: int = 10,
    auth: tuple = Depends(require_api_key),
    db: Session = Depends(get_db)
):
    """
    List invoices for user
    
    Args:
        limit: Number of invoices to return (default: 10)
    
    Returns: List of invoices
    """
    from ..billing.models import User
    
    api_key, user = auth
    
    user_record = db.query(User).filter(User.id == user.id).first()
    
    if not user_record.stripe_customer_id:
        return {
            "success": True,
            "invoices": []
        }
    
    invoices = await stripe_client.list_invoices(
        customer_id=user_record.stripe_customer_id,
        limit=limit
    )
    
    invoice_list = []
    for inv in invoices:
        invoice_list.append({
            'id': inv.id,
            'amount_paid': inv.amount_paid / 100,  # Convert cents to dollars
            'amount_due': inv.amount_due / 100,
            'status': inv.status,
            'created': datetime.fromtimestamp(inv.created).isoformat(),
            'invoice_pdf': inv.invoice_pdf,
            'hosted_invoice_url': inv.hosted_invoice_url
        })
    
    return {
        "success": True,
        "invoices": invoice_list
    }


# ========================================
# HEALTH CHECK
# ========================================

@router.get("/health")
async def billing_health_check():
    """Health check for billing system"""
    try:
        # Verify Stripe connection
        account = await stripe_client.get_account_info()
        
        return {
            "success": True,
            "status": "healthy",
            "stripe_account": account.id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }


import os
import logging

logger = logging.getLogger(__name__)
