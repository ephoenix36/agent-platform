# Agent OS 2.0: The "Canvas" Architecture

**Vision:** A local-first, interactive Operating System for Agents where humans and AI collaborate on a shared, dynamic Canvas.

## 1. The Core Metaphor: "The Canvas"
Instead of a chat window or a CLI, the primary interface is a **Canvas**.
*   **Dynamic:** Agents can render widgets (graphs, to-do lists, code editors) onto the canvas.
*   **Interactive:** Users can resize, move, and edit these widgets directly.
*   **Collaborative:** Both User and Agent can modify the state of the Canvas.

## 2. System Components

### A. The Kernel (`src/core/`)
The central nervous system.
*   **`AgentManager`**: Manages the workforce.
*   **`PacketManager` (formerly CollectionManager)**: Manages portable business units.
*   **`WidgetManager`**: **[NEW]** Manages the lifecycle and state of UI widgets.
*   **`OptimizationManager`**: **[UPDATED]** Bridges to EvoSuite to optimize Skills, Teams, and Workflows.
*   **`PMBridge`**: **[NEW]** Connects to internal/external Task Management systems.

### B. The Interface (`src/ui/`)
A lightweight HTTP/WebSocket server that serves the Canvas.
*   **Frontend:** React/HTML5 based grid.
*   **Voice Layer:** Real-time audio streaming for the "Orchestrator" agent.
*   **Widget Registry:** Built-in widgets (Chat, Terminal, TaskBoard) + Custom widgets from Packets.

### C. The Optimization Engine (`src/optimization/`)
Built on **EvoSuite SDK**.
*   **Targets:**
    *   **Skills:** Instructions, Rules, Tools, Docs.
    *   **Teams:** Composition, Handoffs.
    *   **Workflows:** SOP steps, Triggers.
*   **Loop:** Execute -> Measure (Evaluators) -> Evolve (Mutators) -> Deploy.

## 3. The "Skill" Definition 2.0
A **Skill** is now a comprehensive capability unit:
```typescript
interface Skill {
  id: string;
  instructions: string;       // System Prompt
  rules: string[];           // Constraints
  tools: string[];           // Tool definitions
  knowledge: string[];       // Doc/DB IDs
  agents: string[];          // Sub-agent delegation (optional)
  widgets: string[];         // UI components associated with this skill
}
```

## 4. Task Management Integration
The OS listens for signals from PM tools:
*   **Triggers:** `task:created`, `project:status_changed`.
*   **Actions:** Auto-spawn a "Solution Packet" when a relevant task appears.
    *   *Example:* New Jira ticket "Fix Bug #123" -> Spawns "Bug Fix Packet" (Researcher + Coder + Tester).

## 5. Implementation Roadmap

1.  **Scaffold Widget System:** Define `Widget` schema and `WidgetManager`.
2.  **Expand Optimization:** Update `OptimizationManager` to support the full Skill definition.
3.  **Build PM Bridge:** Create the event listeners for task tools.
4.  **Launch Canvas Server:** Start the HTTP server in `src/mcp/server.ts`.
