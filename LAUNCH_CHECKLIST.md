# 🚀 QUICK LAUNCH CHECKLIST

**Total Time Estimate:** 90 minutes to first revenue

---

## ☑️ PRE-DEPLOYMENT CHECKLIST

### Environment Setup
- [ ] Render.com or Railway account created
- [ ] Vercel account created  
- [ ] Stripe account accessible
- [ ] GitHub repository ready
- [ ] Domain name (optional)

### Local Testing
- [ ] Backend runs locally (`uvicorn app.main:app --reload`)
- [ ] Frontend runs locally (`npm run dev`)
- [ ] Can access landing page at `/landing`
- [ ] Can access dashboard (mock data)
- [ ] No TypeScript errors (`npm run build`)

---

## 🔧 BACKEND DEPLOYMENT (30 min)

### 1. Create Database (5 min)
- [ ] Sign up for Render.com or Railway
- [ ] Create new PostgreSQL database
- [ ] Copy `DATABASE_URL`
- [ ] Save connection string securely

### 2. Deploy API (10 min)
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Select Python 3.11+
- [ ] Deploy

### 3. Configure Environment (10 min)
- [ ] Add `DATABASE_URL`
- [ ] Add `STRIPE_TEST_SECRET_KEY` (from `.env.stripe`)
- [ ] Add `STRIPE_TEST_WEBHOOK_SECRET` (placeholder for now)
- [ ] Add `STRIPE_PRICE_ID_PRO`
- [ ] Add `STRIPE_PRICE_ID_TEAM`
- [ ] Add `STRIPE_PRICE_ID_ENTERPRISE`
- [ ] Add `REDIS_HOST` (Upstash or skip)
- [ ] Add `SECRET_KEY` (generate: `openssl rand -hex 32`)
- [ ] Add `ALLOWED_ORIGINS` (your frontend URL)
- [ ] Trigger redeploy

### 4. Run Migrations (5 min)
- [ ] SSH into instance or use platform shell
- [ ] Run: `alembic upgrade head`
- [ ] Verify tables created: `\dt` in psql

### 5. Verify Backend
- [ ] Test health endpoint: `curl https://your-api/api/v1/billing/health`
- [ ] Should return: `{"status": "healthy"}`
- [ ] Check logs for errors

---

## 🌐 FRONTEND DEPLOYMENT (20 min)

### 1. Install Vercel CLI (2 min)
```bash
npm i -g vercel
vercel login
```

