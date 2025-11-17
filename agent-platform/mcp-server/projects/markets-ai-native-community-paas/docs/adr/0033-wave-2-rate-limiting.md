# ADR 33: Wave 2 Rate Limiting

**Status:** proposed  
**Date:** 2025-11-16

## Context

Need to ensure API request rate remains safe while testing.

## Decision

Add rate limit config to test endpoints to mimic production constraints.

## Consequences

Prevents abuse but may slow tests.


