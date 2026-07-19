import "dotenv/config";
import fs from "fs";
import path from "path";
import { Model, Provider, RawModel, Modality } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

// Score Recalculator Heuristic
function calculateScore(model: Model, provider: Provider): number {
  let score = 50; // base score

  // 1. Context size (Max 20 pts)
  if (model.contextWindow >= 1000000) score += 20;
  else if (model.contextWindow >= 128000) score += 15;
  else if (model.contextWindow >= 32000) score += 10;
  else if (model.contextWindow >= 8000) score += 5;

  // 2. Modalities (Max 15 pts)
  score += Math.min(15, model.modalities.length * 3);

  // 3. Accessibility / CC (Max 15 pts)
  if (!provider.creditCardRequired) {
    score += 15;
  }

  // 4. Status / Reliability (Max 10 pts)
  if (model.status === "online") score += 10;

  // Cap score between 0 and 100
  return Math.min(100, Math.max(0, score));
}

// Fetchers for each provider API
async function fetchGroq(apiKey: string): Promise<RawModel[]> {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Groq returned ${res.status}`);
  const data = await res.json();
  
  interface GroqModelRaw {
    id: string;
    context_window?: number;
  }

  return (data.data as GroqModelRaw[] || []).map((m) => ({
    id: m.id,
    name: m.id.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    contextWindow: m.context_window || 8192,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchOpenRouter(): Promise<RawModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
  const data = await res.json();
  
  interface OpenRouterRaw {
    id: string;
    name: string;
    context_length?: number;
    pricing?: { prompt: string };
  }

  // Filter only free models
  const freeModels = (data.data as OpenRouterRaw[] || []).filter((m) => m.pricing?.prompt === "0");
  
  return freeModels.map((m) => ({
    id: m.id,
    name: m.name,
    contextWindow: m.context_length || 4096,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchMistral(apiKey: string): Promise<RawModel[]> {
  const res = await fetch("https://api.mistral.ai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Mistral returned ${res.status}`);
  const data = await res.json();

  interface MistralModelRaw {
    id: string;
    name?: string;
    max_context_length?: number;
  }

  return (data.data as MistralModelRaw[] || []).map((m) => ({
    id: m.id,
    name: m.name || m.id,
    contextWindow: m.max_context_length || 32768,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchCerebras(apiKey: string): Promise<RawModel[]> {
  const res = await fetch("https://api.cerebras.ai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Cerebras returned ${res.status}`);
  const data = await res.json();

  interface CerebrasModelRaw {
    id: string;
    name?: string;
  }

  return (data.data as CerebrasModelRaw[] || []).map((m) => ({
    id: m.id,
    name: m.name || m.id,
    contextWindow: 8192,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchGemini(apiKey: string): Promise<RawModel[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const data = await res.json();
  
  interface GeminiModelRaw {
    name: string;
    displayName?: string;
    supportedGenerationMethods?: string[];
    inputTokenLimit?: number;
    outputTokenLimit?: number;
  }

  // Filter for text generation models (excluding specialized interactions-only models)
  const models = (data.models as GeminiModelRaw[] || []).filter(
    (m) =>
      m.supportedGenerationMethods?.includes("generateContent") &&
      !m.name.toLowerCase().includes("deep-research") &&
      !m.name.toLowerCase().includes("antigravity")
  );

  return models.map((m) => {
    const cleanId = m.name.replace("models/", "");
    const modalities: Modality[] = ["text", "code"];
    if (m.inputTokenLimit && m.inputTokenLimit > 100000) modalities.push("pdf");
    // Gemini models generally accept multimodal inputs
    modalities.push("image", "video", "audio");

    return {
      id: cleanId,
      name: m.displayName || cleanId,
      contextWindow: m.inputTokenLimit || 32768,
      maxOutputTokens: m.outputTokenLimit || 8192,
      modalities,
    };
  });
}

async function main() {
  console.log("Starting LLM Provider models sync...");

  const providersFile = path.join(DATA_DIR, "providers.json");
  const modelsFile = path.join(DATA_DIR, "models.json");
  const lastSyncFile = path.join(DATA_DIR, "last-sync.json");

  if (!fs.existsSync(providersFile) || !fs.existsSync(modelsFile)) {
    console.error("Missing seeds directory or files.");
    process.exit(1);
  }

  const providers: Provider[] = JSON.parse(fs.readFileSync(providersFile, "utf-8"));
  const existingModels: Model[] = JSON.parse(fs.readFileSync(modelsFile, "utf-8"));

  const updatedModels: Model[] = [...existingModels];

  const configKeys = {
    groq: process.env.GROQ_API_KEY,
    openrouter: "public", // no key needed to fetch openrouter models list
    mistral: process.env.MISTRAL_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
    gemini: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  };

  for (const provider of providers) {
    const apiKey = (configKeys as Record<string, string | undefined>)[provider.id];
    if (!apiKey) {
      console.log(`Skipping sync for '${provider.name}': API key not configured in environment.`);
      continue;
    }

    console.log(`Syncing models for '${provider.name}'...`);
    try {
      let rawModels: RawModel[] = [];
      if (provider.id === "groq") rawModels = await fetchGroq(apiKey);
      else if (provider.id === "openrouter") rawModels = await fetchOpenRouter();
      else if (provider.id === "mistral") rawModels = await fetchMistral(apiKey);
      else if (provider.id === "cerebras") rawModels = await fetchCerebras(apiKey);
      else if (provider.id === "gemini") rawModels = await fetchGemini(apiKey);

      console.log(`Found ${rawModels.length} models for ${provider.name}. Merging...`);

      for (const raw of rawModels) {
        const uniqueId = `${provider.id}/${raw.id}`;
        const existingIdx = updatedModels.findIndex((m) => m.id === uniqueId);

        const newModel: Model = {
          id: uniqueId,
          providerId: provider.id,
          name: raw.name || raw.id,
          modelId: raw.id,
          contextWindow: raw.contextWindow || 8192,
          maxOutputTokens: raw.maxOutputTokens || 4096,
          modalities: raw.modalities || ["text", "code"],
          status: "online",
          verified: false,
          freeTier: true,
          noCreditCard: !provider.creditCardRequired,
          score: 50,
          releasedAt: new Date().toISOString().split("T")[0],
          lastVerifiedAt: new Date().toISOString(),
        };

        // Preserve manual metadata fields from existing entries
        if (existingIdx !== -1) {
          const old = updatedModels[existingIdx];
          newModel.rateLimit = old.rateLimit;
          newModel.score = old.score;
          newModel.status = old.status;
          newModel.verified = old.verified;
          newModel.releasedAt = old.releasedAt;
          newModel.lastVerifiedAt = old.lastVerifiedAt;
          newModel.lastError = old.lastError;
        }

        // Recalculate ranking score
        newModel.score = calculateScore(newModel, provider);

        if (existingIdx !== -1) {
          updatedModels[existingIdx] = newModel;
        } else {
          updatedModels.push(newModel);
        }
      }

      // Update provider last sync timestamp
      provider.lastSyncedAt = new Date().toISOString();

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to sync models for provider '${provider.name}':`, errMsg);
    }
  }

  // Write files back
  fs.writeFileSync(modelsFile, JSON.stringify(updatedModels, null, 2), "utf-8");
  fs.writeFileSync(providersFile, JSON.stringify(providers, null, 2), "utf-8");

  // Update last-sync counts
  const lastSyncData = {
    syncedAt: new Date().toISOString(),
    totalModels: updatedModels.length,
    onlineModels: updatedModels.filter((m) => m.status === "online").length,
    verifiedModels: updatedModels.filter((m) => m.verified).length,
    providerCount: providers.length,
  };
  fs.writeFileSync(lastSyncFile, JSON.stringify(lastSyncData, null, 2), "utf-8");

  console.log("Model sync successfully finished!");
}

main().catch((e) => {
  console.error("Fatal sync error:", e);
  process.exit(1);
});
