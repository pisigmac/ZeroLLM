export interface SavingsLog {
  id: string;
  timestamp: string;
  modelId: string;
  providerId: string;
  promptTokens: number;
  completionTokens: number;
  inputCostSaved: number;
  outputCostSaved: number;
}

export interface SavingsStats {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalSavingsUSD: number;
  providerSavings: Record<string, number>;
  modelSavings: Record<string, number>;
  monthlySavings: Record<string, number>; // keyed by YYYY-MM
}

// 1. Estimate tokens (1 word ~ 1.35 tokens)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  const words = trimmed.split(/\s+/).length;
  return Math.ceil(words * 1.35);
}

// 2. Reference commercial costs in USD per token (equivalent average of GPT-4o / Claude Sonnet)
const REF_INPUT_COST_PER_TOKEN = 2.50 / 1000000;  // $2.50 per 1M tokens
const REF_OUTPUT_COST_PER_TOKEN = 10.00 / 1000000; // $10.00 per 1M tokens

// 3. Load logs from localStorage
export function getSavingsLogs(): SavingsLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("zerollm_savings_logs");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load savings logs:", e);
    return [];
  }
}

// 4. Add a new log entry
export function addSavingsLog(
  modelId: string,
  providerId: string,
  promptText: string,
  completionText: string,
  isFreeTier: boolean
): SavingsLog | null {
  if (typeof window === "undefined") return null;

  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(completionText);

  // If it is a free tier model, we saved money compared to commercial rates!
  // If they used a direct paid model, savings is 0 (as they paid commercial rates).
  const inputCostSaved = isFreeTier ? promptTokens * REF_INPUT_COST_PER_TOKEN : 0;
  const outputCostSaved = isFreeTier ? completionTokens * REF_OUTPUT_COST_PER_TOKEN : 0;

  const log: SavingsLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    modelId,
    providerId,
    promptTokens,
    completionTokens,
    inputCostSaved,
    outputCostSaved,
  };

  try {
    const existing = getSavingsLogs();
    existing.push(log);
    // Limit to last 500 logs to preserve storage size limit
    if (existing.length > 500) {
      existing.shift();
    }
    localStorage.setItem("zerollm_savings_logs", JSON.stringify(existing));
    return log;
  } catch (e) {
    console.error("Failed to save savings log:", e);
    return null;
  }
}

// 5. Compute stats from logs
export function getSavingsStats(): SavingsStats {
  const logs = getSavingsLogs();
  const stats: SavingsStats = {
    totalRequests: logs.length,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalSavingsUSD: 0,
    providerSavings: {},
    modelSavings: {},
    monthlySavings: {},
  };

  for (const log of logs) {
    stats.totalPromptTokens += log.promptTokens;
    stats.totalCompletionTokens += log.completionTokens;
    
    const savings = log.inputCostSaved + log.outputCostSaved;
    stats.totalSavingsUSD += savings;

    // By Provider
    stats.providerSavings[log.providerId] = (stats.providerSavings[log.providerId] || 0) + savings;

    // By Model
    stats.modelSavings[log.modelId] = (stats.modelSavings[log.modelId] || 0) + savings;

    // By Month
    const date = new Date(log.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    stats.monthlySavings[monthKey] = (stats.monthlySavings[monthKey] || 0) + savings;
  }

  return stats;
}

// 6. Clear logs
export function clearSavingsLogs(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("zerollm_savings_logs");
  } catch (e) {
    console.error("Failed to clear savings logs:", e);
  }
}
