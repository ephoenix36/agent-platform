# ADR 56: Wave 2 Credential Management

**Status:** proposed  
**Date:** 2025-11-16

## Context

Agent orchestration failed due to missing ANTHROPIC_API_KEY. Need plan to supply required credentials.

## Decision

Request API key from user or switch to available model; block until resolved.

## Consequences

Prevents future agent failures.


