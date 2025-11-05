# 🔐 Payment Infrastructure Setup Guide

**Created:** October 31, 2025  
**Purpose:** Complete setup of Stripe and payment infrastructure  
**Status:** 🚀 IN PROGRESS

---

## 📋 Setup Checklist

### Phase 1: Stripe Account Setup ✅
- [x] Navigate to Stripe.com
- [ ] Create account with business email
- [ ] Verify email address
- [ ] Complete business profile
- [ ] Add business details
- [ ] Connect bank account (for payouts)

### Phase 2: Product & Pricing Configuration
- [ ] Create "Pro" tier product ($99/month)
- [ ] Create "Team" tier product ($499/month)
- [ ] Create "Enterprise" tier (custom pricing)
- [ ] Set up metered billing for API calls
- [ ] Configure trial periods (optional)

### Phase 3: API Keys & Webhooks
- [ ] Get Test API keys (for development)
- [ ] Get Live API keys (for production)
- [ ] Set up webhook endpoint URLs
- [ ] Configure webhook events
- [ ] Test webhook delivery

### Phase 4: Tax & Compliance
- [ ] Enable Stripe Tax
- [ ] Configure tax settings by region
- [ ] Set up sales tax collection
- [ ] Configure VAT handling (EU)
- [ ] Review compliance requirements

### Phase 5: Security & Testing
- [ ] Enable 2FA on Stripe account
- [ ] Test payment flow in test mode
- [ ] Verify webhook signatures
- [ ] Test subscription lifecycle
- [ ] Validate refund process

---

## 🔑 Account Credentials

**⚠️ SENSITIVE - STORE SECURELY ⚠️**

### Stripe Account Details
```
Business Name: SOTA Agent Tools
Email: [TO BE FILLED]
Country: United States
Account Type: Business
```

### API Keys (Test Mode)
```
Publishable Key: pk_test_[TO BE FILLED]
Secret Key: sk_test_[TO BE FILLED]
Webhook Secret: whsec_[TO BE FILLED]
```

### API Keys (Live Mode)
```
Publishable Key: pk_live_[TO BE FILLED]
Secret Key: sk_live_[TO BE FILLED]
Webhook Secret: whsec_[TO BE FILLED]
```

### Product IDs
```
Pro Tier ($99/mo): price_[TO BE FILLED]
Team Tier ($499/mo): price_[TO BE FILLED]
Enterprise Tier: price_[TO BE FILLED]
Metered Billing (API calls): price_[TO BE FILLED]
```

---

## 🏗️ Product Configuration

### Product 1: Pro Tier

**Details:**
- Name: SOTA Agent Tools - Pro
- Description: Professional tier with 10,000 API calls/month
- Price: $99/month
- Billing: Recurring monthly
- Trial: 14 days (optional)

**Features:**
- 10,000 API calls/month
- All 6 systems (evaluation, optimization, OOD testing, etc.)
- Email support (48h response)
- Private projects
- API access

---

### Product 2: Team Tier

**Details:**
- Name: SOTA Agent Tools - Team
- Description: Team collaboration with 100,000 API calls/month
- Price: $499/month
- Billing: Recurring monthly
- Trial: 14 days (optional)

**Features:**
- 100,000 API calls/month
- Team collaboration (10 users)
- Priority support (24h response)
- Dedicated Slack channel
- Custom integrations
- Advanced analytics

---

### Product 3: Enterprise Tier

**Details:**
- Name: SOTA Agent Tools - Enterprise
- Description: Custom enterprise solution
- Price: Custom (starting at $5,000/month)
- Billing: Annual contract
- Trial: Custom POC

**Features:**
- Unlimited API calls
- On-premise deployment option
- Dedicated account manager
- Custom SLAs (99.9% uptime)
- Source code access
- Custom model training

---

### Product 4: Metered Billing (Overage)

**Details:**
- Name: API Call Overage
- Description: Additional API calls beyond plan quota
- Price: $0.01 per call (Pro/Team), $0.005 per call (Enterprise)
- Billing: Usage-based

---

## 🔗 Webhook Configuration

### Webhook Endpoints

**Development:**
```
URL: https://dev.sotatools.com/api/webhooks/stripe
Events: All subscription events
```

**Production:**
```
URL: https://api.sotatools.com/api/webhooks/stripe
Events: All subscription events
```

