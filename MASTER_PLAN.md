# The Autonomous Business OS: Master Plan

This document outlines the complete architecture for a self-optimizing, autonomous business system.

## 1. Core Entities

| Entity | Description | Managed By |
| :--- | :--- | :--- |
| **Department** | A persistent organizational unit (e.g., Marketing). | `BusinessStructureManager` |
| **SOP** | A codified, reusable workflow (Phases, Roles, Deliverables). | `BusinessStructureManager` |
| **ActiveProject** | A runtime instance of an SOP with state and assignments. | `ProjectStateManager` |
| **Skill** | A modular capability (Instructions + Tools) that can be evolved. | `OptimizationManager` |
| **Evaluator** | A standard for measuring success (Criteria + Scoring). | `OptimizationManager` |

## 2. The Genesis Swarm (Agents)

These agents form the "Kernel" of the operating system.

### A. Universal Project Architect (`universal-architect.agent.md`)
*   **Role:** The Planner.
*   **Input:** Vague business goal.
*   **Output:** Fully defined Departments, SOPs, Skills, and Evaluators.
*   **Tools:** `biz_create_department`, `biz_define_sop`, `opt_create_skill`.

### B. Chief Operating Officer (`coo.agent.md`)
*   **Role:** The Builder.
*   **Input:** Architectural plan.
*   **Output:** Instantiated systems ready for work.
*   **Tools:** `biz_instantiate_sop`, `biz_assign_to_department`.

### C. Swarm Commander (`swarm-commander.agent.md`)
*   **Role:** The Executor.
*   **Input:** Runtime events.
*   **Output:** Optimized flow, resolved bottlenecks.
*   **Tools:** `get_recent_events`, `project_update_status`.

### D. Skill Forge (`skill-forge.agent.md`)
*   **Role:** The Optimizer.
*   **Input:** Performance data (scores).
*   **Output:** Mutated (improved) Skill instructions.
*   **Tools:** `opt_record_performance`, `opt_update_skill`.

## 3. The Optimization Loop

1.  **Execute:** A Worker Agent uses a **Skill** to complete a task in a Project.
2.  **Evaluate:** An **Evaluator** (or Review Agent) scores the output (0-100).
3.  **Record:** The score is saved to the Skill's `performanceHistory`.
4.  **Optimize:** The **Skill Forge** analyzes history. If scores are low, it mutates the Skill's instructions.
5.  **Deploy:** The new Skill version is used for the next Project.

## 4. How to Bootstrap

1.  **Start the Server:** Ensure all MCP tools are registered.
2.  **Call the Architect:**
    > "Architect, design a business for 'Automated SEO Content Agencies'."
3.  **Watch it Build:**
    *   Architect creates "Content Dept", "SEO Dept".
    *   Architect defines "Keyword Research Skill", "Article Writing Skill".
    *   Architect defines "SEO Audit SOP".
4.  **Run it:**
    *   COO instantiates "SEO Audit SOP".
    *   Agents execute using v1.0.0 Skills.
5.  **Improve it:**
    *   Evaluator scores the articles.
    *   Skill Forge sees a 70/100 score.
    *   Skill Forge updates "Article Writing Skill" to v1.1.0 (e.g., "Add more internal links").
    *   Next project uses v1.1.0 and gets 85/100.

**This is the 1000x leverage.** The system gets smarter with every project it runs.
