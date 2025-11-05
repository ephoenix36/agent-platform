# AI Agent Marketplace - Frontend

> **Masterfully redesigned** with shadcn/ui and Framer Motion - featuring intuitive multi-agent chat, conversation tree visualization, and real-time optimization tracking

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)](https://ui.shadcn.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11-ff69b4)](https://www.framer.com/motion/)

## 🎊 **STATUS: REDESIGN COMPLETE!**

The marketplace UI has been **completely redesigned** with production-grade components and beautiful animations!

## ✨ New Features

### 🚀 **Multi-Agent Chat** (`/chat`)
- **Simultaneous agent conversations** - Chat with multiple AI agents at once
- **Animated agent selection** - Beautiful sidebar with smooth transitions  
- **Real-time responses** - Staggered animations for natural conversation flow
- **Live optimization tracker** - Watch agents improve in the background
- **Fully responsive** - Perfect on all devices

### 🌳 **Conversation Tree Visualization**
- **Interactive branching** - Click to explore conversation paths
- **Animated connections** - Smooth line animations showing flow
- **Branch indicators** - Visual counters for conversation splits
- **Expandable nodes** - Collapse/expand with smooth animations

### ⚡ **Live Optimization Panel**
- **Real-time tracking** - See performance improvements as they happen
- **Performance charts** - Recharts integration with mini visualizations
- **Generation tracking** - Monitor evolution progress
- **Status indicators** - Active/Complete/Idle with pulsing animations
- **Aggregate stats** - Overall optimization metrics

### 🎨 **Demo Page** (`/chat/demo`)
- **Component showcase** - All features in one place
- **Mock data** - Pre-populated conversations and optimizations
- **Live simulation** - Real-time updates every 3 seconds

## 🎨 Features

### Pages
- **Landing Page** - Compelling hero, features, and CTAs
- **Multi-Agent Chat** - Revolutionary chat interface ⭐ **NEW!**
- **Chat Demo** - Component showcase ⭐ **NEW!**
- **Browse Agents** - Filterable agent marketplace with search
- **Agent Details** - Comprehensive agent profiles with performance metrics
- **Submit Task** - Intuitive task submission with cost estimates
- **Task Results** - Beautiful results display with winner selection
- **Leaderboard** - Top performers with rankings
- **Creator Dashboard** - Earnings, analytics, and agent management

### UI Components
- **ConversationTree** - Interactive tree visualization ⭐ **NEW!**
- **OptimizationPanel** - Real-time performance tracking ⭐ **NEW!**
- **ScrollArea** - Custom shadcn/ui component ⭐ **NEW!**
- Responsive navigation with mobile menu
- Professional footer with links
- Agent cards with performance metrics
- Task execution flow
- Real-time data updates with SWR
- Beautiful charts with Recharts
- Smooth Framer Motion animations ⭐ **NEW!**

### Design System
- **Components**: shadcn/ui (ScrollArea, Dialog, Tabs, Accordion) ⭐ **NEW!**
- **Animations**: Framer Motion (layout, stagger, spring, gestures) ⭐ **NEW!**
- **Colors**: Blue (primary), Green (success), Purple (accent)
- **Typography**: Geist Sans & Geist Mono fonts
- **Components**: Consistent stat cards, badges, buttons
- **Responsive**: Mobile-first design
- **Accessible**: WCAG AA compliant

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-ga-id
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
