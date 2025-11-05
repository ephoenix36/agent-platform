# 🔑 How to Get Your Stripe API Keys

**Quick Guide:** Get your Stripe API keys from your existing Stripe account

---

## 📍 Step 1: Navigate to API Keys

In your **already logged-in Stripe browser**, go to:

**URL:** `https://dashboard.stripe.com/test/apikeys`

Or navigate manually:
1. Click "Developers" in the left sidebar
2. Click "API keys"

---

## 🔑 Step 2: Get Test Mode Keys

You should see two keys:

### **Publishable Key** (starts with `pk_test_`)
- This is safe to expose in your frontend code
- Click "Reveal test key" or copy button
- **Copy this key**

### **Secret Key** (starts with `sk_test_`)
- This is SENSITIVE - never expose in frontend
- Click "Reveal test key" 
- **Copy this key**

---

## 📋 Step 3: Paste Keys Into Your .env File

I can see you have `.env.stripe` open in VS Code. Please paste:

```bash
# Paste your keys here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_[YOUR_KEY_HERE]
STRIPE_TEST_SECRET_KEY=sk_test_[YOUR_KEY_HERE]
```

---

## 🎯 Step 4: Create Products (Optional - we can do this via code)

If you want to create products manually:

1. Go to: `https://dashboard.stripe.com/test/products`
2. Click "Add product"
3. Create each tier:

### Pro Tier
- **Name:** SOTA Agent Tools - Pro
- **Description:** Professional tier with 10,000 API calls/month
- **Pricing:** $99.00 USD / month
- **Recurring:** Monthly

### Team Tier
- **Name:** SOTA Agent Tools - Team
- **Description:** Team collaboration with 100,000 API calls/month
- **Pricing:** $499.00 USD / month
- **Recurring:** Monthly

After creating each product, copy the **Price ID** (starts with `price_`)

---

## 📞 Step 5: Get Webhook Secret (for later)

When you're ready to set up webhooks:

1. Go to: `https://dashboard.stripe.com/test/webhooks`
2. Click "Add endpoint"
3. Enter your webhook URL (we'll deploy this first)
4. Select events to listen to
5. Copy the **Signing secret** (starts with `whsec_`)

---

## ✅ What I Need From You

Please paste into your `.env.stripe` file:

1. **Test Publishable Key** (pk_test_...)
2. **Test Secret Key** (sk_test_...)
3. (Optional) **Product Price IDs** if you created them

Once you paste these, I can:
- ✅ Implement the complete billing system
- ✅ Create products programmatically (if you prefer)
- ✅ Set up webhooks
- ✅ Build the entire payment infrastructure

---

## 🚀 Next Steps After You Paste Keys

I'll immediately:
1. Validate the keys work
2. Create the Stripe client code
3. Set up subscription management
4. Build API key authentication
5. Create the billing dashboard UI
6. Test the entire payment flow

---

## 💡 Alternative: Let Me Create Products Programmatically

If you just paste the API keys, I can create all the products, prices, and configurations automatically using Stripe's API. This is actually faster and more consistent!

Just give me the two test API keys, and I'll handle the rest! 🚀

---

**Ready when you are!** Just paste the keys in your `.env.stripe` file and let me know! 💪
