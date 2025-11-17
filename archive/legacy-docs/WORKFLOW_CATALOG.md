# Workflow Catalog & Implementation Backlog

Generated: 2025-11-13
Status Key: [ ] planned • [~] in-progress • [x] completed • [⚑] blocked • [∆] needs review

This catalog enumerates high-value AI + automation workflows derived from external references (n8n templates, awesome-ai-apps, social-media-agent, memory agents) and internal platform goals. Each workflow will be instantiated as a collection item (`agent-workflows`), linked agents (`unified-agents`), skills (`unified-skills`), teams (`agent-teams`), and hooks.

## Field Definitions (for JSON backlog)
- id: machine-friendly slug
- name: human-friendly title
- category: business, marketing, sales, product, engineering, devops, research, finance, hr, support, security, ops, content, social, memory, integration, analytics, compliance
- description: concise purpose
- valueScore: 1–10 (impact vs effort)
- complexity: low | medium | high (composition + integrations)
- triggers: manual | schedule | event | webhook | cron | ingestion
- agentsNeeded: internal agent IDs/roles to create or reuse
- skillsNeeded: reusable skill slugs
- status: planned | in-progress | completed | blocked | needs-review
- dependencies: other workflow ids or external system prerequisites

---
## Core Business Operations
- [ ] biz_daily_market_intel: Daily Market Intelligence Aggregation (news + financial KPIs)
- [ ] biz_competitor_monitor: Competitor Research & Profile Generator (Notion + Web Crawl)
- [ ] biz_meeting_action_extractor: Meeting Notes Summarizer & Task Injector (Zoom -> Tasks)
- [ ] biz_policy_update_audit: Policy Change Diff & Compliance Alert
- [ ] biz_brand_reputation_monitor: Brand Reputation & Sentiment Tracker (Trustpilot, social)

## Sales & CRM
- [ ] sales_linkedin_outreach_automation: LinkedIn Outreach Personalization + Posting
- [ ] sales_lead_qualification_sheet: Lead Qualification in Sheets via AI tags
- [ ] sales_meeting_prep_whatsapp: Pre-Meeting Intelligence Brief to WhatsApp
- [ ] sales_pipedrive_reply_classifier: Pipedrive Reply Enrichment & Categorization
- [ ] sales_price_monitoring_alerts: Competitor Price Monitoring & Alert Engine
- [ ] sales_startup_idea_validator: Startup Idea Validation (multi-factor scoring)

## Marketing & Growth
- [ ] mkt_social_media_post_generator: URL-to-Multi-Platform Social Post (Human-in-loop)
- [ ] mkt_social_media_amplifier: Cross-channel Amplification & Trend Injection
- [ ] mkt_dynamic_banner_generation: Dynamic Banner / Creative Refresh Cycle
- [ ] mkt_seo_keyword_seed_generator: SEO Seed & Cluster Keyword Miner
- [ ] mkt_content_calendar_orchestrator: Content Calendar Auto-Fill & Gap Analysis
- [ ] mkt_podcast_episode_summarizer: Podcast Summarization & Enrichment (Wikipedia)
- [ ] mkt_youtube_video_summarizer: YouTube Transcript Summarizer & Post Generator
- [ ] mkt_wordpress_content_ops: WP Draft -> AI Categorize -> Tag -> Publish
- [ ] mkt_utm_qr_generator: UTM Link + QR Asset Generator + Performance Snapshot

## Customer Success & Support
- [ ] cs_email_triage_human_loop: AI Draft + Human Approval Email Response
- [ ] cs_ticket_sentiment_tracker: Ticket Sentiment & Escalation Trigger (Slack + Linear)
- [ ] cs_knowledge_base_rag_assistant: KB RAG Assistant (Notion/Pinecone)
- [ ] cs_feedback_insight_pipeline: Feedback Ingestion, Summarization & Action Items
- [ ] cs_multichannel_chatbot_telegram: Telegram / WhatsApp Support Agent with Memory

## Product & UX
- [ ] prod_feature_request_classifier: Feature Request Classification & Prioritization
- [ ] prod_usage_analytics_reporter: Usage Log Summarizer & Anomaly Detector
- [ ] prod_conference_talk_abstract_generator: Conference Abstract Drafting Workflow
- [ ] prod_ui_visual_regression_guard: Visual Regression Detection (Apify + Vision)

## Engineering & DevOps
- [ ] eng_code_review_ai_gitlab: Automated MR Code Review + Risk Flags
- [ ] eng_bug_classifier_linear: Bug Report Classification & Ownership Routing
- [ ] eng_openapi_schema_extractor: API Schema Extraction & Diff Notifier
- [ ] eng_sql_query_generator: Natural Language to SQL Query Assistant
- [ ] eng_infrastructure_update_webhook: Authenticated Server Update Orchestrator
- [ ] eng_vector_store_ingestion_pipeline: Notion / Drive -> Embeddings -> Vector DB

## Data & Analytics
- [ ] data_google_analytics_reporter: GA/Umami/SERPBear Data Summarization
- [ ] data_multisource_etl_sentiment: Social + Reviews ETL & Sentiment Dash
- [ ] data_financial_docs_rag: Financial Document RAG Assistant
- [ ] data_invoice_extraction: Invoice Parsing & Normalization Pipeline
- [ ] data_resume_parsing_scoring: Resume Vision Parsing & Fit Scoring
- [ ] data_rent_payment_reconciliation: Spreadsheet vs Ledger Reconciliation
- [ ] data_sql_visualization_generator: SQL Result -> QuickChart Visualization

