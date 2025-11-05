"""
Stripe Webhook Handlers
Process Stripe events for payment lifecycle
"""

from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from .models import User, Subscription, WebhookEvent, APIKey
from .stripe_client import stripe_client
import logging
import stripe

logger = logging.getLogger(__name__)


class WebhookHandler:
    """
    Handle Stripe webhook events
    
    Supported events:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - customer.subscription.trial_will_end
    - invoice.paid
    - invoice.payment_failed
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - checkout.session.completed
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.stripe = stripe_client
    
    async def handle_webhook(
        self,
        payload: bytes,
        signature: str
    ) -> Dict[str, Any]:
        """
        Main webhook handler - verifies and routes events
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header
            
        Returns:
            Processing result
        """
        try:
            # Verify webhook signature
            event = self.stripe.verify_webhook_signature(payload, signature)
            
            # Check if we've already processed this event (idempotency)
            existing = self.db.query(WebhookEvent).filter(
                WebhookEvent.stripe_event_id == event.id
            ).first()
            
            if existing and existing.processed:
                logger.info(f"Event {event.id} already processed, skipping")
                return {'status': 'duplicate', 'event_id': event.id}
            
            # Store webhook event
            webhook_event = WebhookEvent(
                stripe_event_id=event.id,
                event_type=event.type,
                payload=event.to_dict(),
                processed=False
            )
            
            if not existing:
                self.db.add(webhook_event)
                self.db.commit()
            else:
                webhook_event = existing
            
            # Route to appropriate handler
            try:
                result = await self._route_event(event)
                
                # Mark as processed
                webhook_event.processed = True
                webhook_event.processed_at = datetime.utcnow()
                self.db.commit()
                
                logger.info(f"Successfully processed event {event.id} ({event.type})")
                return {'status': 'success', 'event_id': event.id, 'result': result}
                
            except Exception as e:
                # Store error
                webhook_event.error_message = str(e)
                webhook_event.retry_count += 1
                self.db.commit()
                
                logger.error(f"Error processing event {event.id}: {str(e)}")
                raise
                
        except Exception as e:
            logger.error(f"Webhook error: {str(e)}")
            raise
    
    async def _route_event(self, event: stripe.Event) -> Dict[str, Any]:
        """Route event to appropriate handler"""
        
        handlers = {
            # Subscriptions
            'customer.subscription.created': self._handle_subscription_created,
            'customer.subscription.updated': self._handle_subscription_updated,
            'customer.subscription.deleted': self._handle_subscription_deleted,
            'customer.subscription.trial_will_end': self._handle_trial_ending,
            
            # Invoices
            'invoice.paid': self._handle_invoice_paid,
            'invoice.payment_failed': self._handle_payment_failed,
            
            # Payment Intents
            'payment_intent.succeeded': self._handle_payment_succeeded,
            'payment_intent.payment_failed': self._handle_payment_failed_intent,
            
            # Checkout
            'checkout.session.completed': self._handle_checkout_completed,
        }
        
        handler = handlers.get(event.type)
        
        if handler:
            return await handler(event.data.object)
        else:
            logger.warning(f"No handler for event type: {event.type}")
            return {'status': 'unhandled', 'type': event.type}
    
    # ========================================
    # SUBSCRIPTION EVENTS
    # ========================================
    
    async def _handle_subscription_created(self, subscription: stripe.Subscription) -> Dict:
        """Handle new subscription creation"""
        logger.info(f"Processing subscription created: {subscription.id}")
        
        # Get or create user
        user = self.db.query(User).filter(
            User.stripe_customer_id == subscription.customer
        ).first()
        
        if not user:
            # Create user from subscription metadata if available
            customer = await self.stripe.get_customer(subscription.customer)
            user = User(
                email=customer.email,
                name=customer.name,
                stripe_customer_id=customer.id,
                email_verified=True
            )
            self.db.add(user)
            self.db.flush()
        
        # Determine tier from price
        tier = self.stripe.get_tier_from_price_id(subscription.items.data[0].price.id)
        
        # Create subscription record
        sub = Subscription(
            user_id=user.id,
            stripe_subscription_id=subscription.id,
            stripe_customer_id=subscription.customer,
            stripe_price_id=subscription.items.data[0].price.id,
            status=subscription.status,
            tier=tier,
            current_period_start=datetime.fromtimestamp(subscription.current_period_start),
            current_period_end=datetime.fromtimestamp(subscription.current_period_end),
            trial_start=datetime.fromtimestamp(subscription.trial_start) if subscription.trial_start else None,
            trial_end=datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None
        )
        self.db.add(sub)
        self.db.commit()
        
        logger.info(f"Created subscription record for user {user.email}")
        
        return {'user_id': str(user.id), 'tier': tier}
    
    async def _handle_subscription_updated(self, subscription: stripe.Subscription) -> Dict:
        """Handle subscription updates (tier changes, status changes, etc.)"""
        logger.info(f"Processing subscription updated: {subscription.id}")
        
        sub = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if not sub:
            logger.warning(f"Subscription {subscription.id} not found in database")
            return {'status': 'not_found'}
        
        # Update fields
        old_tier = sub.tier
        new_tier = self.stripe.get_tier_from_price_id(subscription.items.data[0].price.id)
        
        sub.status = subscription.status
        sub.tier = new_tier
        sub.stripe_price_id = subscription.items.data[0].price.id
        sub.current_period_start = datetime.fromtimestamp(subscription.current_period_start)
        sub.current_period_end = datetime.fromtimestamp(subscription.current_period_end)
        sub.cancel_at_period_end = subscription.cancel_at_period_end
        
        # If subscription was canceled
        if subscription.status == 'canceled' and not sub.canceled_at:
            sub.canceled_at = datetime.utcnow()
            
            # Deactivate API keys
            self.db.query(APIKey).filter(
                APIKey.user_id == sub.user_id,
                APIKey.is_active == True
            ).update({'is_active': False, 'revoked_at': datetime.utcnow()})
        
        # If tier changed, update API key limits
        if old_tier != new_tier:
            self.db.query(APIKey).filter(
                APIKey.user_id == sub.user_id,
                APIKey.is_active == True
            ).update({
                'tier': new_tier,
                'rate_limit_per_minute': self._get_rate_limit(new_tier),
                'monthly_quota': self._get_monthly_quota(new_tier)
            })
        
        self.db.commit()
        
        logger.info(f"Updated subscription {subscription.id}: {old_tier} -> {new_tier}, status: {subscription.status}")
        
        return {
            'old_tier': old_tier,
            'new_tier': new_tier,
            'status': subscription.status
        }
    
    async def _handle_subscription_deleted(self, subscription: stripe.Subscription) -> Dict:
        """Handle subscription cancellation/deletion"""
        logger.info(f"Processing subscription deleted: {subscription.id}")
        
        sub = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if not sub:
            logger.warning(f"Subscription {subscription.id} not found in database")
            return {'status': 'not_found'}
        
        # Update status
        sub.status = 'canceled'
        sub.canceled_at = datetime.utcnow()
        
        # Deactivate all API keys
        self.db.query(APIKey).filter(
            APIKey.user_id == sub.user_id,
            APIKey.is_active == True
        ).update({'is_active': False, 'revoked_at': datetime.utcnow()})
        
        self.db.commit()
        
        logger.info(f"Deleted subscription {subscription.id}")
        
        # TODO: Send cancellation email
        
        return {'user_id': str(sub.user_id)}
    
    async def _handle_trial_ending(self, subscription: stripe.Subscription) -> Dict:
        """Handle trial ending soon (3 days before)"""
        logger.info(f"Trial ending soon for subscription: {subscription.id}")
        
        sub = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if sub:
            # TODO: Send trial ending email
            logger.info(f"Trial ending reminder sent for user {sub.user_id}")
        
        return {'subscription_id': subscription.id}
    
    # ========================================
    # PAYMENT EVENTS
    # ========================================
    
    async def _handle_invoice_paid(self, invoice: stripe.Invoice) -> Dict:
        """Handle successful payment"""
        logger.info(f"Processing invoice paid: {invoice.id}")
        
        if invoice.subscription:
            sub = self.db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
            
            if sub:
                # Ensure subscription is active
                if sub.status != 'active':
                    sub.status = 'active'
                    self.db.commit()
                
                # TODO: Send payment receipt email
                logger.info(f"Payment successful for subscription {sub.id}")
        
        return {'invoice_id': invoice.id, 'amount': invoice.amount_paid}
    
    async def _handle_payment_failed(self, invoice: stripe.Invoice) -> Dict:
        """Handle failed payment"""
        logger.error(f"Processing payment failed: {invoice.id}")
        
        if invoice.subscription:
            sub = self.db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
            
            if sub:
                # Update status to past_due
                sub.status = 'past_due'
                self.db.commit()
                
                # TODO: Send payment failed email
                logger.error(f"Payment failed for subscription {sub.id}")
        
        return {'invoice_id': invoice.id, 'status': 'failed'}
    
    async def _handle_payment_succeeded(self, payment_intent: stripe.PaymentIntent) -> Dict:
        """Handle successful payment intent"""
        logger.info(f"Payment intent succeeded: {payment_intent.id}")
        
        # Payment succeeded - Stripe will handle subscription activation
        
        return {'payment_intent_id': payment_intent.id}
    
    async def _handle_payment_failed_intent(self, payment_intent: stripe.PaymentIntent) -> Dict:
        """Handle failed payment intent"""
        logger.error(f"Payment intent failed: {payment_intent.id}")
        
        # TODO: Alert user of payment failure
        
        return {'payment_intent_id': payment_intent.id, 'status': 'failed'}
    
    # ========================================
    # CHECKOUT EVENTS
    # ========================================
    
    async def _handle_checkout_completed(self, session: stripe.checkout.Session) -> Dict:
        """Handle completed checkout session"""
        logger.info(f"Processing checkout completed: {session.id}")
        
        if session.subscription:
            # Subscription checkout - subscription will be created via webhook
            logger.info(f"Checkout completed for subscription: {session.subscription}")
        
        # TODO: Send welcome email
        
        return {'session_id': session.id, 'subscription_id': session.subscription}
    
    # ========================================
    # UTILITIES
    # ========================================
    
    def _get_rate_limit(self, tier: str) -> int:
        """Get rate limit for tier"""
        limits = {
            'free': 10,
            'pro': 100,
            'team': 500,
            'enterprise': 0
        }
        return limits.get(tier.lower(), 10)
    
    def _get_monthly_quota(self, tier: str) -> int:
        """Get monthly quota for tier"""
        quotas = {
            'free': 100,
            'pro': 10000,
            'team': 100000,
            'enterprise': 0
        }
        return quotas.get(tier.lower(), 100)


# Webhook endpoint handler
async def process_webhook(
    db: Session,
    payload: bytes,
    signature: str
) -> Dict[str, Any]:
    """
    Process incoming Stripe webhook
    
    Args:
        db: Database session
        payload: Raw request body
        signature: Stripe-Signature header
        
    Returns:
        Processing result
    """
    handler = WebhookHandler(db)
    return await handler.handle_webhook(payload, signature)
