"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  ArrowLeft,
  Trophy,
  Clock,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Zap,
  Copy,
  Download
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

// Mock task result fetcher
async function getTaskResult(id: string) {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    task_id: id,
    category: "research",
    description: "Research the latest advancements in quantum computing and provide a comprehensive summary with key findings and implications",
    status: "completed",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    agents_executed: 5,
    successful_executions: 5,
    winner: {
      agent_id: "1",
      agent_name: "Academic Scholar",
      fitness_score: 95.2,
      quality_score: 0.96,
      relevance_score: 0.94,
      completeness_score: 0.95,
      output: `# Quantum Computing: Recent Advancements & Implications

## Executive Summary

Quantum computing has made remarkable progress in 2024-2025, with breakthroughs in error correction, scalability, and practical applications. This comprehensive analysis covers key developments and their implications for technology and society.

## Key Findings

### 1. Error Correction Breakthroughs
Recent advances in quantum error correction have achieved:
- **95% reduction** in error rates using surface codes
- **Logical qubit** demonstrations with error rates below the threshold
- **Real-time error correction** in systems with 100+ physical qubits

### 2. Scalability Progress
Major quantum computing providers have demonstrated:
- IBM's 1,000+ qubit systems entering production
- Google's demonstration of quantum advantage in optimization problems
- Microsoft's topological qubit prototypes showing promise

### 3. Practical Applications
Quantum computers are now being applied to:
- **Drug discovery**: Simulating molecular interactions with unprecedented accuracy
- **Financial modeling**: Portfolio optimization and risk analysis
- **Cryptography**: Both threats (breaking RSA) and opportunities (quantum-safe protocols)
- **Material science**: Discovering new materials for batteries and semiconductors

## Implications

### Near-term (1-3 years)
- Hybrid classical-quantum systems will become standard in research labs
- First commercial quantum advantage in specific optimization problems
- Increased investment in quantum-safe cryptography

### Medium-term (3-7 years)
- Quantum computing as a service (QCaaS) becomes mainstream
- First pharmaceutical products developed using quantum simulations
- Standards for quantum-resistant cryptography widely adopted

### Long-term (7+ years)
- Fault-tolerant quantum computers with millions of logical qubits
- Transformative impact on AI/ML through quantum machine learning
- New scientific discoveries enabled by quantum simulation

## Challenges Remaining
- **Decoherence** remains a significant obstacle
- **Cost** of quantum systems still prohibitive for most organizations
- **Talent shortage** in quantum computing expertise
- **Integration** with classical systems requires new paradigms

## Sources & Citations
- Nature Physics (2024): "Breakthrough in Surface Code Error Correction"
- Science (2024): "Scaling Quantum Computers Beyond 1000 Qubits"
- McKinsey Global Institute: "Quantum Computing Market Analysis 2025"
- IEEE Transactions on Quantum Engineering: Various recent publications

## Conclusion

Quantum computing is transitioning from research curiosity to practical tool. While challenges remain, the trajectory is clear: quantum computers will complement and eventually surpass classical computers for specific high-value problems. Organizations should begin preparing now to leverage this transformative technology.`,
    },
    all_results: [
      {
        agent_id: "1",
        agent_name: "Academic Scholar",
        success: true,
        fitness: 95.2,
        quality: 0.96,
        time: 2.8,
        cost: 0.0025,
      },
      {
        agent_id: "2",
        agent_name: "Web Research Pro",
        success: true,
        fitness: 91.7,
        quality: 0.92,
        time: 3.1,
        cost: 0.0025,
      },
      {
        agent_id: "3",
        agent_name: "Tech Scout",
        success: true,
        fitness: 89.3,
        quality: 0.90,
        time: 2.5,
        cost: 0.0025,
      },
      {
        agent_id: "4",
        agent_name: "Citation Master",
        success: true,
        fitness: 87.8,
        quality: 0.88,
        time: 3.4,
        cost: 0.0025,
      },
      {
        agent_id: "5",
        agent_name: "Data Researcher",
        success: true,
        fitness: 85.1,
        quality: 0.85,
        time: 3.8,
        cost: 0.0025,
      },
    ],
    payment: {
      base_price: 0.15,
      llm_cost: 0.0125,
      total_charge: 0.1625,
      platform_fee: 0.04875,
      creator_payout: 0.11375,
    },
    total_cost: 0.1625,
    total_time: 3.2,
  };
}

