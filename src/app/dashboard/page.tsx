"use client";

import { useState, useEffect } from "react";
import { getSavingsStats, clearSavingsLogs, getSavingsLogs, addSavingsLog } from "@/lib/savings";
import { DollarSign, Cpu, MessageSquare, Trash2, ArrowUpRight, BarChart2, Award } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState(() => {
    // Standard initialization safe for server rendering
    return {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalSavingsUSD: 0,
      providerSavings: {} as Record<string, number>,
      modelSavings: {} as Record<string, number>,
      monthlySavings: {} as Record<string, number>,
    };
  });
  
  const [isDemo, setIsDemo] = useState(false);

  // Hook to load stats on client side
  useEffect(() => {
    const timer = setTimeout(() => {
      const logs = getSavingsLogs();
      
      // Seed demo logs if database is empty so the dashboard looks stunning from the start
      if (logs.length === 0) {
        setIsDemo(true);
        // Seed several mock log entries
        const demoData = [
          { model: "groq/llama-3.3-70b-versatile", provider: "groq", pText: "Write a high performance quicksort algorithm in C++ and explain details", cText: "Certainly! Here is the C++ quicksort implementation along with a detailed explanation of recursion, partitioning, and complexity analysis...".repeat(8) },
          { model: "gemini/gemini-1.5-flash", provider: "gemini", pText: "Translate this list of instructions and summarize key takeaways", cText: "Here is the translated layout...".repeat(12) },
          { model: "openrouter/meta-llama/llama-3.1-405b-instruct:free", provider: "openrouter", pText: "Plan a 3-day itinerary for Tokyo focused on history and sushi", cText: "Tokyo 3-Day Itinerary: Day 1...".repeat(15) },
          { model: "groq/gemma2-9b-it", provider: "groq", pText: "Explain quantum computing in simple terms", cText: "Imagine a coin spinning on a table...".repeat(6) },
          { model: "huggingface/meta-llama/Llama-3.2-3B-Instruct", provider: "huggingface", pText: "Draft an email requesting project deadline extension", cText: "Subject: Request for extension...".repeat(2) },
        ];

        for (let i = 0; i < 24; i++) {
          const item = demoData[Math.floor(Math.random() * demoData.length)];
          addSavingsLog(item.model, item.provider, item.pText, item.cText, true);
        }
      }
      
      setStats(getSavingsStats());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your local usage logs?")) {
      clearSavingsLogs();
      setIsDemo(false);
      setStats({
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalSavingsUSD: 0,
        providerSavings: {},
        modelSavings: {},
        monthlySavings: {},
      });
    }
  };

  // Extract sorting details for provider charts
  const sortedProviders = Object.entries(stats.providerSavings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedModels = Object.entries(stats.modelSavings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Savings & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time financial calculator showing savings from utilizing free-tier developer APIs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full font-semibold border border-amber-200/50">
              Demo Data Seeded
            </span>
          )}
          <button
            onClick={handleClear}
            disabled={stats.totalRequests === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Data
          </button>
        </div>
      </div>

      {/* Main savings callout card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total savings */}
        <div className="md:col-span-2 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <DollarSign className="h-44 w-44 text-green-500" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-1">
                <Award className="h-4 w-4" />
                Estimated Saved Capital
              </span>
              <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight py-2">
                ${stats.totalSavingsUSD.toFixed(3)}
              </div>
            </div>
            <div className="bg-green-500/20 text-green-700 dark:text-green-300 p-3 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            Based on equivalent commercial rates of <span className="font-semibold text-slate-800 dark:text-slate-200">$2.50/M input</span> and <span className="font-semibold text-slate-800 dark:text-slate-200">$10.00/M output</span> tokens.
          </p>
        </div>

        {/* Requests */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total API Requests
              </span>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 pt-1">
                {stats.totalRequests}
              </div>
            </div>
            <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
            <span>Developer tier queries logged</span>
          </div>
        </div>

        {/* Tokens generated */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Est. Total Tokens
              </span>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 pt-1">
                {((stats.totalPromptTokens + stats.totalCompletionTokens) / 1000).toFixed(1)}k
              </div>
            </div>
            <div className="bg-blue-500/10 text-blue-500 p-2.5 rounded-lg">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-4 leading-normal">
            <div>Prompt: {stats.totalPromptTokens.toLocaleString()}</div>
            <div>Completion: {stats.totalCompletionTokens.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Analytics breakdown sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Savings by Provider (Bar Chart) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BarChart2 className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Savings by Provider
            </h2>
          </div>

          {sortedProviders.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No provider savings logged yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProviders.map(([provider, val]) => {
                const percentage = stats.totalSavingsUSD > 0 ? (val / stats.totalSavingsUSD) * 100 : 0;
                return (
                  <div key={provider} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-slate-700 dark:text-slate-300">{provider}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">
                        ${val.toFixed(3)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top saved Models */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Cpu className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Top Value-Generating Models
            </h2>
          </div>

          {sortedModels.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No model savings logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedModels.map(([modelId, val]) => {
                const percentage = stats.totalSavingsUSD > 0 ? (val / stats.totalSavingsUSD) * 100 : 0;
                return (
                  <div
                    key={modelId}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-50">
                        {modelId.split("/").pop()}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{modelId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        ${val.toFixed(3)}
                      </div>
                      <div className="text-[9px] text-green-600 dark:text-green-400 font-semibold">
                        {percentage.toFixed(0)}% contribution
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Guide section */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-border p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          How this calculation works:
        </h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          AgentRadar tracks the raw text input and output counts in your playground terminal sessions. It maps the values to tokens and calculates potential cost overhead by checking if the query was executed against a free-tier endpoint (e.g. Groq, Google AI Studio free tier, or OpenRouter free models). Cost rates refer to direct OpenAI commercial prices for enterprise models, making it easy to track how much you save on API billing during prototype development.
        </p>
      </div>
    </div>
  );
}
