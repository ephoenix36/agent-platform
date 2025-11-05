# 🚀 SOTA Tools - Complete Deployment Guide

**Status:** Ready for Production Deployment  
**Date:** November 1, 2025  
**Sprint:** Day 2 Complete

---

## 📋 Deployment Checklist

### ✅ Completed
- [x] Backend API (4,000+ lines, production-ready)
- [x] Frontend Dashboard (4 components, full functionality)
- [x] Landing Page (Hero, Features, Pricing)
- [x] Sign-up Flow with Stripe Integration
- [x] Billing Success Page
- [x] API Client Library
- [x] UI Component Library
- [x] Stripe Products Configured

### ⏳ Pending
- [ ] Backend Deployment (Render/Railway)
- [ ] Database Setup & Migrations
- [ ] Frontend Deployment (Vercel)
- [ ] Webhook Configuration
- [ ] End-to-End Testing

---

## 🏗️ Backend Deployment (FastAPI)

### Option 1: Render.com (Recommended)

#### 1. Create PostgreSQL Database

```bash
# On Render.com:
1. Go to https://dashboard.render.com
2. New > PostgreSQL
3. Name: sota-tools-db
4. Region: Oregon (or closest to users)
5. Plan: Starter ($7/month) or Free
6. Copy DATABASE_URL
```

#### 2. Create Web Service

```bash
# On Render.com:
1. New > Web Service
2. Connect your GitHub repository
3. Build Command: pip install -r requirements.txt
4. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
5. Environment: Python 3.11
6. Plan: Starter ($7/month)
```

#### 3. Set Environment Variables

```env
# Database
DATABASE_URL=<from_render_postgres>

# Stripe
STRIPE_TEST_SECRET_KEY=<your_stripe_test_secret_key>
STRIPE_TEST_WEBHOOK_SECRET=whsec_<from_stripe_webhook>
STRIPE_PRICE_ID_PRO=<your_pro_price_id>
STRIPE_PRICE_ID_TEAM=<your_team_price_id>
STRIPE_PRICE_ID_ENTERPRISE=<your_enterprise_price_id>

# Redis (optional - can use Upstash free tier)
REDIS_HOST=<upstash_host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash_password>

# Application
ENVIRONMENT=production
SECRET_KEY=<generate_secure_random_key>
ALLOWED_ORIGINS=https://sotatools.com,https://www.sotatools.com
```

#### 4. Run Database Migrations

```bash
# SSH into Render instance or use Render Shell
alembic upgrade head
```

#### 5. Configure Stripe Webhook

```bash
# In Stripe Dashboard:
1. Go to Developers > Webhooks
2. Add endpoint: https://your-render-url.onrender.com/api/v1/billing/webhook
3. Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
   - payment_intent.succeeded
4. Copy webhook secret to STRIPE_TEST_WEBHOOK_SECRET
```

### Option 2: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd agent-platform/apps/api
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up

# Set environment variables via dashboard
railway open
```

---

## 🌐 Frontend Deployment (Next.js on Vercel)

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd agent-platform/apps/web
vercel
```

### 2. Configure Environment Variables

Go to Vercel Dashboard > Your Project > Settings > Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SOSH12cbZUZPiYvGlX6AnX6XDegMTceMGcC5PHUBqlvlRR3oJYWMbDsUL7gpTWHtB5u2eAa5C9qKt7Tisf0AeID00g1luRezQ
NEXT_PUBLIC_APP_URL=https://sotatools.com
NEXT_PUBLIC_APP_NAME=SOTA Tools
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3. Deploy Production

```bash
vercel --prod
```

### 4. Configure Custom Domain (Optional)

```bash
# In Vercel Dashboard:
1. Settings > Domains
2. Add: sotatools.com and www.sotatools.com
3. Update DNS records with your registrar
```

---

## 🗄️ Database Setup

### Create Tables

The backend uses Alembic for migrations. Tables are in `app/billing/models.py`:

```python
# Tables that will be created:
- users
- subscriptions  
- api_keys
- api_usage
- webhook_events
- usage_aggregates
```

### Run Migrations

```bash
# On production server:
cd app
alembic upgrade head

# Verify tables
psql $DATABASE_URL -c "\dt"
```

### Seed Initial Data (Optional)

```python
# Create admin user or test data if needed
python scripts/seed_database.py
```

---

## 🔐 Redis Setup (Rate Limiting)

### Option 1: Upstash (Recommended)

```bash
1. Go to https://upstash.com
2. Create free Redis database
3. Copy connection details
4. Add to environment variables:
   REDIS_HOST=...
   REDIS_PORT=6379
   REDIS_PASSWORD=...
```

### Option 2: Redis Cloud

```bash
1. Go to https://redis.com/try-free
2. Create free 30MB database
3. Copy connection details
```

### Option 3: Skip Redis (Development Only)

```python
# In app/auth/rate_limiting.py
# Use in-memory dict instead of Redis (NOT for production)
```

---

## ✅ Post-Deployment Verification

### 1. Backend Health Check

```bash
curl https://your-backend.onrender.com/api/v1/billing/health
# Expected: {"status": "healthy", "database": "connected"}
```

### 2. Frontend Accessibility

```bash
curl -I https://sotatools.com
# Expected: 200 OK
```