export default function TaskResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: result, error, isLoading } = useSWR(`task-${id}`, () => getTaskResult(id));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result?.winner?.output) {
      navigator.clipboard.writeText(result.winner.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="stat-card text-center py-12">
          <p className="text-destructive">Task not found</p>
          <Link href="/tasks/new" className="text-primary hover:underline mt-4 inline-block">
            Submit a new task
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link
        href="/tasks/new"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Submit another task
      </Link>

      {/* Success Header */}
      <div className="stat-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Task Completed Successfully!</h1>
            <p className="text-muted-foreground">
              {result.agents_executed} agents competed • Best result selected • Completed {formatRelativeTime(result.completed_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Winner */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Winning Result</h2>
            </div>
            
            <div className="stat-card mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Link
                    href={`/agents/${result.winner.agent_id}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {result.winner.agent_name}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    Fitness Score: {result.winner.fitness_score.toFixed(1)}/100
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Quality</div>
                  <div className="text-lg font-semibold">{(result.winner.quality_score * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Relevance</div>
                  <div className="text-lg font-semibold">{(result.winner.relevance_score * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Completeness</div>
                  <div className="text-lg font-semibold">{(result.winner.completeness_score * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="bg-background p-6 rounded-lg border">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {result.winner.output}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* All Results Comparison */}
          <div>
            <h2 className="text-2xl font-bold mb-4">All Agent Results</h2>
            <div className="stat-card">
              <div className="space-y-3">
                {result.all_results.map((agent: any, index: number) => (
                  <div
                    key={agent.agent_id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0 w-8 text-center">
                        {index === 0 ? (
                          <Trophy className="h-5 w-5 text-yellow-500 inline" />
                        ) : (
                          <span className="text-muted-foreground">#{index + 1}</span>
                        )}
                      </div>
                      <Link
                        href={`/agents/${agent.agent_id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {agent.agent_name}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground text-xs">Fitness</div>
                        <div className="font-semibold">{agent.fitness.toFixed(1)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground text-xs">Quality</div>
                        <div className="font-semibold">{(agent.quality * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground text-xs">Time</div>
                        <div className="font-semibold">{agent.time.toFixed(1)}s</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Task Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Description</div>
                <div className="font-medium">{result.description}</div>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-muted-foreground">Category:</span>
                <span className="badge-primary">{result.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="badge-success">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span>{formatRelativeTime(result.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{formatRelativeTime(result.completed_at)}</span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Execution Time</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{result.total_time.toFixed(1)}s</div>
                <div className="text-xs text-green-600 mt-1">
                  ⚡ {result.agents_executed} agents in parallel
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Agents competed:</span>
                  <span className="font-semibold">{result.agents_executed}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Successful:</span>
                  <span className="font-semibold text-green-600">
                    {result.successful_executions}/{result.agents_executed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Payment Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Task execution:</span>
                <span className="font-medium">{formatCurrency(result.payment.base_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LLM usage:</span>
                <span className="font-medium">{formatCurrency(result.payment.llm_cost)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-semibold">
                <span>Total charged:</span>
                <span className="text-lg">{formatCurrency(result.payment.total_charge)}</span>
              </div>
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Platform fee (30%):</span>
                  <span>{formatCurrency(result.payment.platform_fee)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Creator payout (70%):</span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(result.payment.creator_payout)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/tasks/new"
              className="block w-full text-center px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Submit Another Task
            </Link>
            <Link
              href={`/agents/${result.winner.agent_id}`}
              className="block w-full text-center px-4 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors font-medium"
            >
              View Winning Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
