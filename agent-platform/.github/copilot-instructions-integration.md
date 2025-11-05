# 🚀 **COPILOT INSTRUCTIONS - AGENT PLATFORM INTEGRATION PHASE**

**Last Updated**: November 3, 2025  
**Session**: Integration Sprint (Post-Architecture Phase)  
**Priority**: HIGH - Wire up completed components  
**Read First**: `HANDOFF.md` in project root  

---

## 🎯 **CURRENT MISSION**

### **YOU ARE HERE** 👈
We just completed **architecture and component creation**. Components are **built but not integrated**.

**Your Task**: Follow the 3-step integration plan in `HANDOFF.md`

**Expected Time**: 1-2 hours  
**Difficulty**: Medium (mostly find-and-replace)  
**Impact**: HIGH (unlocks all new features)  

---

## 📋 **IMMEDIATE ACTION PLAN**

### **CRITICAL**: Read These Files First (in order)
1. `HANDOFF.md` - Complete integration guide with step-by-step instructions
2. `FINAL_STATUS.md` - What was built and why
3. `ELEGANCE_CHECKLIST.md` - Quality standards

### **Then Execute** (in order)
1. **Step 1**: Integrate OmnibarV3 (replace old OmnibarV2)
   - File: `apps/web/src/app/page.tsx`
   - Time: ~30 minutes
   - See HANDOFF.md lines 40-80

2. **Step 2**: Add Project/Agent modals
   - File: `apps/web/src/components/OmnibarV3.tsx`
   - Time: ~20 minutes
   - See HANDOFF.md lines 82-140

3. **Step 3**: Update Marketplace tab
   - File: `apps/web/src/app/page.tsx`
   - Time: ~15 minutes
   - See HANDOFF.md lines 142-175

---

## 🗂️ **PROJECT STRUCTURE**

### **What's Built (Ready to Integrate)**
```
apps/web/src/
├── components/
│   ├── OmnibarV3.tsx ⭐ NEW - Replace OmnibarV2 with this
│   ├── ProjectAgentSelectors.tsx ⭐ NEW - Modal dialogs
│   ├── ToolBundleManager.tsx ⭐ NEW - Marketplace UI
│   ├── AIWidgetCreator.tsx ⭐ NEW - Widget builder
│   └── TldrawWidget.tsx ⭐ NEW - Canvas placeholder
│
├── types/
│   ├── tool-bundle.v1.ts ✅ V1.0 specification
│   ├── widget.v1.ts ✅ V1.0 specification
│   ├── workflow.v1.ts ✅ V1.0 specification
│   ├── graph.v1.ts ✅ V1.0 specification
│   └── evaluator-mutator.v1.ts ✅ V1.0 specification
│
├── data/
│   └── marketplace-tools.ts ⭐ NEW - 30+ tool definitions
│
└── store/
    └── index.ts ✅ Zustand global state
```

### **What's Currently Running (Old components)**
```
apps/web/src/components/
├── OmnibarV2.tsx ⚠️ ACTIVE - Replace with OmnibarV3
├── OmnibarProvider.tsx ⚠️ ACTIVE - Remove after integration
└── UnifiedMarketplace.tsx ⚠️ ACTIVE - Replace with ToolBundleManager
```

---

## 🚨 **COMMON PITFALLS**

### ❌ **Don't Do This**
```typescript
// DON'T: Keep both OmnibarV2 and OmnibarV3
<OmnibarV2 />
<OmnibarV3 />  // This will cause conflicts!

// DON'T: Forget to import
<OmnibarV3 />  // Error: OmnibarV3 is not defined

// DON'T: Use wrong import path
import { OmnibarV3 } from '../components/OmnibarV3';  // Wrong!
```

### ✅ **Do This**
```typescript
// DO: Replace completely
import { OmnibarV3 } from '@/components/OmnibarV3';

// In render:
<OmnibarV3 />  // Old OmnibarV2 removed

// DO: Clean up unused imports
// Remove: import { OmnibarV2 } from '@/components/OmnibarV2';
// Remove: import { OmnibarProvider } from '@/components/OmnibarProvider';
```

---

## 🔍 **VERIFICATION CHECKLIST**

After integration, verify:

