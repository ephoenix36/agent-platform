# Business Bootstrap: Daily Market Insights

To launch this business using the **Autonomous Business OS**, issue the following instructions to the **Chief Operating Officer (COO)** agent.

---

## Step 1: Create the Department

**Prompt for COO:**
```text
Create a new department named "Market Intelligence".
Mission: "To provide high-value, daily actionable insights on global market trends to our subscribers."
Head Agent: "market-intelligence-director"
```

---

## Step 2: Define the SOP

**Prompt for COO:**
```text
Define a new SOP for the Market Intelligence department.

**Name:** "Daily Market Pulse SOP"
**Description:** "The end-to-end process for generating the daily newsletter."
**Trigger Event:** "time:daily_pulse"

**Phases:**
1. "Scanning" (Role: Insight Analyst, Deliverable: "daily_findings.json")
2. "Drafting" (Role: Newsletter Editor, Deliverable: "newsletter_draft.md")
3. "Approval" (Role: Market Intelligence Director, Deliverable: "final_publication.md")

**Manager Instructions:**
"Director, when this SOP triggers:
1. Initialize a new project 'Daily Pulse [Date]'.
2. Immediately dispatch the Insight Analyst to scan for Tech and Finance news.
3. Once findings are in, have the Editor draft the newsletter.
4. Review and mark complete only when the quality meets our standards."
```

---

## Step 3: The Daily Trigger (Automation)

To run this business automatically, set up a simple cron job (or use a Scheduler Agent) to emit the trigger event every morning at 6:00 AM.

**MCP Tool Call:**
```json
{
  "tool": "emit_event",
  "args": {
    "name": "time:daily_pulse",
    "type": "EXTERNAL",
    "payload": {
      "date": "2025-11-20",
      "priority": "high"
    }
  }
}
```

**Result:**
The Event Bus receives `time:daily_pulse` -> Triggers the SOP -> Instantiates the Project -> Director wakes up -> Business runs.