### 2. Configure Environment (5 min)
Create `.env.local` in `apps/web/`:
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend-url/api/v1`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` (from `.env.stripe`)
- [ ] `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- [ ] `NEXT_PUBLIC_APP_NAME=SOTA Tools`

### 3. Deploy (8 min)
```bash
cd apps/web
vercel
# Answer prompts (project name, etc.)
# Copy preview URL
```

### 4. Add Environment to Vercel Dashboard (3 min)
- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add all variables from `.env.local`
- [ ] Mark as "Production"

### 5. Deploy to Production (2 min)
```bash
vercel --prod
```

### 6. Verify Frontend
- [ ] Visit production URL
- [ ] Landing page loads
- [ ] Click "Start Free Trial"
- [ ] Sign-up form appears
- [ ] No console errors

---

## 🔗 STRIPE WEBHOOK SETUP (10 min)

### 1. Create Webhook Endpoint
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click "+ Add endpoint"
- [ ] URL: `https://your-backend/api/v1/billing/webhook`
- [ ] Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`

### 2. Get Webhook Secret
- [ ] Click on webhook endpoint
- [ ] Reveal signing secret
- [ ] Copy `whsec_...` value

### 3. Update Backend Environment
- [ ] Add/update `STRIPE_TEST_WEBHOOK_SECRET`
- [ ] Redeploy backend

### 4. Test Webhook
- [ ] Send test event from Stripe Dashboard
- [ ] Check backend logs
- [ ] Should see "200 OK"

---

## ✅ END-TO-END TESTING (30 min)

### Test 1: Free Tier Sign-Up (5 min)
- [ ] Go to landing page
- [ ] Click "Start Free Trial"
- [ ] Select "Free" tier
- [ ] Enter email and name
- [ ] Click "Create Account"
- [ ] Redirected to dashboard
- [ ] API key visible
- [ ] Usage shows 0/100

### Test 2: Paid Tier Sign-Up (10 min)
- [ ] Go to landing page
- [ ] Click "Start Free Trial"
- [ ] Select "Pro" tier ($99/mo)
- [ ] Enter email and name
- [ ] Click "Continue to Payment"
- [ ] Redirected to Stripe Checkout
- [ ] Fill test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] Redirected to success page
- [ ] Auto-redirect to dashboard
- [ ] Subscription shows "Pro"
- [ ] API key visible

### Test 3: Dashboard Features (10 min)
- [ ] Overview tab shows subscription status
- [ ] Usage tab shows charts (may be empty)
- [ ] API Keys tab shows key (can copy)
- [ ] Invoices tab shows first invoice
- [ ] Can download invoice PDF
- [ ] Upgrade button works (shows modal)
- [ ] Cancel button works (shows warning)

### Test 4: Mobile Testing (5 min)
- [ ] Open site on mobile (or DevTools mobile view)
- [ ] Navigation menu works
- [ ] Landing page responsive
- [ ] Sign-up flow usable
- [ ] Dashboard tabs accessible
- [ ] Charts render correctly

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**"Database connection failed"**
- Check `DATABASE_URL` format
- Verify database exists
- Check firewall rules

**"Stripe error: Invalid API key"**
- Verify `STRIPE_TEST_SECRET_KEY` is correct
- Check for extra spaces
- Ensure using test key (starts with `sk_test_`)

**"Webhook signature verification failed"**
- Update `STRIPE_TEST_WEBHOOK_SECRET`
- Ensure no extra characters
- Check webhook URL is correct

### Frontend Issues

**"API call failed"**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS settings (`ALLOWED_ORIGINS`)
- Open browser console for details

**"Stripe Checkout not loading"**
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Check console for errors
- Ensure using test key (starts with `pk_test_`)

**"Page not found"**
- Check Next.js build succeeded
- Verify file paths are correct
- Clear Vercel cache and redeploy

---

## 🎉 GO LIVE (10 min)

### Switch to Production Keys (if ready)
- [ ] Replace `STRIPE_TEST_SECRET_KEY` with `STRIPE_LIVE_SECRET_KEY`
- [ ] Replace `STRIPE_TEST_WEBHOOK_SECRET` with live webhook secret
- [ ] Update price IDs to live versions
- [ ] Replace `pk_test_` with `pk_live_` in frontend
- [ ] Redeploy both backend and frontend

### Announce Launch
- [ ] Tweet about launch
- [ ] Post on Product Hunt
- [ ] Share in relevant communities (r/SideProject, Indie Hackers)
- [ ] Send email to waitlist (if any)
- [ ] Update LinkedIn

### Monitor
- [ ] Check Stripe Dashboard for activity
- [ ] Monitor Vercel analytics
- [ ] Watch backend logs for errors
- [ ] Check Sentry (if configured)
- [ ] Respond to user feedback

---

## 📊 SUCCESS METRICS

### Day 1
- [ ] First sign-up
- [ ] First test payment
- [ ] Zero critical errors
- [ ] Uptime > 99%

### Week 1
- [ ] 10 sign-ups
- [ ] 1 paid subscriber
- [ ] $99 MRR

### Month 1
- [ ] 100 sign-ups
- [ ] 10 paid subscribers
- [ ] $1,000 MRR

---

## 📞 SUPPORT CONTACTS

**Development Issues:**
- Check `DEPLOYMENT_GUIDE.md` troubleshooting section
- Review backend logs
- Check frontend console

**Stripe Issues:**
- Stripe Dashboard → Developers → Logs
- Stripe Support: https://support.stripe.com

**Vercel Issues:**
- Vercel Dashboard → Deployments → Logs
- Vercel Support: https://vercel.com/support

**Render/Railway Issues:**
- Platform dashboard → Logs
- Platform support documentation

---

## ✅ COMPLETION CHECKLIST

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Webhooks configured and tested
- [ ] Free tier sign-up works
- [ ] Paid tier sign-up works
- [ ] Dashboard fully functional
- [ ] Mobile responsive
- [ ] First test payment completed
- [ ] Monitoring configured
- [ ] Launch announced

**When all checked: YOU'RE LIVE! 🚀**

---

## 🎯 QUICK COMMANDS

```bash
# Backend health check
curl https://your-api.onrender.com/api/v1/billing/health

# Frontend preview
vercel

# Frontend production
vercel --prod

# View backend logs
railway logs --tail

# View frontend logs  
vercel logs

# Test Stripe webhook
stripe trigger customer.subscription.created

# Generate secret key
openssl rand -hex 32
```

---

**Time to Revenue: 90 minutes**  
**You've got this! 🚀**
