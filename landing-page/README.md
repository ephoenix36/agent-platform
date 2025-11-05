# Universal Optimization Platform - Landing Page

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.local.example .env.local
# Then edit .env.local with your API keys

# 3. Start development server
pnpm dev

# 4. Open http://localhost:3000
```

## 📋 Comprehensive Setup

See `docs/SETUP.md` for detailed setup instructions.

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- React Hook Form + Zod (validation)
- Resend (email)
- PostHog (analytics)
- Vercel (deployment)

## Project Structure

```
optimization-platform/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Homepage
│   ├── globals.css                # Global styles
│   ├── domains/
│   │   ├── sales/page.tsx
│   │   ├── product/page.tsx
│   │   ├── education/page.tsx
│   │   ├── healthcare/page.tsx
│   │   ├── climate/page.tsx
│   │   └── governance/page.tsx
│   ├── contact/page.tsx
│   ├── api/
│   │   ├── contact/route.ts       # Contact form handler
│   │   └── subscribe/route.ts     # Newsletter
│   └── not-found.tsx
├── components/
│   ├── Hero.tsx
│   ├── Navigation.tsx
│   ├── DomainCard.tsx
│   ├── DomainShowcase.tsx
│   ├── PricingTable.tsx
│   ├── FAQ.tsx
│   ├── ContactForm.tsx
│   ├── Footer.tsx
│   ├── Stats.tsx
│   ├── Testimonials.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Select.tsx
├── lib/
│   ├── validations.ts             # Zod schemas
│   ├── email.ts                   # Email service
│   ├── analytics.ts               # PostHog wrapper
│   └── utils.ts                   # Utilities
├── types/
│   └── index.ts                   # TypeScript types
├── public/
│   ├── images/
│   └── videos/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Performance Targets

- **Lighthouse Score:** 95+
- **First Contentful Paint:** < 1.2s
- **Time to Interactive:** < 2.5s
- **Total Bundle Size:** < 200kb (gzipped)
- **Core Web Vitals:**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

## Deployment

- **Platform:** Vercel
- **Domain:** optimization.ai (example)
- **CDN:** Vercel Edge Network
- **SSL:** Automatic
- **Preview:** Every commit

## Development Workflow

1. `npm install` - Install dependencies
2. `npm run dev` - Start development server
3. `npm run build` - Production build
4. `npm run lint` - Lint code
5. `vercel` - Deploy to production
