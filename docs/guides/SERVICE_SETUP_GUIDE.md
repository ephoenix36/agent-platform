# Service Setup Agent - Account Creation & API Key Management

## Purpose
Automate setup of third-party service accounts (email, analytics, monitoring) with compliance and best practices.

## Services to Setup

### 1. Resend (Email Service)
- **URL:** https://resend.com
- **Purpose:** Transactional emails (contact form, auto-responses)
- **Compliance:** GDPR-compliant, SOC 2 Type II
- **Free Tier:** 100 emails/day, 3,000/month
- **API Key Scopes:** Send emails only (minimal permissions)

### 2. PostHog (Analytics)
- **URL:** https://posthog.com
- **Purpose:** Privacy-friendly product analytics
- **Compliance:** GDPR-compliant, EU cloud option available
- **Free Tier:** 1M events/month
- **Configuration:** Cookie consent, IP anonymization

### 3. Sentry (Error Monitoring) - Optional Phase 2
- **URL:** https://sentry.io
- **Purpose:** Error tracking and performance monitoring
- **Compliance:** GDPR-compliant
- **Free Tier:** 5K errors/month

## Setup Process

### Phase 1: Create Accounts
1. Navigate to service signup pages
2. Create accounts with business email
3. Verify email addresses
4. Complete profile setup

### Phase 2: Generate API Keys
1. Navigate to API key sections
2. Create keys with minimal required permissions
3. Copy keys to secure storage
4. Add to `.env.local` with proper naming

### Phase 3: Configure Services
1. Set up email domain verification (if needed)
2. Configure analytics privacy settings
3. Set up error tracking integrations
4. Test API connectivity

### Phase 4: Compliance Setup
1. Enable GDPR features
2. Configure data retention policies
3. Set up cookie consent (if needed)
4. Document privacy policy requirements

## Compliance Checklist

### GDPR Requirements
- [ ] Data processing agreements signed
- [ ] User consent mechanisms in place
- [ ] Data retention policies configured
- [ ] Right to deletion supported
- [ ] Privacy policy updated

### Security Best Practices
- [ ] API keys stored securely (env variables)
- [ ] Minimal permission scopes
- [ ] Regular key rotation schedule
- [ ] Access logging enabled
- [ ] 2FA enabled on accounts

## Documentation
All API keys and configuration details stored in:
- `.env.local` (local development, gitignored)
- Vercel environment variables (production)
- Password manager (backup)

## Next Steps
1. Create Resend account
2. Create PostHog account
3. Get API keys
4. Configure `.env.local`
5. Test integrations
6. Deploy to Vercel with env vars
