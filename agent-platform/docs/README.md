# Documentation Index

Welcome to the AI Agent Platform documentation! This directory contains comprehensive guides, references, and planning documents for the project.

## 📚 Documentation Structure

### 🏗️ [architecture/](./architecture/)
System design, architecture decisions, roadmaps, and technical specifications.

**Contents:**
- Strategic plans and product roadmaps
- Architecture decision records (ADRs)
- Technical specifications (e.g., Intelligent Canvas spec)
- System design documents

### 📖 [api/](./api/)
*(Coming soon)* API reference documentation and endpoint specifications.

**Will contain:**
- OpenAPI/Swagger specifications
- Endpoint documentation
- Request/response examples
- Authentication guides

### 📘 [guides/](./guides/)
User guides, tutorials, quickstarts, and troubleshooting documentation.

**Contents:**
- Quick start guides
- Developer reference guides
- Demo scripts and walkthroughs
- Troubleshooting guides (e.g., voice control, general issues)

### 🔬 [research/](./research/)
Research documents, competitive analyses, and technical evaluations.

**Contents:**
- Competitive analysis
- Technology evaluations
- User research findings
- Market analysis

### 💻 [development/](./development/)
Development workflows, sprint planning, code standards, and project management.

**Structure:**
- **sprints/** - Sprint planning and tracking
  - **_BACKLOG/** - Planned sprints
  - **_IN_PROGRESS/** - Active sprints
  - **_COMPLETE/** - Finished sprints
  - **_ARCHIVED/** - Historical status documents
  - **_BLOCKED/** - Paused sprints
  - **_TERMINATED/** - Cancelled sprints
- **style-guides/** - Code style guides and best practices
- **templates/** - Reusable document templates
- **transformation-report.md** - Project transformation documentation

---

## 🚀 Quick Links

### For New Contributors
1. Start with [../CONTRIBUTING.md](../CONTRIBUTING.md) - Complete contribution guide
2. Review [../.github/copilot-instructions.md](../.github/copilot-instructions.md) - AI coding guidelines
3. Check [guides/](./guides/) - Quick start and developer references
4. Review [development/style-guides/](./development/style-guides/) - Coding standards

### For Developers
1. [architecture/](./architecture/) - Understand system design
2. [api/](./api/) - API reference (coming soon)
3. [guides/](./guides/) - Development guides
4. [development/style-guides/](./development/style-guides/) - Code standards
5. [development/sprints/](./development/sprints/) - Current sprint work

### For Project Managers
1. [development/sprints/](./development/sprints/) - Sprint planning and tracking
2. [research/](./research/) - Competitive analysis and research
3. [architecture/](./architecture/) - Roadmaps and strategic plans
4. [development/templates/](./development/templates/) - Document templates

---

## 📝 Documentation Standards

### File Naming
- Use **kebab-case** for all markdown files (e.g., `user-authentication-guide.md`)
- Prefix ADRs with numbers: `0001-use-typescript.md`
- Use descriptive, searchable names

### Markdown Standards
- Use **heading hierarchy** (# → ## → ###)
- Include **table of contents** for long documents
- Use **code blocks** with language specifiers
- Add **diagrams** using Mermaid when helpful
- Keep lines under 100 characters for readability

### Documentation Checklist
When creating new documentation:
- [ ] Clear, descriptive title
- [ ] Date or version if applicable
- [ ] Table of contents for long docs
- [ ] Code examples where relevant
- [ ] Links to related documentation
- [ ] Author or maintainer (if applicable)

---

## 🔄 Keeping Documentation Current

### When to Update Documentation
- **Code changes:** Update API docs and technical guides
- **New features:** Add to relevant guides and README
- **Architecture changes:** Update ADRs and system diagrams
- **Process changes:** Update CONTRIBUTING.md and style guides

### Review Schedule
- **Weekly:** Sprint documentation (during sprint planning/retro)
- **Monthly:** Architecture and API docs
- **Quarterly:** Full documentation audit
- **Release:** Update CHANGELOG and version-specific docs

---

## 🛠️ Documentation Tools

### Writing
- **Markdown editor:** VSCode with Markdown extensions
- **Diagrams:** Mermaid, Excalidraw, or draw.io
- **Screenshots:** Annotate with tools like Snagit or Skitch

### Validation
- **Markdown linting:** markdownlint
- **Link checking:** markdown-link-check
- **Spell checking:** cSpell

### Future Enhancements
- [ ] Set up documentation site (Docusaurus, VitePress, etc.)
- [ ] Automated API doc generation (TypeDoc, Pydantic)
- [ ] Documentation versioning
- [ ] Search functionality
- [ ] Documentation CI/CD (lint, link check, deploy)

---

## 📊 Documentation Metrics

| Section | Files | Status | Last Updated |
|---------|-------|--------|--------------|
| architecture/ | 4 | ✅ Active | Nov 2025 |
| api/ | 0 | 🚧 Planned | - |
| guides/ | 5 | ✅ Active | Nov 2025 |
| research/ | 2 | ✅ Active | Nov 2025 |
| development/ | 50+ | ✅ Organized | Nov 2025 |

---

## 🤝 Contributing to Documentation

Documentation contributions are highly valued! See [../CONTRIBUTING.md](../CONTRIBUTING.md) for:
- How to propose documentation improvements
- Documentation style guide
- Review process

**Quick tips:**
- Fix typos and broken links immediately
- Propose structural changes via GitHub Issues
- Keep documentation concise but comprehensive
- Use examples liberally

---

## 📚 External Resources

- **Project Wiki:** *(if applicable)*
- **API Docs (Live):** http://localhost:8000/docs (when running)
- **Turbo Docs:** https://turbo.build/repo/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Flow:** https://reactflow.dev
- **MCP Protocol:** https://modelcontextprotocol.io

---

**Questions or suggestions?** Open an issue or contact the maintainers!

*Last updated: November 5, 2025*
