"""
Stripe Client - Wrapper for all Stripe API operations
Handles payments, subscriptions, customers, and webhooks
"""

import stripe
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_TEST_SECRET_KEY') or os.getenv('STRIPE_LIVE_SECRET_KEY')

class StripeClient:
    """
    Centralized Stripe API client for SOTA Agent Tools
    
    Features:
    - Customer management
    - Subscription lifecycle
    - Payment processing
    - Webhook validation
    - Usage metering
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Stripe client"""
        if api_key:
            stripe.api_key = api_key
        
        self.webhook_secret = os.getenv('STRIPE_TEST_WEBHOOK_SECRET')
    
    # ========================================
    # CUSTOMER MANAGEMENT
    # ========================================
    
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.Customer:
        """
        Create a new Stripe customer
        
        Args:
            email: Customer email address
            name: Customer name (optional)
            metadata: Additional metadata (optional)
            
        Returns:
            Stripe Customer object
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {},
                description=f"SOTA Agent Tools - {email}"
            )
            logger.info(f"Created Stripe customer: {customer.id} for {email}")
            return customer
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to create customer: {str(e)}")
            raise Exception(f"Failed to create customer: {str(e)}")
    
    async def get_customer(self, customer_id: str) -> stripe.Customer:
        """Get customer by ID"""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe._error.StripeError as e:
            logger.error(f"Failed to get customer {customer_id}: {str(e)}")
            raise Exception(f"Failed to get customer: {str(e)}")
    
    async def update_customer(
        self,
        customer_id: str,
        **kwargs
    ) -> stripe.Customer:
        """Update customer details"""
        try:
            return stripe.Customer.modify(customer_id, **kwargs)
        except stripe._error.StripeError as e:
            logger.error(f"Failed to update customer {customer_id}: {str(e)}")
            raise Exception(f"Failed to update customer: {str(e)}")
    
    # ========================================
    # SUBSCRIPTION MANAGEMENT
    # ========================================
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: int = 0,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.Subscription:
        """
        Create a new subscription
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID (e.g., price_xxx for Pro/Team tier)
            trial_days: Number of trial days (0 = no trial)
            metadata: Additional metadata
            
        Returns:
            Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                trial_period_days=trial_days if trial_days > 0 else None,
                payment_behavior='default_incomplete',
                payment_settings={'save_default_payment_method': 'on_subscription'},
                expand=['latest_invoice.payment_intent'],
                metadata=metadata or {}
            )
            
            logger.info(f"Created subscription {subscription.id} for customer {customer_id}")
            return subscription
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            raise Exception(f"Failed to create subscription: {str(e)}")
    
    async def get_subscription(self, subscription_id: str) -> stripe.Subscription:
        """Get subscription by ID"""
        try:
            return stripe.Subscription.retrieve(subscription_id, expand=['customer'])
        except stripe._error.StripeError as e:
            logger.error(f"Failed to get subscription {subscription_id}: {str(e)}")
            raise Exception(f"Failed to get subscription: {str(e)}")
    
    async def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str,
        proration_behavior: str = 'always_invoice'
    ) -> stripe.Subscription:
        """
        Update subscription to different tier (upgrade/downgrade)
        
        Args:
            subscription_id: Subscription to update
            new_price_id: New price ID to switch to
            proration_behavior: How to handle prorations
            
        Returns:
            Updated Subscription object
        """
        try:
            # Get current subscription
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update to new price
            updated_sub = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_price_id,
                }],
                proration_behavior=proration_behavior
            )
            
            logger.info(f"Updated subscription {subscription_id} to price {new_price_id}")
            return updated_sub
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to update subscription: {str(e)}")
            raise Exception(f"Failed to update subscription: {str(e)}")
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """
        Cancel a subscription
        
        Args:
            subscription_id: Subscription to cancel
            at_period_end: If True, cancel at end of period; if False, cancel immediately
            
        Returns:
            Canceled Subscription object
        """
        try:
            if at_period_end:
                # Cancel at period end (let them finish out the month)
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
                logger.info(f"Scheduled cancellation for {subscription_id} at period end")
            else:
                # Cancel immediately
                subscription = stripe.Subscription.cancel(subscription_id)
                logger.info(f"Immediately canceled subscription {subscription_id}")
            
            return subscription
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    # ========================================
    # PAYMENT METHODS
    # ========================================
    
    async def attach_payment_method(
        self,
        payment_method_id: str,
        customer_id: str
    ) -> stripe.PaymentMethod:
        """Attach a payment method to a customer"""
        try:
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={'default_payment_method': payment_method_id}
            )
            
            logger.info(f"Attached payment method {payment_method_id} to {customer_id}")
            return payment_method
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to attach payment method: {str(e)}")
            raise Exception(f"Failed to attach payment method: {str(e)}")
    
    # ========================================
    # USAGE METERING (for API calls)
    # ========================================
    
    async def report_usage(
        self,
        subscription_item_id: str,
        quantity: int,
        timestamp: Optional[int] = None,
        action: str = 'increment'
    ) -> stripe.UsageRecord:
        """
        Report usage for metered billing
        
        Args:
            subscription_item_id: The subscription item ID for metered billing
            quantity: Number of API calls to report
            timestamp: Unix timestamp (default: now)
            action: 'increment' or 'set'
            
        Returns:
            UsageRecord object
        """
        try:
            usage_record = stripe.SubscriptionItem.create_usage_record(
                subscription_item_id,
                quantity=quantity,
                timestamp=timestamp or int(datetime.now().timestamp()),
                action=action
            )
            
            logger.debug(f"Reported usage: {quantity} for item {subscription_item_id}")
            return usage_record
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to report usage: {str(e)}")
            raise Exception(f"Failed to report usage: {str(e)}")
    
    async def get_usage(
        self,
        subscription_item_id: str,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get usage records for a subscription item"""
        try:
            usage_records = stripe.SubscriptionItem.list_usage_record_summaries(
                subscription_item_id,
                limit=limit
            )
            return usage_records
        except stripe._error.StripeError as e:
            logger.error(f"Failed to get usage: {str(e)}")
            raise Exception(f"Failed to get usage: {str(e)}")
    
    # ========================================
    # CHECKOUT & PAYMENT LINKS
    # ========================================
    
    async def create_checkout_session(
        self,
        customer_email: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        trial_days: int = 0,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.checkout.Session:
        """
        Create a Stripe Checkout session for self-service signup
        
        Args:
            customer_email: Customer email
            price_id: Price ID to subscribe to
            success_url: Where to redirect on success
            cancel_url: Where to redirect on cancel
            trial_days: Trial period days
            metadata: Additional metadata
            
        Returns:
            Checkout Session object
        """
        try:
            session = stripe.checkout.Session.create(
                mode='subscription',
                customer_email=customer_email,
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=cancel_url,
                subscription_data={
                    'trial_period_days': trial_days if trial_days > 0 else None,
                    'metadata': metadata or {}
                },
                allow_promotion_codes=True,
                billing_address_collection='auto',
                metadata=metadata or {}
            )
            
            logger.info(f"Created checkout session {session.id} for {customer_email}")
            return session
            
        except stripe._error.StripeError as e:
            logger.error(f"Failed to create checkout session: {str(e)}")
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    # ========================================
    # WEBHOOKS
    # ========================================
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> stripe.Event:
        """
        Verify and construct webhook event from Stripe
        
        Args:
            payload: Raw request body as bytes
            signature: Stripe-Signature header value
            
        Returns:
            Verified Stripe Event object
            
        Raises:
            Exception: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            logger.info(f"Verified webhook event: {event.type}")
            return event
            
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            raise Exception("Invalid payload")
        except stripe._error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            raise Exception("Invalid signature")
    
    # ========================================
    # INVOICES
    # ========================================
    
    async def get_upcoming_invoice(
        self,
        customer_id: str,
        subscription_id: Optional[str] = None
    ) -> stripe.Invoice:
        """Get upcoming invoice for customer"""
        try:
            params = {'customer': customer_id}
            if subscription_id:
                params['subscription'] = subscription_id
                
            return stripe.Invoice.upcoming(**params)
        except stripe._error.StripeError as e:
            logger.error(f"Failed to get upcoming invoice: {str(e)}")
            return None
    
    async def list_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[stripe.Invoice]:
        """List invoices for a customer"""
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            return invoices.data
        except stripe._error.StripeError as e:
            logger.error(f"Failed to list invoices: {str(e)}")
            return []
    
    # ========================================
    # UTILITY METHODS
    # ========================================
    
    async def get_account_info(self) -> stripe.Account:
        """Get Stripe account information"""
        try:
            return stripe.Account.retrieve()
        except stripe._error.StripeError as e:
            logger.error(f"Failed to get account info: {str(e)}")
            raise Exception(f"Failed to get account info: {str(e)}")
    
    def get_tier_from_price_id(self, price_id: str) -> str:
        """
        Determine tier from price ID
        
        Returns: 'pro', 'team', 'enterprise', or 'unknown'
        """
        pro_id = os.getenv('STRIPE_PRICE_ID_PRO')
        team_id = os.getenv('STRIPE_PRICE_ID_TEAM')
        enterprise_id = os.getenv('STRIPE_PRICE_ID_ENTERPRISE')
        
        if price_id == pro_id:
            return 'pro'
        elif price_id == team_id:
            return 'team'
        elif price_id == enterprise_id:
            return 'enterprise'
        else:
            return 'unknown'


# Singleton instance
stripe_client = StripeClient()
