# ADR 9: Wave 2 Risk Mitigation

**Status:** proposed  
**Date:** 2025-11-16

## Context

Parallel execution introduces risk of conflicting env vars and secrets.

## Decision

Centralize secrets in .env.local managed via Vercel env; lock down direct edits.

## Consequences

Requires coordination but prevents drift.


