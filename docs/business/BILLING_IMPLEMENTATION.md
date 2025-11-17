# 💳 Stripe Billing Integration - Implementation Plan

**Priority:** CRITICAL (blocks all revenue)  
**Timeline:** 2-3 days  
**Complexity:** Medium  
**Dependencies:** None

---

## 📋 Implementation Checklist

### Phase 1: Stripe Setup (2-4 hours)

- [ ] Create Stripe account (or use existing)
- [ ] Get API keys (test + production)
- [ ] Create products in Stripe Dashboard
- [ ] Create prices for each tier
- [ ] Set up webhook endpoints
- [ ] Configure tax settings
- [ ] Add payment methods

---

## 🏗️ Architecture Overview

```
User Sign-up
    ↓
Create Stripe Customer
    ↓
Select Pricing Tier
    ↓
Create Subscription
    ↓
Generate API Key
    ↓
User Can Access API
    ↓
Track Usage (metering)
    ↓
Webhook: Payment Success/Failure
    ↓
Update User Status
```

---

## 📦 Required Dependencies

```bash
# Backend (FastAPI)
pip install stripe python-dotenv

# Database migrations
pip install alembic sqlalchemy

# Frontend (React)
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🗄️ Database Schema

```sql
-- Users table (extend existing)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- For display: "sk_live_abc..."
    name VARCHAR(255),
    tier VARCHAR(50) NOT NULL, -- free, pro, team, enterprise
    rate_limit_per_minute INTEGER NOT NULL,
    monthly_quota INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);

-- Usage tracking table
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    billing_period DATE NOT NULL -- For aggregation
);

-- Create indexes for performance
CREATE INDEX idx_api_usage_user_period ON api_usage(user_id, billing_period);
CREATE INDEX idx_api_usage_key ON api_usage(api_key_id, timestamp);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

---

## 🔑 Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs (from Stripe Dashboard)
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_TEAM=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# API Configuration
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

---

## 💻 Backend Implementation

### File Structure
```
apps/api/app/
├── billing/
│   ├── __init__.py
│   ├── stripe_client.py      # Stripe API wrapper
│   ├── subscription.py        # Subscription management
│   ├── webhooks.py           # Stripe webhook handlers
│   └── models.py             # Database models
├── auth/
│   ├── api_keys.py           # API key generation & validation
│   └── rate_limiting.py      # Rate limiting logic
├── usage/
│   ├── tracking.py           # Usage tracking
│   └── analytics.py          # Usage analytics
└── routers/
    ├── billing.py            # Billing endpoints
    └── usage.py              # Usage endpoints
```

### Step 1: Stripe Client (stripe_client.py)

```python
"""
Stripe API client wrapper
apps/api/app/billing/stripe_client.py
"""

import stripe
from typing import Optional, Dict, Any
from datetime import datetime
import os

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeClient:
    """Wrapper for Stripe API operations"""
    
    def __init__(self):
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.Customer:
        """Create a new Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create customer: {str(e)}")
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: int = 0
    ) -> stripe.Subscription:
        """Create a new subscription"""
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                trial_period_days=trial_days if trial_days > 0 else None,
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent']
            )
            return subscription
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create subscription: {str(e)}")
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """Cancel a subscription"""
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    async def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str
    ) -> stripe.Subscription:
        """Update subscription to different tier"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_price_id,
                }],
                proration_behavior='always_invoice'
            )
            return subscription
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to update subscription: {str(e)}")
    
    async def get_usage(
        self,
        subscription_item_id: str
    ) -> Dict[str, Any]:
        """Get usage for metered billing"""
        try:
            usage_records = stripe.SubscriptionItem.list_usage_record_summaries(
                subscription_item_id
            )
            return usage_records
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to get usage: {str(e)}")
    
    async def report_usage(
        self,
        subscription_item_id: str,
        quantity: int,
        timestamp: Optional[int] = None
    ) -> stripe.UsageRecord:
        """Report usage for metered billing"""
        try:
            usage_record = stripe.SubscriptionItem.create_usage_record(
                subscription_item_id,
                quantity=quantity,
                timestamp=timestamp or int(datetime.now().timestamp()),
                action='increment'
            )
            return usage_record
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to report usage: {str(e)}")
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> stripe.Event:
        """Verify webhook signature"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            return event
        except ValueError as e:
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise Exception("Invalid signature")

# Singleton instance
stripe_client = StripeClient()
```

### Step 2: Subscription Management (subscription.py)

