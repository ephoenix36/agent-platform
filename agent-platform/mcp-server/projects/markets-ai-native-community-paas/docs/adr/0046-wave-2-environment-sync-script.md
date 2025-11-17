# ADR 46: Wave 2 Environment Sync Script

**Status:** proposed  
**Date:** 2025-11-16

## Context

Need script to sync env vars across local and Vercel for tasks 2-4.

## Decision

Add scripts/setup-env.ps1 to copy .env.example -> .env.local and push to Vercel via CLI.

## Consequences

Simplifies env management.