### Visual Check
- [ ] Purple floating circle appears (bottom-right corner)
- [ ] Hovering circle expands to compact mode
- [ ] Clicking opens full expanded mode
- [ ] Voice button shows inline transcripts (NOT fullscreen)
- [ ] Document upload shows fanning preview
- [ ] Project selector modal opens and works
- [ ] Agent config modal opens and works
- [ ] Marketplace tab shows 30+ tools

### Functional Check
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] State persists after page refresh
- [ ] All animations smooth (60fps)
- [ ] Search works in modals
- [ ] Filters work in marketplace

### Code Quality
- [ ] `npm run build` succeeds
- [ ] All imports use `@/` alias
- [ ] No unused imports
- [ ] No `any` types added

---

## 💾 **STATE MANAGEMENT (Zustand)**

### Accessing State
```typescript
import { usePlatformStore } from '@/store';

function MyComponent() {
  // Access specific pieces
  const omnibar = usePlatformStore(state => state.omnibar);
  const widgets = usePlatformStore(state => state.widgets);
  
  // Access actions
  const updateOmnibar = usePlatformStore(state => state.updateOmnibar);
  const addWidget = usePlatformStore(state => state.addWidget);
  
  // Use them
  const handleClick = () => {
    updateOmnibar({ selectedAgent: 'gpt-4' });
  };
}
```

### State Structure
```typescript
{
  // Widgets on dashboard
  widgets: Widget[],
  
  // Omnibar state
  omnibar: {
    visible: boolean,
    position: { x: number, y: number },
    size: { width: number, height: number },
    selectedProject?: string,
    selectedAgent?: string,
    systemPrompt?: string,
    temperature?: number,
    topP?: number,
    maxTokens?: number,
    wakeWord?: string,
  },
  
  // Current view
  currentView: 'dashboard' | 'marketplace' | 'views' | 'mcp-tools' | 'settings',
  
  // Actions
  addWidget, removeWidget, updateWidget, collapseWidget,
  updateOmnibar, setOmnibarVisible,
  setCurrentView, setCurrentProject,
  toggleSidebar, setTheme, reset
}
```

---

## 🎨 **DESIGN SYSTEM**

### Colors (Tailwind)
```typescript
// Primary gradient
className="bg-gradient-to-r from-purple-500 to-pink-500"

// Backgrounds
bg-gray-950  // Main background
bg-gray-900  // Cards, panels
bg-gray-800  // Inputs, secondary surfaces

// Borders
border-gray-800  // Default
border-gray-700  // Inputs
border-purple-500  // Focus, hover

// Text
text-white  // Primary
text-gray-400  // Secondary
text-gray-500  // Muted
```

### Spacing (8px grid)
```typescript
gap-2   // 8px
gap-4   // 16px
gap-6   // 24px
gap-8   // 32px

p-2     // 8px padding
p-4     // 16px padding
p-6     // 24px padding
```

### Animations
```typescript
// Transitions
transition-all duration-200  // Micro-interactions
transition-all duration-300  // Modals, drawers

// Hover effects
hover:scale-105  // Buttons, cards
hover:shadow-lg  // Elevation
hover:bg-gray-800  // Background change
```

---

## 🐛 **DEBUGGING TIPS**

### If Component Doesn't Appear
1. Check import path (use `@/` alias)
2. Check component is rendered in JSX
3. Check z-index (should be `z-50` or higher)
4. Check positioning (fixed, absolute, relative)
5. Inspect in React DevTools

### If State Doesn't Persist
1. Check localStorage in DevTools
2. Key should be `platform-storage`
3. Clear and try again: `localStorage.removeItem('platform-storage')`
4. Check Zustand persist config in `store/index.ts`

### If TypeScript Errors
1. Check types in `src/types/`
2. Ensure all required props passed
3. Check Zustand store interface
4. Run `npm run build` to see all errors

### If Modal Doesn't Open
1. Check state variable (`showProjectSelector`)
2. Check button onClick handler
3. Check modal is conditionally rendered
4. Check z-index is high enough (`z-[100]`)

---

## 📚 **DOCUMENTATION REFERENCE**

