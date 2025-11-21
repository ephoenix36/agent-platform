# Master Architect Protocol: The "Solution Packet" Standard

This document defines the standard procedure for creating portable, self-managing business units ("Solution Packets") using the Autonomous Business OS.

## 1. The "Solution Packet" Concept

A Solution Packet (or "Collection") is a portable folder containing everything needed to run a specific domain of activity. It is the atomic unit of the Agent Economy.

**Structure:**
```
MyCollection/
├── manifest.json       # Metadata (Name, Version, Dependencies)
├── agents/             # The Workforce (Who)
├── skills/             # The Capabilities (How)
├── sops/               # The Workflows (When)
├── departments/        # The Organization (Where)
└── evaluators/         # The Standards (Quality)
```

## 2. The Creation Workflow

To build a new Solution Packet, follow this strict sequence:

### Phase 1: Capability Definition (Skills)
Before defining *who* does the work, define *what* work needs to be done.
1.  Identify the atomic tasks (e.g., "Solve Equation", "Empathize", "Scrape Data").
2.  Create **Skills** for each using `#tool:opt_create_skill`.
    *   **CRITICAL:** Define strict `inputSchema` and `outputSchema`.
    *   **CRITICAL:** Make instructions generic (e.g., "You are a calculator...", not "You are Bob the calculator").

### Phase 2: Quality Assurance (Evaluators)
Define how you know if the work is good.
1.  Create **Evaluators** for key skill outputs using `#tool:opt_define_evaluator`.
    *   Example: "Empathy Scorer" checks if the response acknowledges the user's emotion.

### Phase 3: Organizational Design (Departments & Agents)
Now hire the team to execute the skills.
1.  Create a **Department** using `#tool:biz_create_department`.
2.  Create **Agents** (via file creation or tool) that *implement* the Skills.
    *   **Pattern:** `Agent = Identity + Model + [Skills]`.
3.  Assign Agents to the Department using `#tool:biz_assign_to_department`.

### Phase 4: Process Codification (SOPs)
Define how the team collaborates.
1.  Create **SOPs** using `#tool:biz_define_sop`.
    *   **Trigger:** Define what starts the process (e.g., `user:message`, `time:daily`).
    *   **Phases:** Map phases to Roles/Skills.

### Phase 5: Packaging
Export the unit for distribution.
1.  Call `#tool:collection_export` with the Department ID.

---

## 3. The "Self-Managing Department" Pattern

To make a department truly autonomous, it must have a **Head Agent** (Director) running a **Meta-SOP**.

**The Director's Loop:**
1.  **Monitor:** Listen for `LIFECYCLE` events or specific triggers.
2.  **Dispatch:** Instantiate SOPs based on triggers.
3.  **Review:** Use Evaluators to check work before marking it complete.
4.  **Optimize:** (Optional) Suggest skill updates to the `Skill Forge`.

---

## 4. Example: Theoretical Physics Research

**Goal:** A department that autonomously generates and tests physics hypotheses.

1.  **Skills:**
    *   `Literature Review` (Input: Topic, Output: Summary)
    *   `Hypothesis Generation` (Input: Summary, Output: Equation)
    *   `Mathematical Proof` (Input: Equation, Output: Proof/Disproof)
2.  **Evaluators:**
    *   `Novelty Scorer` (Checks against known papers)
    *   `Math Validator` (Checks logical consistency)
3.  **Agents:**
    *   `Physics Director` (Head)
    *   `Theorist` (Uses `Hypothesis Generation`)
    *   `Mathematician` (Uses `Mathematical Proof`)
4.  **SOP:** "Hypothesis Lifecycle"
    *   Phase 1: Review (Theorist)
    *   Phase 2: Ideate (Theorist)
    *   Phase 3: Prove (Mathematician)
    *   Phase 4: Review (Director + Evaluators)

---

## 5. Example: Life Long Friend (The "Daughter's Mentor")

**Goal:** A persistent companion that grows with the user.

1.  **Skills:**
    *   `Emotional Analysis` (Input: Message, Output: Emotion)
    *   `Memory Retrieval` (Input: Context, Output: Past Shared Experiences)
    *   `Advice Generation` (Input: Problem + Context, Output: Advice)
2.  **Evaluators:**
    *   `Empathy Check` (Did the response validate feelings?)
    *   `Safety Filter` (Is the advice age-appropriate?)
3.  **Agents:**
    *   `Guardian` (Head - manages safety/context)
    *   `Companion` (The "Friend" interface)
4.  **SOP:** "Interaction Loop"
    *   Trigger: `user:message`
    *   Phase 1: Safety Check (Guardian)
    *   Phase 2: Context Retrieval (Guardian)
    *   Phase 3: Response Generation (Companion)
    *   Phase 4: Memory Storage (Guardian)

---

## 6. Execution Instructions for Architect

When asked to build a system:
1.  **Decompose** the request into the 5 Phases above.
2.  **Execute** the tool calls sequentially.
3.  **Export** the final result as a Collection.
