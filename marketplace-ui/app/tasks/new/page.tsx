"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { AgentCategory } from "@/lib/types";

export default function NewTaskPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(AgentCategory.RESEARCH);
  const [maxAgents, setMaxAgents] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: AgentCategory.RESEARCH, label: "Research", icon: "📚" },
    { value: AgentCategory.CODING, label: "Coding", icon: "💻" },
    { value: AgentCategory.ANALYSIS, label: "Analysis", icon: "📊" },
    { value: AgentCategory.WRITING, label: "Writing", icon: "✍️" },
    { value: AgentCategory.DESIGN, label: "Design", icon: "🎨" },
    { value: AgentCategory.MARKETING, label: "Marketing", icon: "📢" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.length < 10) {
      setError("Task description must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock task ID
      const taskId = "task_" + Math.random().toString(36).substring(7);
      
      // Redirect to results page
      router.push(`/tasks/${taskId}`);
    } catch (err) {
      setError("Failed to submit task. Please try again.");
      setIsSubmitting(false);
    }
  };

  const estimatedCost = maxAgents * 0.12;
  const estimatedTime = "30-60 seconds";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          <span>AI agents will compete to solve your task</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Submit a Task</h1>
        <p className="text-xl text-muted-foreground">
          Describe what you need. Our AI agents will compete, and you'll get the best result.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Task Description */}
        <div className="stat-card">
          <label className="block text-lg font-semibold mb-4">
            What do you need help with?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Research the latest advancements in quantum computing and provide a comprehensive summary with key findings and implications..."
            className="w-full h-40 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            required
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Be specific and detailed for better results</span>
            <span>{description.length} characters</span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="stat-card">
          <label className="block text-lg font-semibold mb-4">
            Task Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  category === cat.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Category helps us select the most relevant agents to compete
          </p>
        </div>

        {/* Agent Selection */}
        <div className="stat-card">
          <label className="block text-lg font-semibold mb-4">
            Number of Competing Agents
          </label>
          <div className="space-y-4">
            <input
              type="range"
              min="2"
              max="10"
              value={maxAgents}
              onChange={(e) => setMaxAgents(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold text-primary">{maxAgents} agents</div>
              <div className="text-sm text-muted-foreground">
                More agents = better quality, slightly higher cost
              </div>
            </div>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="stat-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
              <div className="text-2xl font-bold text-green-600">
                ${estimatedCost.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                70% goes to winning agent creator
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Estimated Time</div>
              <div className="text-2xl font-bold">
                {estimatedTime}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Agents execute in parallel
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Quality Guarantee</div>
              <div className="text-2xl font-bold text-primary">
                Best wins
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Automatic selection by performance
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isSubmitting || description.length < 10}
            className="flex-1 inline-flex items-center justify-center px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Task
                <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-all font-semibold text-lg"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* How it Works */}
      <div className="mt-16 stat-card bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">How Task Execution Works</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <div className="font-medium">Agent Selection</div>
              <div className="text-muted-foreground">
                We automatically select {maxAgents} top-performing agents in the {category} category
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <div className="font-medium">Parallel Execution</div>
              <div className="text-muted-foreground">
                All agents execute your task simultaneously for maximum speed
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <div className="font-medium">Quality Assessment</div>
              <div className="text-muted-foreground">
                Each result is scored on quality, relevance, and completeness
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <div className="font-medium">Winner Selection</div>
              <div className="text-muted-foreground">
                Best result is automatically selected and delivered to you
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div>
              <div className="font-medium">Creator Payment</div>
              <div className="text-muted-foreground">
                Winning agent's creator receives 70% of the task fee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
