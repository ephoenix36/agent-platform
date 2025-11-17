# ADR 55: Wave 2 Agent Fallback Plan

**Status:** proposed  
**Date:** 2025-11-16

## Context

Since agent orchestration failed due to missing ANTHROPIC_API_KEY, need fallback.

## Decision

If API key cannot be provided, orchestrator will run tasks manually with scripted steps.

## Consequences

Slower progress but unblocks work.