### 3. Test Stripe Checkout

```bash
1. Go to https://sotatools.com
2. Click "Start Free Trial"
3. Select Pro plan
4. Use test card: 4242 4242 4242 4242
5. Verify redirect to success page
6. Check Stripe Dashboard for payment
```

### 4. Test Webhook Delivery

```bash
# In Stripe Dashboard:
1. Go to Developers > Webhooks
2. Click on your webhook endpoint
3. Send test event
4. Verify 200 response
5. Check database for webhook_events record
```

### 5. Test API Key Generation

```bash
1. Complete checkout flow
2. Go to dashboard
3. Navigate to API Keys tab
4. Verify key is displayed
5. Copy key and test API call:

curl -X POST https://your-backend.onrender.com/api/v1/evaluate \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"agent": "test"}'
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
railway logs  # or Render logs

# Common issues:
1. DATABASE_URL not set
2. Missing dependencies in requirements.txt
3. Alembic migrations not run
4. Port binding issue (ensure PORT env var is used)
```

### Stripe Webhook Failing

```bash
# Check webhook signature
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
2. Check endpoint is publicly accessible
3. Ensure POST requests are allowed
4. Review logs for signature verification errors
```

### Frontend API Calls Failing

```bash
# Check CORS settings
1. Verify ALLOWED_ORIGINS includes frontend URL
2. Check NEXT_PUBLIC_API_URL is correct
3. Verify API is running and accessible
4. Check browser console for CORS errors
```

### Database Connection Errors

```bash
# Verify connection string
1. Check DATABASE_URL format: postgresql://user:pass@host:port/db
2. Ensure database exists and is accessible
3. Check firewall rules
4. Verify SSL mode if required: ?sslmode=require
```

---

## 📊 Monitoring & Logging

### Backend Monitoring

```bash
# Render.com:
- Automatic logging in dashboard
- Metrics: CPU, Memory, Response Time

# Railway:
railway logs --tail

# Custom monitoring:
- Add Sentry for error tracking
- Use Datadog/New Relic for APM
```

### Frontend Monitoring

```bash
# Vercel Analytics
1. Enable in Vercel Dashboard
2. View analytics at vercel.com/analytics

# Custom monitoring:
- Google Analytics
- PostHog
- LogRocket
```

---

## 🔄 CI/CD Setup (Optional but Recommended)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 💰 Cost Estimate

### Minimum Viable Production Stack

| Service | Plan | Cost |
|---------|------|------|
| Render (API) | Starter | $7/mo |
| Render (PostgreSQL) | Starter | $7/mo |
| Vercel (Frontend) | Hobby | $0 |
| Upstash (Redis) | Free | $0 |
| Stripe | Pay-as-you-go | 2.9% + $0.30/transaction |
| **Total** | | **~$14/month + transaction fees** |

### Recommended Production Stack

| Service | Plan | Cost |
|---------|------|------|
| Render (API) | Standard | $25/mo |
| Render (PostgreSQL) | Standard | $15/mo |
| Vercel (Frontend) | Pro | $20/mo |
| Upstash (Redis) | Pro | $10/mo |
| Sentry (Monitoring) | Developer | $26/mo |
| **Total** | | **~$96/month + transaction fees** |

---

## 🚨 Security Checklist

- [ ] All API keys stored in environment variables
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection prevention (using ORMs)
- [ ] API key hashing (SHA-256)
- [ ] Webhook signature verification
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Database backups enabled
- [ ] Secrets rotation policy in place

---

## 📞 Support & Next Steps

### Immediate Next Steps

1. **Deploy Backend:** Choose Render or Railway, follow steps above
2. **Deploy Frontend:** Deploy to Vercel with environment variables
3. **Test End-to-End:** Complete a full checkout flow
4. **Monitor:** Set up error tracking and monitoring
5. **Iterate:** Gather user feedback and improve

### Support Resources

- **Documentation:** Will be at https://docs.sotatools.com
- **API Reference:** Will be at https://api.sotatools.com/docs
- **Support Email:** support@sotatools.com
- **GitHub Issues:** For bug reports

---

## 🎯 Success Metrics

**First 30 Days Goals:**
- [ ] 100 sign-ups
- [ ] 10 paid subscribers
- [ ] $1,000 MRR
- [ ] 99.9% uptime
- [ ] <500ms API response time
- [ ] <2s page load time

**Revenue Projections:**
- Month 1: $1,000 MRR (10 Pro @ $99)
- Month 3: $5,000 MRR (50 users)
- Month 6: $25,000 MRR (250 users)
- Month 12: $100,000 MRR (1,000 users)

---

## 🔥 Go Live Command Sequence

```bash
# 1. Deploy Backend
cd agent-platform/apps/api
railway init
railway add postgresql
railway up
# Set environment variables in Railway dashboard
railway run alembic upgrade head

# 2. Configure Stripe Webhook
# Follow steps in Stripe Dashboard section above

# 3. Deploy Frontend
cd ../web
vercel
# Add environment variables in Vercel dashboard
vercel --prod

# 4. Test Everything
# Run through verification steps above

# 5. Announce Launch! 🎉
# - Tweet about it
# - Post on Product Hunt
# - Share in relevant communities
```

---

**You're ready for production! Let's ship this! 🚀**
