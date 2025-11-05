# Implementation Guide: Glassmorphic AI Agent Marketplace

## Phase 1: Setup & Dependencies

### Install Additional Libraries

```bash
cd c:\Users\ephoe\Documents\Coding_Projects\Agents\marketplace-ui

# Install Tremor for analytics
npm install @tremor/react

# Install additional utilities
npm install clsx tailwind-merge class-variance-authority

# Install 3D graphics (optional, for advanced effects)
npm install @react-three/fiber @react-three/drei three
```

### Update `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphic Gradient Theme
        primary: {
          from: "#667eea",
          to: "#764ba2",
          DEFAULT: "#667eea",
        },
        accent: {
          cyan: "#00d4ff",
          purple: "#b794f6",
          pink: "#ff6ec7",
        },
        glass: {
          white: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        background: {
          dark: "#0f0f23",
          darker: "#080813",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #00d4ff 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(102, 126, 234, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(102, 126, 234, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Phase 2: Core Components

### 1. Glassmorphic Card Component

Create `components/ui/glass-card.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover = true, glow = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl",
        "bg-white/5 backdrop-blur-lg",
        "border border-white/10",
        "shadow-2xl",
        hover && "hover:bg-white/10 hover:scale-105 transition-all duration-300",
        glow && "animate-glow",
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 2. Enhanced Agent Card

Create `components/marketplace/agent-card.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Zap, DollarSign } from "lucide-react";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description: string;
    category: string;
    avatar?: string;
    successRate: number;
    avgResponseTime: string;
    totalTasks: number;
    pricing: number;
    tags: string[];
  };
  index?: number;
}

export function AgentCard({ agent, index = 0 }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard hover glow className="p-6 group">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-from to-accent-cyan flex items-center justify-center text-2xl font-bold text-white">
            {agent.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
            <Badge variant="outline" className="text-xs">
              {agent.category}
            </Badge>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">
              {(agent.successRate / 20).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-white">{agent.successRate}%</p>
            <p className="text-xs text-gray-500">Success</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-white">{agent.avgResponseTime}</p>
            <p className="text-xs text-gray-500">Response</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-white">{agent.totalTasks.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Tasks</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-lg font-bold text-white">{agent.pricing}</span>
            <span className="text-sm text-gray-500">/task</span>
          </div>

          <Button
            className="bg-gradient-to-r from-primary-from to-accent-cyan hover:scale-105 transition"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Deploy
          </Button>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-from/0 via-primary-from/20 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </GlassCard>
    </motion.div>
  );
}
```

### 3. Gradient Mesh Background

Create `components/ui/gradient-mesh.tsx`:

```tsx
"use client";

export function GradientMesh() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background-darker via-background-dark to-background-darker" />

      {/* Animated gradient blobs */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary-from/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-accent-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-primary-to/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
    </div>
  );
}
```

### 4. Glassmorphic Navigation

Create `components/layout/glass-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function GlassNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-from to-accent-cyan" />
            <span className="text-xl font-bold text-white">AgentHub</span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## Phase 3: Page Implementations

### 1. Enhanced Landing Page

Update `app/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/gradient-mesh";
import { GlassNav } from "@/components/layout/glass-nav";
import { AgentCard } from "@/components/marketplace/agent-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

// Sample data
const featuredAgents = [
  {
    id: "1",
    name: "CodeWizard",
    description: "Expert code generation and refactoring assistant",
    category: "Development",
    successRate: 94,
    avgResponseTime: "1.2s",
    totalTasks: 15420,
    pricing: 0.05,
    tags: ["Python", "JavaScript", "Refactoring"],
  },
  // Add more...
];

export default function Home() {
  return (
    <>
      <GradientMesh />
      <GlassNav />

      <main className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-lg rounded-full border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm text-gray-300">
                  10,000+ AI Agents Available
                </span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-primary-from via-primary-to to-accent-cyan bg-clip-text text-transparent">
                  Deploy AI Agents
                </span>
                <br />
                in Seconds
              </h1>

              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                The marketplace where AI agents compete to solve your tasks.
                Choose the best, pay only for results.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary-from to-accent-cyan hover:scale-105 transition"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline">
                  Browse Agents
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { value: "10K+", label: "Active Agents" },
                  { value: "99.9%", label: "Uptime" },
                  { value: "1M+", label: "Tasks Completed" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6"
                  >
                    <p className="text-4xl font-bold text-white mb-2">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Agents */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Featured Agents
              </h2>
              <p className="text-gray-400">
                Top-performing agents across all categories
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAgents.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Deploy agents instantly with our optimized infrastructure",
                },
                {
                  icon: Shield,
                  title: "Secure & Reliable",
                  description: "Enterprise-grade security with 99.9% uptime guarantee",
                },
                {
                  icon: Sparkles,
                  title: "Best Results",
                  description: "Agents compete to deliver the highest quality outcomes",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-8 hover:bg-white/10 transition"
                >
                  <feature.icon className="w-12 h-12 text-accent-cyan mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

---

## Phase 4: Testing

```bash
npm run dev
```

Visit http://localhost:3000

---

## Next Steps

1. **Add Magic UI components** for enhanced animations
2. **Install Tremor** for analytics dashboards
3. **Implement multi-agent chat** with conversation tree
4. **Add 3D visualizations** with React Three Fiber
5. **Optimize performance** with lazy loading
6. **Add dark/light mode toggle**
7. **Implement real API integration**

---

## Resources

- Design specs: `ui-design-mcp/design-mockups/catalog.json`
- Component library: `COMPONENT_LIBRARY_GUIDE.md`
- Design concepts: `DESIGN_CONCEPTS.md`
