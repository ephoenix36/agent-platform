"""
Stripe Product & Pricing Setup Script
Creates all products and prices for SOTA Agent Tools platform
"""

import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.stripe')

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_TEST_SECRET_KEY')

def create_products_and_prices():
    """Create all products and prices for SOTA Agent Tools"""
    
    print("🚀 Setting up Stripe products and pricing...\n")
    
    # ========================================
    # Product 1: Pro Tier
    # ========================================
    print("Creating Pro Tier product...")
    try:
        pro_product = stripe.Product.create(
            name="SOTA Agent Tools - Pro",
            description="Professional tier with 10,000 API calls/month, all 6 systems, email support",
            metadata={
                'tier': 'pro',
                'api_calls_monthly': '10000',
                'features': 'auto-evaluation,memory-eval,prompt-optimization,ood-testing,island-evolution,artifact-debug'
            }
        )
        
        pro_price = stripe.Price.create(
            product=pro_product.id,
            unit_amount=9900,  # $99.00 in cents
            currency='usd',
            recurring={'interval': 'month'},
            metadata={'tier': 'pro'}
        )
        
        print(f"✅ Pro Tier created!")
        print(f"   Product ID: {pro_product.id}")
        print(f"   Price ID: {pro_price.id}")
        print(f"   Amount: ${pro_price.unit_amount / 100}/month\n")
        
    except stripe.error.StripeError as e:
        print(f"❌ Error creating Pro Tier: {e}\n")
        pro_price = None
    
    # ========================================
    # Product 2: Team Tier
    # ========================================
    print("Creating Team Tier product...")
    try:
        team_product = stripe.Product.create(
            name="SOTA Agent Tools - Team",
            description="Team collaboration with 100,000 API calls/month, priority support, custom integrations",
            metadata={
                'tier': 'team',
                'api_calls_monthly': '100000',
                'max_users': '10',
                'features': 'all-pro-features,team-collaboration,priority-support,custom-integrations,analytics'
            }
        )
        
        team_price = stripe.Price.create(
            product=team_product.id,
            unit_amount=49900,  # $499.00 in cents
            currency='usd',
            recurring={'interval': 'month'},
            metadata={'tier': 'team'}
        )
        
        print(f"✅ Team Tier created!")
        print(f"   Product ID: {team_product.id}")
        print(f"   Price ID: {team_price.id}")
        print(f"   Amount: ${team_price.unit_amount / 100}/month\n")
        
    except stripe.error.StripeError as e:
        print(f"❌ Error creating Team Tier: {e}\n")
        team_price = None
    
    # ========================================
    # Product 3: Enterprise Tier
    # ========================================
    print("Creating Enterprise Tier product...")
    try:
        enterprise_product = stripe.Product.create(
            name="SOTA Agent Tools - Enterprise",
            description="Custom enterprise solution with unlimited API calls, on-premise deployment, dedicated support",
            metadata={
                'tier': 'enterprise',
                'api_calls_monthly': 'unlimited',
                'features': 'all-team-features,unlimited-calls,on-premise,dedicated-support,custom-slas,source-access'
            }
        )
        
        # Enterprise pricing is custom, but create a base price
        enterprise_price = stripe.Price.create(
            product=enterprise_product.id,
            unit_amount=500000,  # $5,000 base price
            currency='usd',
            recurring={'interval': 'month'},
            metadata={'tier': 'enterprise', 'custom_pricing': 'true'}
        )
        
        print(f"✅ Enterprise Tier created!")
        print(f"   Product ID: {enterprise_product.id}")
        print(f"   Price ID: {enterprise_price.id}")
        print(f"   Base Amount: ${enterprise_price.unit_amount / 100}/month (custom pricing)\n")
        
    except stripe.error.StripeError as e:
        print(f"❌ Error creating Enterprise Tier: {e}\n")
        enterprise_price = None
    
    # ========================================
    # Product 4: API Call Overage (Metered)
    # ========================================
    print("Creating API Call Overage (metered billing)...")
    try:
        overage_product = stripe.Product.create(
            name="SOTA Agent Tools - API Call Overage",
            description="Additional API calls beyond plan quota",
            metadata={'tier': 'overage', 'metered': 'true'}
        )
        
        overage_price = stripe.Price.create(
            product=overage_product.id,
            unit_amount=1,  # $0.01 per call
            currency='usd',
            recurring={
                'interval': 'month',
                'usage_type': 'metered'
            },
            metadata={'tier': 'overage'}
        )
        
        print(f"✅ API Overage created!")
        print(f"   Product ID: {overage_product.id}")
        print(f"   Price ID: {overage_price.id}")
        print(f"   Amount: ${overage_price.unit_amount / 100} per API call\n")
        
    except stripe.error.StripeError as e:
        print(f"❌ Error creating API Overage: {e}\n")
        overage_price = None
    
    # ========================================
    # Print Summary
    # ========================================
    print("\n" + "="*60)
    print("📋 SETUP COMPLETE! Copy these Price IDs to your .env.stripe:")
    print("="*60)
    
    if pro_price:
        print(f"STRIPE_PRICE_ID_PRO={pro_price.id}")
    if team_price:
        print(f"STRIPE_PRICE_ID_TEAM={team_price.id}")
    if enterprise_price:
        print(f"STRIPE_PRICE_ID_ENTERPRISE={enterprise_price.id}")
    if overage_price:
        print(f"STRIPE_PRICE_ID_METERED={overage_price.id}")
    
    print("="*60)
    print("\n✅ All products configured in Stripe!")
    print("🔗 View in dashboard: https://dashboard.stripe.com/test/products")
    print("\n🎯 Next step: Copy the Price IDs above to your .env.stripe file")
    
    return {
        'pro': pro_price.id if pro_price else None,
        'team': team_price.id if team_price else None,
        'enterprise': enterprise_price.id if enterprise_price else None,
        'overage': overage_price.id if overage_price else None
    }

if __name__ == "__main__":
    try:
        # Verify API key works
        print("🔑 Verifying Stripe API key...")
        account = stripe.Account.retrieve()
        print(f"✅ Connected to Stripe account: {account.email or account.id}\n")
        
        # Create products and prices
        price_ids = create_products_and_prices()
        
        # Success!
        print("\n🎉 Setup complete! Your Stripe account is ready for billing! 🚀")
        
    except stripe.error.AuthenticationError:
        print("❌ Authentication failed. Please check your STRIPE_TEST_SECRET_KEY in .env.stripe")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