```python
"""
Subscription management logic
apps/api/app/billing/subscription.py
"""

from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .stripe_client import stripe_client
from .models import User, Subscription, APIKey
import secrets
import hashlib

class SubscriptionManager:
    """Manage user subscriptions and API keys"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_subscription(
        self,
        user_id: str,
        tier: str,
        trial_days: int = 0
    ) -> dict:
        """Create new subscription for user"""
        
        # Get user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception("User not found")
        
        # Create Stripe customer if doesn't exist
        if not user.stripe_customer_id:
            customer = await stripe_client.create_customer(
                email=user.email,
                name=user.name,
                metadata={'user_id': str(user.id)}
            )
            user.stripe_customer_id = customer.id
            self.db.commit()
        
        # Get price ID for tier
        price_id = self._get_price_id(tier)
        
        # Create Stripe subscription
        stripe_sub = await stripe_client.create_subscription(
            customer_id=user.stripe_customer_id,
            price_id=price_id,
            trial_days=trial_days
        )
        
        # Save to database
        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=stripe_sub.id,
            stripe_price_id=price_id,
            status=stripe_sub.status,
            current_period_start=datetime.fromtimestamp(stripe_sub.current_period_start),
            current_period_end=datetime.fromtimestamp(stripe_sub.current_period_end)
        )
        self.db.add(subscription)
        
        # Generate API key
        api_key = await self._generate_api_key(user.id, tier)
        
        self.db.commit()
        
        return {
            'subscription_id': subscription.id,
            'api_key': api_key['key'],
            'client_secret': stripe_sub.latest_invoice.payment_intent.client_secret
        }
    
    async def cancel_subscription(
        self,
        user_id: str,
        immediately: bool = False
    ) -> dict:
        """Cancel user subscription"""
        
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == 'active'
        ).first()
        
        if not subscription:
            raise Exception("No active subscription found")
        
        # Cancel in Stripe
        stripe_sub = await stripe_client.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=not immediately
        )
        
        # Update database
        subscription.status = stripe_sub.status
        subscription.cancel_at_period_end = stripe_sub.cancel_at_period_end
        self.db.commit()
        
        return {
            'subscription_id': subscription.id,
            'status': subscription.status,
            'ends_at': subscription.current_period_end
        }
    
    async def upgrade_subscription(
        self,
        user_id: str,
        new_tier: str
    ) -> dict:
        """Upgrade/downgrade subscription"""
        
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == 'active'
        ).first()
        
        if not subscription:
            raise Exception("No active subscription found")
        
        # Get new price ID
        new_price_id = self._get_price_id(new_tier)
        
        # Update in Stripe
        stripe_sub = await stripe_client.update_subscription(
            subscription.stripe_subscription_id,
            new_price_id
        )
        
        # Update database
        subscription.stripe_price_id = new_price_id
        subscription.status = stripe_sub.status
        
        # Update API key tier
        api_key = self.db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.is_active == True
        ).first()
        
        if api_key:
            api_key.tier = new_tier
            api_key.rate_limit_per_minute = self._get_rate_limit(new_tier)
            api_key.monthly_quota = self._get_monthly_quota(new_tier)
        
        self.db.commit()
        
        return {
            'subscription_id': subscription.id,
            'new_tier': new_tier,
            'status': subscription.status
        }
    
    async def _generate_api_key(
        self,
        user_id: str,
        tier: str
    ) -> dict:
        """Generate new API key"""
        
        # Generate secure random key
        key = f"sk_live_{secrets.token_urlsafe(32)}"
        
        # Hash for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Create API key record
        api_key = APIKey(
            user_id=user_id,
            key_hash=key_hash,
            key_prefix=key[:20],
            tier=tier,
            rate_limit_per_minute=self._get_rate_limit(tier),
            monthly_quota=self._get_monthly_quota(tier)
        )
        
        self.db.add(api_key)
        
        return {
            'key': key,
            'tier': tier,
            'rate_limit': api_key.rate_limit_per_minute
        }
    
    def _get_price_id(self, tier: str) -> str:
        """Get Stripe price ID for tier"""
        import os
        price_ids = {
            'pro': os.getenv('STRIPE_PRICE_ID_PRO'),
            'team': os.getenv('STRIPE_PRICE_ID_TEAM'),
            'enterprise': os.getenv('STRIPE_PRICE_ID_ENTERPRISE')
        }
        return price_ids.get(tier.lower())
    
    def _get_rate_limit(self, tier: str) -> int:
        """Get rate limit for tier"""
        limits = {
            'free': 10,      # 10 requests/min
            'pro': 100,      # 100 requests/min
            'team': 500,     # 500 requests/min
            'enterprise': 0  # Unlimited
        }
        return limits.get(tier.lower(), 10)
    
    def _get_monthly_quota(self, tier: str) -> int:
        """Get monthly quota for tier"""
        quotas = {
            'free': 100,
            'pro': 10000,
            'team': 100000,
            'enterprise': 0  # Unlimited
        }
        return quotas.get(tier.lower(), 100)
```

---

## 🎯 Next Steps

Once you approve this plan, I'll:

1. ✅ Implement the complete billing infrastructure
2. ✅ Add API key authentication middleware
3. ✅ Create usage tracking system
4. ✅ Build webhook handlers
5. ✅ Implement rate limiting
6. ✅ Create billing dashboard UI
7. ✅ Add Stripe Checkout integration

**Ready to start building the revenue engine?** 💰

This will enable us to:
- Accept payments in 2-3 days
- Track usage automatically
- Enforce rate limits by tier
- Handle subscription lifecycle
- Generate immediate revenue

**Shall I proceed with the implementation?** 🚀
