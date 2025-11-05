/**
 * Global Platform State Store (Zustand)
 * Manages all persistent UI state across the platform
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Widget layout type
export interface Widget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  collapsed: boolean;
  data?: any;
}

// Omnibar state type
export interface OmnibarState {
  isVisible: boolean;
  isExpanded: boolean;
  isCollapsed: boolean;
  selectedAgent?: string;
  selectedProject?: string;
  systemPrompt?: string;
  currentProject?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  wakeWord?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// View mode type
export type ViewMode = 'views' | 'dev' | 'chat' | 'graph' | 'sessions';

// Platform store interface
interface PlatformStore {
  // Dashboard widgets
  widgets: Widget[];
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  collapseWidget: (id: string) => void;
  
  // Omnibar state
  omnibar: OmnibarState;
  setOmnibarVisible: (visible: boolean) => void;
  setOmnibarExpanded: (expanded: boolean) => void;
  setOmnibarCollapsed: (collapsed: boolean) => void;
  setOmnibarPosition: (position: { x: number; y: number }) => void;
  setOmnibarSize: (size: { width: number; height: number }) => void;
  updateOmnibar: (updates: Partial<OmnibarState>) => void;
  
  // Current view/project context
  currentView: ViewMode;
  currentProject: string | null;
  setCurrentView: (view: ViewMode) => void;
  setCurrentProject: (projectId: string | null) => void;
  
  // UI preferences
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Reset
  reset: () => void;
}

// Default state
const defaultOmnibarState: OmnibarState = {
  isVisible: true,
  isExpanded: false,
  isCollapsed: false,
  selectedAgent: undefined,
  systemPrompt: undefined,
  currentProject: undefined,
  position: { x: 100, y: 100 },
  size: { width: 800, height: 80 },
};

const defaultWidgets: Widget[] = [
  {
    id: 'key-metrics',
    type: 'metrics',
    title: 'Key Metrics',
    position: { x: 20, y: 20 },
    size: { width: 350, height: 250 },
    collapsed: false,
  },
  {
    id: 'recent-activity',
    type: 'activity',
    title: 'Recent Activity',
    position: { x: 390, y: 20 },
    size: { width: 350, height: 250 },
    collapsed: false,
  },
  {
    id: 'active-agents',
    type: 'agents',
    title: 'Active Agents',
    position: { x: 20, y: 290 },
    size: { width: 350, height: 300 },
    collapsed: false,
  },
  {
    id: 'performance',
    type: 'performance',
    title: 'Performance',
    position: { x: 390, y: 290 },
    size: { width: 350, height: 300 },
    collapsed: false,
  },
];

// Create the store with persistence
export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set) => ({
      // Dashboard widgets
      widgets: defaultWidgets,
      addWidget: (widget) =>
        set((state) => ({ widgets: [...state.widgets, widget] })),
      removeWidget: (id) =>
        set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) })),
      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),
      collapseWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, collapsed: !w.collapsed } : w
          ),
        })),

      // Omnibar state
      omnibar: defaultOmnibarState,
      setOmnibarVisible: (visible) =>
        set((state) => ({ omnibar: { ...state.omnibar, isVisible: visible } })),
      setOmnibarExpanded: (expanded) =>
        set((state) => ({ omnibar: { ...state.omnibar, isExpanded: expanded } })),
      setOmnibarCollapsed: (collapsed) =>
        set((state) => ({ omnibar: { ...state.omnibar, isCollapsed: collapsed } })),
      setOmnibarPosition: (position) =>
        set((state) => ({ omnibar: { ...state.omnibar, position } })),
      setOmnibarSize: (size) =>
        set((state) => ({ omnibar: { ...state.omnibar, size } })),
      updateOmnibar: (updates) =>
        set((state) => ({ omnibar: { ...state.omnibar, ...updates } })),

      // Current view/project context
      currentView: 'views',
      currentProject: null,
      setCurrentView: (view) => set({ currentView: view }),
      setCurrentProject: (projectId) => set({ currentProject: projectId }),

      // UI preferences
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Reset
      reset: () =>
        set({
          widgets: defaultWidgets,
          omnibar: defaultOmnibarState,
          currentView: 'views',
          currentProject: null,
          sidebarCollapsed: false,
          theme: 'dark',
        }),
    }),
    {
      name: 'platform-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
