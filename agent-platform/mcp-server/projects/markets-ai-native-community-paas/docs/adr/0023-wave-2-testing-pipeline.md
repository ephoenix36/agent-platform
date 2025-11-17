# ADR 23: Wave 2 Testing Pipeline

**Status:** accepted  
**Date:** 2025-11-16

## Context

Need consistent commands for verification after each task.

## Decision

Mandate running pnpm exec tsc --noEmit, pnpm exec biome check, pnpm run build for integration tasks.

## Consequences

Ensures quality but adds runtime.


