# Deployment Guide - Vercel

## Quick Deploy

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Visit https://vercel.com/new
3. Import repository
4. Configure settings (automatic)
5. Deploy

## Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=contact@optimization.ai
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add domain (e.g., optimization.ai)
3. Configure DNS records (Vercel provides instructions)
4. Wait for SSL (automatic, ~10 minutes)

### DNS Configuration Example

For domain `optimization.ai`:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

## Build Settings

Vercel auto-detects Next.js. Default settings:

- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Framework:** Next.js

## Performance Optimization

### Automatic Features (Enabled by Default)

- ✅ Edge Network CDN
- ✅ Image Optimization
- ✅ Automatic HTTPS
- ✅ Compression (Brotli/Gzip)
- ✅ Code Splitting
- ✅ Prefetching

### Additional Optimizations

1. **Analytics**
   - Enable Vercel Analytics in dashboard
   - Track Core Web Vitals

2. **Speed Insights**
   - Enable Vercel Speed Insights
   - Monitor real-user performance

3. **Edge Functions**
   - API routes run on Vercel Edge Network
   - Low latency globally

## Monitoring

### Build Logs

```bash
# View recent deployments
vercel ls

# View logs for specific deployment
vercel logs <deployment-url>
```

### Production Checks

After deployment:

1. ✅ Visit site, verify loading
2. ✅ Test contact form submission
3. ✅ Check analytics tracking (PostHog)
4. ✅ Verify all domain pages load
5. ✅ Test mobile responsiveness
6. ✅ Check Lighthouse score (target: 95+)

```bash
# Lighthouse CI
pnpm add -D @lhci/cli

# Run audit
npx lhci autorun --collect.url=https://your-site.vercel.app
```

## Continuous Deployment

Vercel auto-deploys on:

- **Push to main:** Production deployment
- **Pull requests:** Preview deployment
- **Other branches:** Preview deployment

### Preview Deployments

Every branch/PR gets unique URL:
- `landing-page-git-feature-username.vercel.app`
- Great for testing before production

## Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

Or in Vercel Dashboard → Deployments → "Promote to Production"

## Troubleshooting

### Build Fails

Check build logs:
```bash
vercel logs <deployment-url>
```

Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### Environment Variables Not Working

- Must start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after changes
- Redeploy after updating in Vercel

### Domain Not Working

- DNS propagation takes 24-48 hours
- Verify DNS records are correct
- Check Vercel domain status

## Security

Vercel automatically provides:

- ✅ DDoS protection
- ✅ SSL/TLS certificates
- ✅ Secure headers (configured in next.config.js)
- ✅ Edge caching

## Cost

- **Hobby Plan:** Free
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Good for MVP/personal

- **Pro Plan:** $20/month
  - Advanced analytics
  - Team collaboration
  - Higher limits
  - Priority support

## Post-Deployment Checklist

- [ ] Verify all pages load
- [ ] Test contact form → email received
- [ ] Check PostHog events tracking
- [ ] Run Lighthouse audit (target: 95+)
- [ ] Test on mobile devices
- [ ] Verify custom domain works
- [ ] Check SSL certificate
- [ ] Monitor error tracking (Vercel Dashboard)
- [ ] Set up uptime monitoring (optional: UptimeRobot)
