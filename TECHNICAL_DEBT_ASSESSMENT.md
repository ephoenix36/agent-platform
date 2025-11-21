# Technical Debt Assessment & Modernization Plan

**Date:** November 21, 2025
**Scope:** `Agents/` Directory

## 1. Executive Summary

The `Agents` codebase is currently in a **transitional state**. It contains two distinct architectures:
1.  **The Legacy/Web Architecture (`agent-platform/`):** A TurboRepo-based monorepo designed for a full-stack web application (Next.js + Express).
2.  **The Current Architecture (`src/`):** A lightweight, MCP-first CLI tool designed for local orchestration and VS Code integration.

**Core Issue:** The existence of these two parallel systems creates confusion, code duplication, and split focus. The "Solution Packet" architecture we just built in `src/` is the superior path forward for portability and scalability.

## 2. Inventory of Components

| Path | Status | Description | Recommendation |
| :--- | :--- | :--- | :--- |
| `src/` | **Active** | The core MCP server, Agent Manager, and new Business OS logic. | **Keep & Expand** |
| `agent-platform/` | **Legacy** | A complex monorepo (Web UI, API, Packages). Contains valuable logic but is heavy. | **Harvest & Archive** |
| `advisors-mcp/` | **Fragmented** | Standalone MCP server for "Advisor" agents. | **Convert to Packet** |
| `voice-control-mcp/` | **Fragmented** | Standalone MCP server for Voice. | **Convert to Packet** |
| `ui-design-mcp/` | **Fragmented** | Standalone MCP server for UI generation. | **Convert to Packet** |
| `collections/` | **Active** | JSON definitions for agents. | **Migrate to `~/.agents`** |
| `optimization/` | **Duplicate** | Python scripts for optimization. | **Merge into `src/optimization`** |
| `archive/` | **Archive** | Old files. | **Keep** |

## 3. Detailed Technical Debt

### A. The "Dual Platform" Problem
*   **Issue:** `agent-platform` contains sophisticated logic for `workflow-engine` and `storage` in `packages/`, but `src/` is rebuilding these primitives (`BusinessStructureManager`, `ProjectStateManager`).
*   **Risk:** We are reinventing the wheel, or worse, maintaining two wheels.
*   **Fix:** The `src/` architecture is better suited for the "Local-First / MCP" vision. We should treat `agent-platform` as a **reference library**. We should port any unique capabilities (like the `widget-bridge`) to `src/` and then delete `agent-platform`.

### B. "Server Sprawl"
*   **Issue:** You have multiple `package.json` files and multiple MCP servers (`advisors`, `voice`, `ui`). This requires running multiple processes and managing multiple configs.
*   **Fix:** The **Solution Packet** architecture solves this. "Advisors" should not be a server; it should be a **Collection** of Agents and Skills that you import into the main OS.

### C. Storage Fragmentation
*   **Issue:**
    *   `Agents/collections` (Source controlled JSONs)
    *   `Agents/agent-platform/local-storage` (Legacy app storage)
    *   `~/.agents` (New Business OS storage)
*   **Fix:** Adopt `~/.agents` (or additional user-configurable local paths) as the **Source(s) of Truth** for runtime state. Use `Agents/collections` only as a "Marketplace" of installable packets.

## 4. Modernization Roadmap

### Phase 1: Consolidation (The "Great Migration")
1.  **Harvest `agent-platform`:** Review `packages/workflow-engine` for any advanced logic we missed in `SOP`s. Port it if valuable.
2.  **Archive `agent-platform`:** Move the entire folder to `Agents/archive/agent-platform-v1`.
3.  **Merge Optimization:** Move `Agents/optimization/*.py` to `Agents/src/optimization/` and unify the Python bridge.

### Phase 2: Unification (The "Packetization")
1.  **Convert `advisors-mcp`:** Create a `manifest.json`, define the Skills/Evaluators, and export it as a Solution Packet. Delete the folder.
2.  **Convert `voice-control-mcp`:** Same process.
3.  **Convert `ui-design-mcp`:** Same process.

### Phase 3: Cleanup
1.  **Standardize Docs:** Move all `*.md` files (except `README.md`) into `docs/`.
2.  **Clean Root:** Remove `interactive-diagram.html`, `workflow_backlog.json` (move to issues or project state).

## 5. The End State

Your `Agents` folder will look like this:

```
Agents/
├── docs/               # All documentation
├── src/                # The ONE platform (TypeScript + Python Bridge)
│   ├── core/           # Managers (Business, Agent, Optimization)
│   ├── mcp/            # The MCP Server
│   └── optimization/   # Python Evolution Engine
├── collections/        # The "App Store" of Solution Packets
├── archive/            # Old stuff
└── package.json        # Single entry point
```

This structure is clean, portable, and ready for the "1000x" scale.
