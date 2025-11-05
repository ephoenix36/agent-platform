# AI Agent Marketplace - Core Constitution

## Project Mission
Build the world's first competitive AI agent marketplace where agents evolve through competition, creators earn from performance, and users get optimal results through agent collaboration.

## Core Principles

### 1. Evolution Through Competition
- Agents compete on real tasks to prove worth
- Winners earn money, encouraging quality
- Continuous optimization in background
- Performance-based selection, not arbitrary

### 2. Creator-Centric Economics
- 70% revenue to creators (industry-leading)
- Transparent performance metrics
- Fair attribution and payment
- Sustainable creator ecosystem

### 3. User Experience First
- Intuitive multi-agent interactions
- Visual conversation branches
- Real-time optimization transparency
- No hidden complexity

### 4. Production Quality
- Zero tolerance for partial implementations
- Complete features or explicit staging
- Test coverage ≥ 70% (aspirational)
- No console errors or hydration mismatches

### 5. Open & Transparent
- Open-source core components
- Documented evolution strategies
- Clear pricing and costs
- Public performance leaderboards

## Technical Constraints

### Must Haves
- **Type Safety**: 100% TypeScript/Python type coverage
- **Accessibility**: WCAG AA compliance minimum
- **Performance**: 60fps animations, <3s TTI
- **Testing**: Unit + integration for all logic
- **Documentation**: Public APIs fully documented

### Must Not Haves
- Hard-coded secrets in repository
- Silent error swallowing
- Placeholder implementations without user request
- Browser-only APIs in SSR (hydration mismatches)
- Unauthenticated admin endpoints (when implemented)

## Quality Gates

### Code Merge Requirements
1. All tests passing (no skips)
2. Linter clean (ruff + eslint)
3. Type check passing (mypy + tsc)
4. No new console errors
5. Documentation updated
6. PR description complete

### UI/UX Standards
- Mobile-first responsive design
- Keyboard navigation support
- Screen reader friendly (ARIA)
- Loading states for async operations
- Error boundaries for resilience
- Smooth 60fps animations

### Backend Standards
- Async-first for I/O operations
- Explicit error types, no generic exceptions
- Structured logging, no print()
- Environment-based configuration
- Graceful degradation on failures

## Evolution Philosophy

### Agent Optimization
- **Continuous**: Background evolution always running
- **Competitive**: Performance measured on real tasks
- **Transparent**: Users see optimization progress
- **Ethical**: No gaming or artificial inflation

### Mutation Strategies
- Prompt refinement and clarification
- Instruction restructuring
- Example addition/removal
- Parameter tuning

### Selection Criteria
- Task success rate (primary)
- Response quality (human/AI-scored)
- Cost efficiency
- Response time
- Versatility across task types

## User Promises

### What Users Can Expect
1. **Best Answer Wins**: Highest quality response selected
2. **Transparent Costs**: Clear pricing before execution
3. **Fair Competition**: All agents evaluated equally
4. **Continuous Improvement**: Agents get better over time
5. **Privacy Respected**: Tasks not shared without consent

### What Users Cannot Expect
- Guaranteed specific agent selection
- Free unlimited executions
- Instant optimization results
- Perfect accuracy (we optimize, not guarantee)

## Architecture Decisions

### Why Next.js + FastAPI
- Next.js: Best-in-class React framework, SSR, great DX
- FastAPI: High-performance Python, async-native, auto docs
- Separation: Scale frontend/backend independently

### Why Framer Motion
- Production-proven animation library
- Declarative API, easy to reason about
- Hardware-accelerated performance
- Excellent TypeScript support

### Why shadcn/ui
- Copy-paste ownership model
- Built on Radix UI (accessible primitives)
- Full customization control
- No opinionated styling

### Why SWR
- Stale-while-revalidate strategy
- Optimistic UI updates
- Automatic revalidation
- Focus management built-in

### Why Zustand
- Minimal boilerplate
- No providers needed
- TypeScript-first
- DevTools integration

## Non-Negotiables

### Security
- No secrets in code
- Environment variables only
- Regular dependency updates
- Input validation everywhere
- Rate limiting on APIs

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score ≥ 90
- 60fps animations
- No jank on interactions

### Accessibility
- Keyboard navigation complete
- Screen reader tested
- Color contrast WCAG AA
- Focus indicators visible
- Semantic HTML structure

### Code Quality
- No TODO without issue reference
- No commented-out code in main
- No console.log in production
- No any types (TypeScript)
- No silent error handling

## Team Collaboration

### Communication
- GitHub Issues for bugs
- GitHub Discussions for ideas
- Pull Requests for changes
- Comments for context

### Code Review
- All changes require review
- Tests must be green
- Constructive feedback only
- Approve or request changes clearly

### Documentation
- README for getting started
- ADRs for big decisions
- Inline docs for complex logic
- API docs for public interfaces

## Measurement & Success

### Key Metrics
- Agent competition win rate
- Task completion success rate
- Creator earnings growth
- User satisfaction (NPS)
- System uptime

### Quality Metrics
- Test coverage percentage
- Bug resolution time
- PR merge time
- Deployment frequency
- Mean time to recovery

## Future Vision

### Short Term (3 months)
- Payment integration (Stripe)
- Backend API implementation
- Database persistence
- Production deployment

### Medium Term (6 months)
- Voice input for chat
- Advanced filtering
- Agent collaboration features
- Mobile responsive optimization

### Long Term (12 months)
- Multi-modal agents (text, image, code)
- Specialized agent marketplaces
- Agent certification program
- Global optimization network

---

**This constitution is living**: Update as we learn, but preserve core principles.
**This constitution is binding**: All code must align with these values.
**This constitution is shared**: Every contributor reads and agrees.

---

*Last Updated: October 28, 2025*
*Version: 1.0.0*
