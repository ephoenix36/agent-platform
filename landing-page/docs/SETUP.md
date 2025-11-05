# Setup Guide

## Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm 8+ (package manager)
- Git

## Installation

### 1. Clone and Install

```bash
# Navigate to project
cd landing-page

# Install dependencies with pnpm
pnpm install
```

### 2. Environment Variables

Create `.env.local` file in root:

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=contact@optimization.ai

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional: Development
NODE_ENV=development
```

### 3. Get API Keys

**Resend (Email):**
1. Sign up at https://resend.com
2. Create API key
3. Add to `.env.local`

**PostHog (Analytics):**
1. Sign up at https://posthog.com
2. Create project
3. Copy API key
4. Add to `.env.local`

## Development

### Start Dev Server

```bash
pnpm dev
```

Open http://localhost:3000

### Validation

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Run both
pnpm validate
```

### Build for Production

```bash
# Create optimized build
pnpm build

# Test production build locally
pnpm start
```

## Project Structure

```
landing-page/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── domains/           # Domain pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   └── *.tsx             # Feature components
├── lib/                   # Utilities
│   ├── utils.ts          # Helper functions
│   ├── analytics.ts      # Analytics tracking
│   ├── email.ts          # Email service
│   └── validations.ts    # Zod schemas
├── types/                 # TypeScript types
├── public/               # Static assets
└── docs/                 # Documentation
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
pnpm dev -- -p 3001
```

### pnpm Not Found

```bash
# Install pnpm globally
npm install -g pnpm
```

### Type Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules .next
pnpm install
```

## Next Steps

- See `DEPLOYMENT.md` for production deployment
- See `CONTENT.md` for content updates
- See `ANALYTICS.md` for tracking setup