### Required Webhook Events

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.trial_will_end
invoice.created
invoice.paid
invoice.payment_failed
payment_intent.succeeded
payment_intent.payment_failed
checkout.session.completed
```

---

## 💰 Tax Configuration

### US Sales Tax
- Enable automatic tax calculation
- Register in required states
- Threshold monitoring enabled

### International VAT
- Enable VAT collection (EU)
- Reverse charge mechanism
- Digital services tax compliance

---

## 🔒 Security Best Practices

### Account Security
1. ✅ Enable 2-factor authentication
2. ✅ Use strong unique password
3. ✅ Limit team member access
4. ✅ Review access logs regularly
5. ✅ Set up alerts for suspicious activity

### API Key Security
1. ✅ Never commit keys to git
2. ✅ Store in environment variables
3. ✅ Rotate keys regularly
4. ✅ Use test keys in development
5. ✅ Restrict key permissions

### Webhook Security
1. ✅ Verify webhook signatures
2. ✅ Use HTTPS endpoints only
3. ✅ Validate event data
4. ✅ Implement idempotency
5. ✅ Rate limit webhook handlers

---

## 🧪 Testing Checklist

### Test Mode Validation
- [ ] Create test customer
- [ ] Subscribe to Pro tier (test)
- [ ] Verify webhook delivery
- [ ] Test upgrade to Team tier
- [ ] Test downgrade to Pro tier
- [ ] Test subscription cancellation
- [ ] Test payment failure handling
- [ ] Test metered billing
- [ ] Verify invoice generation
- [ ] Test refund process

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure: 4000 0027 6000 3184
```

---

## 📊 Dashboard Setup

### Key Metrics to Monitor
1. Monthly Recurring Revenue (MRR)
2. Customer acquisition cost (CAC)
3. Churn rate
4. Average revenue per user (ARPU)
5. Trial-to-paid conversion rate
6. Payment success rate
7. Webhook delivery success

### Reports to Configure
- Daily revenue report
- Weekly cohort analysis
- Monthly churn analysis
- Failed payment tracking
- Usage analytics

---

## 🚀 Go-Live Checklist

Before switching to production:

### Business Setup
- [ ] Business verified in Stripe
- [ ] Bank account connected
- [ ] Payout schedule configured
- [ ] Tax settings verified
- [ ] Terms of service updated

### Technical Setup
- [ ] All tests passing
- [ ] Webhooks delivering successfully
- [ ] Error handling implemented
- [ ] Monitoring/alerts configured
- [ ] Backup/recovery tested

### Legal/Compliance
- [ ] Privacy policy updated
- [ ] Terms of service include payment terms
- [ ] Refund policy documented
- [ ] GDPR compliance verified
- [ ] PCI DSS compliance confirmed

---

## 📞 Support Resources

### Stripe Support
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com
- Status: https://status.stripe.com
- Discord: https://stripe.com/discord

### Emergency Contacts
- Stripe Support: support@stripe.com
- Phone: 1-888-926-2289 (US)
- Critical Issues: Create ticket in dashboard

---

## 🎯 Next Steps

1. **Complete account setup** (this session)
2. **Configure products/pricing** (30 minutes)
3. **Get API keys** (5 minutes)
4. **Set up webhooks** (15 minutes)
5. **Test payment flow** (1 hour)
6. **Deploy to production** (when ready)

---

## 📝 Notes & Decisions

### Pricing Decisions
- **Free tier:** 100 API calls/month (growth engine)
- **Pro tier:** $99/month (target: solo developers)
- **Team tier:** $499/month (target: small teams)
- **Enterprise:** Custom pricing (target: large orgs)

### Trial Period Decision
- **Recommendation:** 14-day free trial for Pro/Team tiers
- **Rationale:** Reduces friction, increases conversion
- **Risk mitigation:** Require credit card upfront

### Open Source Strategy
- **Recommendation:** Open-core model
- **Free tier:** Community edition (limited features)
- **Paid tiers:** Advanced features, support, SLAs
- **Enterprise:** On-premise, custom features

---

## ✅ Status Updates

**Phase 1: Account Creation** - IN PROGRESS
- Started: October 31, 2025
- Browser open on Stripe sign-up page
- Ready to create account

**Next Action:** Fill in account details and create Stripe account

---

**Last Updated:** October 31, 2025  
**Updated By:** AI Assistant with Business Strategy Team  
**Next Review:** After account creation complete