## Research & RAG
- [ ] research_autonomous_deep_research: Autonomous Research Agent (multi-stage)
- [ ] research_hackernews_trend_analyzer: HN Trends -> Resource Recommendation Report
- [ ] research_paper_summary_categorizer: HuggingFace Paper Fetch + Categorization
- [ ] research_tax_code_assistant: Tax Code Q&A RAG
- [ ] research_vector_big_data_anomaly: Vector DB Anomaly / KNN Analysis Suite
- [ ] research_perplexity_to_html_content: Perplexity Research -> Structured HTML

## Finance
- [ ] fin_stock_fundamental_analysis: Crew-Based Fundamental Stock Analysis
- [ ] fin_earnings_report_rag: Earnings Report RAG Processing
- [ ] fin_ai_hedge_fund_monitor: Hedge Fund Strategy Multi-Model Monitor
- [ ] fin_expense_invoice_normalizer: Invoice Extraction & Ledger Entry

## HR & Talent
- [ ] hr_candidate_shortlisting: Candidate Profile Enrichment & Ranking
- [ ] hr_job_application_intake: Resume Extraction -> Structuring -> Notification
- [ ] hr_workplace_discrimination_detector: Pattern Detection & Alert Workflow

## Security & Compliance
- [ ] sec_phishing_email_analyzer: Suspicious Email Vision & Classification
- [ ] sec_siem_alert_enrichment: Alert MITRE ATT&CK Enrichment + Ticketing
- [ ] sec_certificate_status_bot: Certificate Expiry Slack Bot
- [ ] sec_vulnerability_scan_trigger: Slack Shortcut Vulnerability Trigger

## Memory & Personalization
- [ ] mem_blog_writing_memory_agent: Blog Writer with Persistent Memory
- [ ] mem_brand_reputation_memory_agent: Brand Reputation Memory Agent
- [ ] mem_product_launch_memory_agent: Product Launch Memory Planner

## Social Media & Community
- [ ] social_link_aggregation_cron: Slack Channel Link Ingestion -> Daily Post Queue
- [ ] social_virtual_ai_influencer: AI Influencer Post & Engagement Optimizer
- [ ] social_reddit_digest_generator: Reddit Digest Summarizer
- [ ] social_dynamic_profile_banner: Dynamic Banner Update Pipeline

## Content & Knowledge
- [ ] content_pdf_chat_rag: Multi-PDF Chat with Source Citation
- [ ] content_event_schedule_query: Event Schedule NLQ Assistant (Sheets -> Telegram)
- [ ] content_blog_authoring_pipeline: Sheet -> Draft -> Review Team -> Publish
- [ ] content_conference_cfp_generator: CFP Generation & Iterative Refinement

## Integration & APIs
- [ ] int_external_workflow_as_tool_bridge: External Workflow Wrapping as Tools
- [ ] int_calendar_email_sync: Email -> Task -> Calendar Sync Agent
- [ ] int_airtable_notetaker: Meeting Transcript -> Airtable Task Sync
- [ ] int_supabase_vector_upsert: Large Doc Chunk + Embedding Upsert

## Personal / Productivity
- [ ] personal_todoist_organizer: AI Task Categorization & Prioritization
- [ ] personal_recipe_daily_telegram: Daily Recipe Suggestion Bot
- [ ] personal_obisidian_note_audio_feed: Notes -> Audio Feed Generation

---
## Tracking & Completion
For each implemented workflow:
1. Add a collection item (`agent-workflows`) with full config.
2. Link required agents (create if missing).
3. Update status checkbox here and JSON backlog.
4. Add optimization hooks (before/after execution) if needed.
5. Record evaluation metrics in performance collection.

---
## Next Suggested Priorities (Top 10)
1. mkt_social_media_post_generator (high leverage, immediate showcase)
2. research_autonomous_deep_research (platform differentiation)
3. cs_email_triage_human_loop (practical support use case)
4. sales_lead_qualification_sheet (direct revenue impact)
5. data_invoice_extraction (repeatable finance automation)
6. eng_code_review_ai_gitlab (developer productivity)
7. research_paper_summary_categorizer (RAG demonstration)
8. mkt_content_calendar_orchestrator (marketing ops backbone)
9. biz_competitor_monitor (strategy insights)
10. memory mem_blog_writing_memory_agent (memory subsystem showcase)

---
## Status Summary (Initial)
Planned: 70
In-Progress: 0
Completed: 0
Blocked: 0
Needs-Review: 0

---
## Implementation Hooks (Recommended)
- beforeExecution: validate required agents & skills present
- afterExecution: append performance metrics & success criteria evaluation
- onError: structured error capture + retry guidelines

---
## Evolution & Optimization
Each workflow will later include evaluator config (coverage, latency, accuracy, businessImpact) and mutator strategies (promptRefinement, toolSelectionOptimization, memoryAugmentation).

---
## Linking to Collections
- Workflows -> `agent-workflows`
- Agents -> `unified-agents`
- Skills -> `unified-skills`
- Teams -> `agent-teams`
- Metrics -> `agent-performance-metrics`

---
End of Catalog.
