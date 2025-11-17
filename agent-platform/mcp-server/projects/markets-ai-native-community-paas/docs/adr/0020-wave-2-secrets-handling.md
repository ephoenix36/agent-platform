# ADR 20: Wave 2 Secrets Handling

**Status:** accepted  
**Date:** 2025-11-16

## Context

Auth and deployment require secrets.

## Decision

Store secrets in .env.local (local) and Vercel environment variables; do not commit values.

## Consequences

Protects credentials.


