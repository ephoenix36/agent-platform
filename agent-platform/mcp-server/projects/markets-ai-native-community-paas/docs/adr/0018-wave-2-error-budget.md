# ADR 18: Wave 2 Error Budget

**Status:** proposed  
**Date:** 2025-11-16

## Context

Parallel tasks may produce transient failures.

## Decision

Allow limited retries for DB connections and deployments; escalate after 3 failures.

## Consequences

Prevents flakiness but enforces discipline.


