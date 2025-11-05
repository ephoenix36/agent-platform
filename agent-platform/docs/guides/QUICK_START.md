# ⚡ **QUICK START CARD - 5 MINUTE ORIENTATION**

**Date**: November 3, 2025  
**Status**: Integration Phase (Components built, need wiring)  
**Time to Production**: 1-2 hours (integration) + 8-10 hours (backend)  

---

## 🎯 **THE SITUATION**

### What Was Built
- ✅ OmnibarV3 (minimized circle, inline voice, document fanning)
- ✅ Project/Agent selectors (full configuration)
- ✅ 30+ marketplace tools (specifications)
- ✅ 5 V1.0 specs (Tool Bundle, Widget, Workflow, Graph, Evaluator/Mutator)

### What's NOT Working
- ❌ OmnibarV3 not visible (old OmnibarV2 still active)
- ❌ Voice mode still fullscreen (OmnibarV2 behavior)
- ❌ Project/Agent selectors not integrated
- ❌ Marketplace showing old UI (not new ToolBundleManager)

### Why
**Components exist but aren't imported/rendered!**

---

## 🚀 **3-STEP FIX (1-2 hours)**

### **STEP 1: Replace OmnibarV2 with OmnibarV3**
**File**: `apps/web/src/app/page.tsx`

**Find** (line ~113):
```typescript
<OmnibarProvider>
  <OmnibarV2 />
</OmnibarProvider>
```

**Replace with**:
```typescript
<OmnibarV3 />
```

**Add import**:
```typescript
import { OmnibarV3 } from '@/components/OmnibarV3';
```

**Remove imports**:
```typescript
// Delete these lines:
import { OmnibarV2 } from '@/components/OmnibarV2';
import { OmnibarProvider } from '@/components/OmnibarProvider';
```

**Expected Result**: Floating purple circle in bottom-right corner

---

### **STEP 2: Add Project/Agent Modals to OmnibarV3**
**File**: `apps/web/src/components/OmnibarV3.tsx`

**Add import** (top of file):
```typescript
import { ProjectSelectorModal, AgentConfigModal } from './ProjectAgentSelectors';
```

**Add before closing div** (line ~460):
```typescript
{/* Modals */}
{showProjectSelector && (
  <ProjectSelectorModal
    onClose={() => setShowProjectSelector(false)}
    onSelect={(project) => {
      updateOmnibar({ selectedProject: project.id });
      setShowProjectSelector(false);
    }}
  />
)}

{showAgentConfig && (
  <AgentConfigModal
    onClose={() => setShowAgentConfig(false)}
    initialAgent={omnibar.selectedAgent ? { id: omnibar.selectedAgent, name: omnibar.selectedAgent } as any : undefined}
    onSave={(agent) => {
      updateOmnibar({ 
        selectedAgent: agent.id,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
      });
    }}
  />
)}
```

**Expected Result**: Click icons → modals open

---

### **STEP 3: Replace UnifiedMarketplace with ToolBundleManager**
**File**: `apps/web/src/app/page.tsx`

**Find** (line ~107):
```typescript
{activeTab === 'marketplace' && <UnifiedMarketplace />}
```

**Replace with**:
```typescript
{activeTab === 'marketplace' && <ToolBundleManager />}
```

**Add import**:
```typescript
import { ToolBundleManager } from '@/components/ToolBundleManager';
```

**Remove import**:
```typescript
// Delete: import { UnifiedMarketplace } from '@/components/UnifiedMarketplace';
```

**Add data import to ToolBundleManager.tsx** (line ~30):
```typescript
import { marketplaceTools } from '@/data/marketplace-tools';

// In component:
const [availableTools, setAvailableTools] = useState<ToolBundleV1[]>(marketplaceTools);
```

**Expected Result**: Marketplace shows 30+ tools

---

## ✅ **VERIFICATION**

After all 3 steps:
```bash
# Start dev server
cd apps/web
npm run dev

# Open browser
# http://localhost:3000
```

**Should see**:
- [x] Purple floating circle (bottom-right)
- [x] Hover → compact mode
- [x] Click → expanded mode
- [x] Click project icon → modal
- [x] Click agent icon → config modal
- [x] Click "Marketplace" → 30+ tools
- [x] No console errors

---

## 🆘 **IF STUCK**

### TypeScript Error: "Property 'selectedProject' does not exist"
**Fix**: Add to Zustand store interface (`src/store/index.ts`, line ~50)
```typescript
omnibar: {
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  selectedProject?: string;  // ADD
  selectedAgent?: string;    // ADD
  systemPrompt?: string;     // ADD
  temperature?: number;      // ADD
  topP?: number;             // ADD
  maxTokens?: number;        // ADD
  wakeWord?: string;         // ADD
};
```

### Circle Not Visible
**Fix**: Check z-index in OmnibarV3.tsx (line ~165)
```typescript
className="fixed bottom-6 right-6 z-[9999] group"  // Increase z-index
```

### Voice Mode Still Fullscreen
**Fix**: OmnibarV2 still active. Complete Step 1.

### State Not Persisting
**Fix**: Clear localStorage
```typescript
localStorage.removeItem('platform-storage');
location.reload();
```

---

## 📚 **DETAILED DOCS**

1. **HANDOFF.md** - Complete integration guide (MAIN REFERENCE)
2. **copilot-instructions-integration.md** - This session's guide
3. **FINAL_STATUS.md** - What was built and why
4. **ELEGANCE_CHECKLIST.md** - Quality standards

---

## 🎯 **PRIORITY**

1. **Today**: Complete 3 steps above (1-2 hours)
2. **This Week**: Backend API (6-8 hours)
3. **Next Week**: Testing + Deploy (4-5 hours)
4. **Launch**: 🚀

---

## 💪 **CONFIDENCE BUILDER**

**What's Hard**: Already done (architecture, specifications)  
**What's Left**: Simple (find-and-replace imports)  
**Time Needed**: 1-2 hours  
**Risk Level**: LOW (can rollback easily)  
**Impact**: HIGH (unlocks all features)  

---

**YOU GOT THIS!** 🎉

**Start**: Open `HANDOFF.md`  
**Do**: Steps 1-3 above  
**Test**: Checklist above  
**Done**: Ship it! 🚀

---

*Last updated: November 3, 2025*  
*Status: Integration Phase*  
*Overall Progress: 80% → 95% (after integration)*