### Key Files (Read in Order)
1. **HANDOFF.md** - Integration guide (THIS IS YOUR ROADMAP)
2. **FINAL_STATUS.md** - Sprint summary and achievements
3. **ELEGANCE_CHECKLIST.md** - Polish and quality standards
4. **PHASE2_3_PROGRESS.md** - Detailed progress log

### Component Documentation
Every new component has JSDoc comments:
```typescript
/**
 * OmnibarV3 - Production-Quality Omnibar
 * 
 * Features:
 * - Minimized circle state with icon
 * - Dynamic resizing based on content
 * - Custom button support
 * ...
 */
```

---

## 🚀 **AFTER INTEGRATION**

### Next Steps (Priority Order)
1. **Backend API** - Tool installation endpoints
2. **Database** - PostgreSQL + Prisma setup
3. **Auth** - JWT tokens and protected routes
4. **Payments** - Stripe Connect integration
5. **Testing** - E2E tests with Cypress/Playwright

### Future Sprints
- **Sprint 2**: Backend + Database (6-8 hours)
- **Sprint 3**: Auth + Payments (7-9 hours)
- **Sprint 4**: Testing + Polish (4-5 hours)
- **Sprint 5**: Production Launch 🚀

---

## 💡 **EXPERT TIPS**

### Integration Strategy
1. **One step at a time** - Don't try to do all 3 steps at once
2. **Test after each step** - Verify it works before moving on
3. **Keep old code** - Comment out instead of deleting (easy rollback)
4. **Use git** - Commit after each successful step

### Code Quality
1. **Read existing code first** - Understand the pattern
2. **Match the style** - Follow existing conventions
3. **Add comments** - Explain why, not what
4. **Type everything** - No `any` types

### Problem Solving
1. **Read error messages** - They usually tell you exactly what's wrong
2. **Check HANDOFF.md** - Known issues section has solutions
3. **Inspect state** - `console.log(usePlatformStore.getState())`
4. **Start fresh** - Clear cache, restart dev server

---

## 🎯 **SUCCESS CRITERIA**

### Integration Complete When:
- [ ] All 3 steps from HANDOFF.md are done
- [ ] All items in "VERIFICATION CHECKLIST" are checked
- [ ] No console errors or warnings
- [ ] `npm run build` succeeds
- [ ] User can interact with all new features
- [ ] State persists correctly across refreshes
- [ ] UI feels smooth (60fps animations)

### Definition of "Working"
A feature is working when:
1. **Visible**: User can see it
2. **Interactive**: User can click/type/interact
3. **Functional**: It does what it's supposed to do
4. **Persistent**: State saves and loads correctly
5. **Smooth**: Animations are 60fps, no jank
6. **Error-free**: No console errors or warnings

---

## 🔧 **COMMANDS REFERENCE**

### Development
```bash
# Start dev server (apps/web)
npm run dev

# Build (check for errors)
npm run build

# Type check only
npx tsc --noEmit

# Clear cache (if issues)
rm -rf .next
npm run dev
```

### Debugging
```bash
# Check current state
console.log(usePlatformStore.getState())

# Clear localStorage
localStorage.clear()
location.reload()

# Check what's in localStorage
console.log(localStorage.getItem('platform-storage'))
```

---

## 🎊 **YOU'RE READY!**

### Quick Start
1. Open `HANDOFF.md`
2. Read "IMMEDIATE NEXT STEPS" section
3. Follow Step 1 (OmnibarV3 integration)
4. Test thoroughly
5. Move to Step 2
6. Repeat until done!

### Remember
- Components are **already built** ✅
- You're just **wiring them together** 🔌
- Follow the **3-step plan** 📋
- Test after **each step** ✅
- Commit when **working** 💾

---

**The hard work is done.** Now just connect the pieces! 🧩

**Questions?** Check HANDOFF.md sections:
- Known Issues (line 277)
- Debugging Guide (line 502)
- Getting Help (line 664)

**Ready?** Start with Step 1 in HANDOFF.md (line 40)! 🚀

---

**Last Session**: Architecture & Component Creation (80% complete)  
**This Session**: Integration & Testing (Goal: 95% complete)  
**Next Session**: Backend + Production Deploy (Goal: 100% + LAUNCH!)  

🎉 **Let's ship this!** 🎉
