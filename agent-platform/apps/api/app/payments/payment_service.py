"""
Payment System Integration
Supports: User → Agent payments, Creator payouts, Subscriptions, Usage-based billing
"""

from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from enum import Enum
import stripe
import os
from decimal import Decimal

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentType(str, Enum):
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"
    USAGE_BASED = "usage_based"
    REVENUE_SHARE = "revenue_share"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class Payment(BaseModel):
    """Payment record"""
    id: str
    user_id: str
    agent_id: str
    creator_id: str
    amount: Decimal
    currency: str = "usd"
    type: PaymentType
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

class CreatorPayout(BaseModel):
    """Creator payout record"""
    id: str
    creator_id: str
    amount: Decimal
    currency: str = "usd"
    period_start: datetime
    period_end: datetime
    status: PaymentStatus
    stripe_transfer_id: Optional[str] = None
    payments_included: List[str]
    created_at: datetime

class UsageRecord(BaseModel):
    """Usage tracking for billing"""
    id: str
    user_id: str
    agent_id: str
    runs: int
    cost_per_run: Decimal
    total_cost: Decimal
    timestamp: datetime

class PaymentService:
    """
    Comprehensive payment service
    """
    
    def __init__(self):
        self.platform_fee_percentage = 0.30  # 30% platform fee, 70% to creator
        
    # ========== User → Agent Payments ==========
    
    async def create_one_time_payment(
        self,
        user_id: str,
        agent_id: str,
        creator_id: str,
        amount: Decimal,
        payment_method_id: str
    ) -> Payment:
        """
        Create a one-time payment for agent purchase/usage
        """
        try:
            # Create Stripe PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency="usd",
                payment_method=payment_method_id,
                confirm=True,
                metadata={
                    "user_id": user_id,
                    "agent_id": agent_id,
                    "creator_id": creator_id,
                    "type": "agent_payment"
                },
                # Transfer 70% to creator (after Stripe fees)
                application_fee_amount=int(amount * 100 * self.platform_fee_percentage),
                transfer_data={
                    "destination": creator_id,  # Creator's Stripe Connect account
                }
            )
            
            payment = Payment(
                id=payment_intent.id,
                user_id=user_id,
                agent_id=agent_id,
                creator_id=creator_id,
                amount=amount,
                type=PaymentType.ONE_TIME,
                status=PaymentStatus.COMPLETED if payment_intent.status == "succeeded" else PaymentStatus.FAILED,
                stripe_payment_intent_id=payment_intent.id,
                metadata={"payment_method": payment_method_id},
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return payment
            
        except stripe.error.StripeError as e:
            raise Exception(f"Payment failed: {str(e)}")
    
    async def create_subscription(
        self,
        user_id: str,
        agent_id: str,
        creator_id: str,
        tier: SubscriptionTier,
        payment_method_id: str
    ) -> Payment:
        """
        Create a subscription for an agent
        """
        
        # Pricing tiers
        tier_prices = {
            SubscriptionTier.BASIC: Decimal("9.99"),
            SubscriptionTier.PRO: Decimal("29.99"),
            SubscriptionTier.ENTERPRISE: Decimal("99.99")
        }
        
        amount = tier_prices.get(tier, Decimal("0"))
        
        try:
            # Create Stripe Subscription
            subscription = stripe.Subscription.create(
                customer=user_id,
                items=[{
                    "price_data": {
                        "currency": "usd",
                        "product": agent_id,
                        "recurring": {"interval": "month"},
                        "unit_amount": int(amount * 100),
                    }
                }],
                payment_behavior="default_incomplete",
                default_payment_method=payment_method_id,
                expand=["latest_invoice.payment_intent"],
                metadata={
                    "user_id": user_id,
                    "agent_id": agent_id,
                    "creator_id": creator_id,
                    "tier": tier.value
                },
                # Platform fee
                application_fee_percent=self.platform_fee_percentage * 100,
                transfer_data={
                    "destination": creator_id,
                }
            )
            
            payment = Payment(
                id=subscription.id,
                user_id=user_id,
                agent_id=agent_id,
                creator_id=creator_id,
                amount=amount,
                type=PaymentType.SUBSCRIPTION,
                status=PaymentStatus.PROCESSING,
                stripe_subscription_id=subscription.id,
                metadata={"tier": tier.value},
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return payment
            
        except stripe.error.StripeError as e:
            raise Exception(f"Subscription creation failed: {str(e)}")
    
    async def process_usage_based_billing(
        self,
        user_id: str,
        agent_id: str,
        creator_id: str,
        runs: int,
        cost_per_run: Decimal
    ) -> Payment:
        """
        Process usage-based billing (pay per run)
        """
        
        total_cost = cost_per_run * runs
        
        # Record usage
        usage_record = UsageRecord(
            id=f"usage_{user_id}_{agent_id}_{datetime.now().timestamp()}",
            user_id=user_id,
            agent_id=agent_id,
            runs=runs,
            cost_per_run=cost_per_run,
            total_cost=total_cost,
            timestamp=datetime.now()
        )
        
        # Create payment
        # Note: In production, you'd batch these and charge periodically
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=int(total_cost * 100),
                currency="usd",
                customer=user_id,
                metadata={
                    "user_id": user_id,
                    "agent_id": agent_id,
                    "creator_id": creator_id,
                    "runs": runs,
                    "cost_per_run": str(cost_per_run),
                    "type": "usage_billing"
                },
                application_fee_amount=int(total_cost * 100 * self.platform_fee_percentage),
                transfer_data={
                    "destination": creator_id,
                }
            )
            
            payment = Payment(
                id=payment_intent.id,
                user_id=user_id,
                agent_id=agent_id,
                creator_id=creator_id,
                amount=total_cost,
                type=PaymentType.USAGE_BASED,
                status=PaymentStatus.COMPLETED,
                stripe_payment_intent_id=payment_intent.id,
                metadata={"runs": runs, "cost_per_run": str(cost_per_run)},
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return payment
            
        except stripe.error.StripeError as e:
            raise Exception(f"Usage billing failed: {str(e)}")
    
    # ========== Creator Payouts ==========
    
    async def calculate_creator_payout(
        self,
        creator_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> CreatorPayout:
        """
        Calculate creator payout for a period
        """
        
        # In production, query database for payments in period
        # For now, simulate
        total_revenue = Decimal("1000.00")
        creator_share = total_revenue * Decimal(str(1 - self.platform_fee_percentage))
        
        payout = CreatorPayout(
            id=f"payout_{creator_id}_{datetime.now().timestamp()}",
            creator_id=creator_id,
            amount=creator_share,
            period_start=period_start,
            period_end=period_end,
            status=PaymentStatus.PENDING,
            payments_included=[],
            created_at=datetime.now()
        )
        
        return payout
    
    async def process_creator_payout(
        self,
        payout: CreatorPayout
    ) -> CreatorPayout:
        """
        Process payout to creator via Stripe Connect
        """
        
        try:
            # Create Stripe Transfer
            transfer = stripe.Transfer.create(
                amount=int(payout.amount * 100),
                currency=payout.currency,
                destination=payout.creator_id,
                metadata={
                    "payout_id": payout.id,
                    "period_start": payout.period_start.isoformat(),
                    "period_end": payout.period_end.isoformat()
                }
            )
            
            payout.stripe_transfer_id = transfer.id
            payout.status = PaymentStatus.COMPLETED
            
            return payout
            
        except stripe.error.StripeError as e:
            payout.status = PaymentStatus.FAILED
            raise Exception(f"Payout failed: {str(e)}")
    
    # ========== Payment Management ==========
    
    async def get_payment_history(
        self,
        user_id: Optional[str] = None,
        creator_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Payment]:
        """
        Get payment history with filters
        """
        # In production, query database
        # For now, return mock data
        return []
    
    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[Decimal] = None
    ) -> Payment:
        """
        Refund a payment
        """
        
        try:
            refund = stripe.Refund.create(
                payment_intent=payment_id,
                amount=int(amount * 100) if amount else None
            )
            
            # Update payment record
            # In production, fetch from database and update
            payment = Payment(
                id=payment_id,
                user_id="",
                agent_id="",
                creator_id="",
                amount=amount or Decimal("0"),
                type=PaymentType.ONE_TIME,
                status=PaymentStatus.REFUNDED,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return payment
            
        except stripe.error.StripeError as e:
            raise Exception(f"Refund failed: {str(e)}")
    
    async def cancel_subscription(
        self,
        subscription_id: str
    ) -> Payment:
        """
        Cancel a subscription
        """
        
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            
            # Update payment record
            payment = Payment(
                id=subscription_id,
                user_id="",
                agent_id="",
                creator_id="",
                amount=Decimal("0"),
                type=PaymentType.SUBSCRIPTION,
                status=PaymentStatus.REFUNDED,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return payment
            
        except stripe.error.StripeError as e:
            raise Exception(f"Subscription cancellation failed: {str(e)}")
    
    # ========== Analytics ==========
    
    async def get_revenue_analytics(
        self,
        creator_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Get revenue analytics for creator
        """
        
        return {
            "total_revenue": 10000.00,
            "platform_fees": 3000.00,
            "creator_earnings": 7000.00,
            "total_transactions": 150,
            "avg_transaction_value": 66.67,
            "top_agents": [
                {"agent_id": "1", "name": "Website Builder", "revenue": 5000},
                {"agent_id": "2", "name": "Research Agent", "revenue": 3000}
            ],
            "revenue_by_day": [
                {"date": "2025-10-22", "revenue": 1200},
                {"date": "2025-10-23", "revenue": 1500},
                # ... more days
            ]
        }


# FastAPI integration
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel as PydanticBaseModel

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

payment_service = PaymentService()

class CreatePaymentRequest(PydanticBaseModel):
    user_id: str
    agent_id: str
    creator_id: str
    amount: float
    payment_method_id: str

class CreateSubscriptionRequest(PydanticBaseModel):
    user_id: str
    agent_id: str
    creator_id: str
    tier: SubscriptionTier
    payment_method_id: str

class UsageBillingRequest(PydanticBaseModel):
    user_id: str
    agent_id: str
    creator_id: str
    runs: int
    cost_per_run: float

@router.post("/one-time")
async def create_payment(request: CreatePaymentRequest):
    """
    Create a one-time payment for agent purchase
    """
    try:
        payment = await payment_service.create_one_time_payment(
            user_id=request.user_id,
            agent_id=request.agent_id,
            creator_id=request.creator_id,
            amount=Decimal(str(request.amount)),
            payment_method_id=request.payment_method_id
        )
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subscription")
async def create_subscription(request: CreateSubscriptionRequest):
    """
    Create a subscription for an agent
    """
    try:
        payment = await payment_service.create_subscription(
            user_id=request.user_id,
            agent_id=request.agent_id,
            creator_id=request.creator_id,
            tier=request.tier,
            payment_method_id=request.payment_method_id
        )
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usage")
async def process_usage_billing(request: UsageBillingRequest):
    """
    Process usage-based billing (pay per run)
    """
    try:
        payment = await payment_service.process_usage_based_billing(
            user_id=request.user_id,
            agent_id=request.agent_id,
            creator_id=request.creator_id,
            runs=request.runs,
            cost_per_run=Decimal(str(request.cost_per_run))
        )
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_payment_history(
    user_id: Optional[str] = None,
    creator_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get payment history
    """
    payments = await payment_service.get_payment_history(
        user_id=user_id,
        creator_id=creator_id,
        agent_id=agent_id,
        limit=limit
    )
    return {"payments": payments}

@router.post("/refund/{payment_id}")
async def refund_payment(payment_id: str, amount: Optional[float] = None):
    """
    Refund a payment
    """
    try:
        payment = await payment_service.refund_payment(
            payment_id=payment_id,
            amount=Decimal(str(amount)) if amount else None
        )
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/subscription/{subscription_id}")
async def cancel_subscription(subscription_id: str):
    """
    Cancel a subscription
    """
    try:
        payment = await payment_service.cancel_subscription(subscription_id)
        return payment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/revenue")
async def get_revenue_analytics(
    creator_id: str,
    start_date: str,
    end_date: str
):
    """
    Get revenue analytics for creator
    """
    analytics = await payment_service.get_revenue_analytics(
        creator_id=creator_id,
        start_date=datetime.fromisoformat(start_date),
        end_date=datetime.fromisoformat(end_date)
    )
    return analytics

@router.get("/payouts/{creator_id}")
async def get_creator_payouts(creator_id: str):
    """
    Get payout history for creator
    """
    # In production, query database
    return {
        "payouts": [],
        "total_earned": 0,
        "pending_payout": 0
    }
