import "dotenv/config";
import fs from "fs";
import path from "path";
import { Model, Provider } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

// Utility helper to sleep/throttle requests
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("Starting LLM Provider model health check verification...");

  const providersFile = path.join(DATA_DIR, "providers.json");
  const modelsFile = path.join(DATA_DIR, "models.json");
  const lastSyncFile = path.join(DATA_DIR, "last-sync.json");

  if (!fs.existsSync(providersFile) || !fs.existsSync(modelsFile)) {
    console.error("Missing files in database directory.");
    process.exit(1);
  }

  const providers: Provider[] = JSON.parse(fs.readFileSync(providersFile, "utf-8"));
  const models: Model[] = JSON.parse(fs.readFileSync(modelsFile, "utf-8"));

  const configKeys = {
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cohere: process.env.COHERE_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
    gemini: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    nvidia: process.env.NVIDIA_API_KEY,
    github: process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };

  let verifiedCount = 0;

  for (const model of models) {
    const provider = providers.find((p) => p.id === model.providerId);
    if (!provider) continue;

    const apiKey = (configKeys as Record<string, string | undefined>)[provider.id];
    if (!apiKey) {
      console.log(`Skipping verification for '${model.id}': API key not configured for '${provider.name}'.`);
      continue;
    }

    console.log(`Verifying model health for '${model.id}'...`);
    
    let targetUrl = `${provider.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (provider.id === "gemini") {
      targetUrl = `${provider.baseUrl}/v1beta/openai/chat/completions`;
    } else if (provider.id === "huggingface") {
      targetUrl = `https://api-inference.huggingface.co/v1/chat/completions`;
    } else if (provider.id === "openrouter") {
      headers["HTTP-Referer"] = "https://zerollm.vercel.app";
      headers["X-Title"] = "ZeroLLM Verification";
    }

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model.modelId,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      model.lastVerifiedAt = new Date().toISOString();

      if (response.ok) {
        console.log(`Model '${model.id}' is ONLINE.`);
        model.status = "online";
        model.verified = true;
        model.lastError = undefined;
        verifiedCount++;
      } else if (response.status === 429) {
        // Rate limit hit means the model is online and accepting requests, we just hit limit
        console.log(`Model '${model.id}' returned 429 (Rate Limit). Classified as ONLINE.`);
        model.status = "online";
        model.verified = true;
        model.lastError = "Rate limit exceeded (HTTP 429)";
        verifiedCount++;
      } else {
        const errorText = await response.text();
        console.warn(`Model '${model.id}' returned HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        model.status = "offline";
        model.verified = false;
        model.lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Error connecting to model '${model.id}':`, errMsg);
      model.status = "offline";
      model.verified = false;
      model.lastError = `Network connection failure: ${errMsg}`;
    }

    // Throttle to 1 request per second to avoid spamming rates
    await sleep(1000);
  }

  // Write updated models back
  fs.writeFileSync(modelsFile, JSON.stringify(models, null, 2), "utf-8");

  // Update last-sync metadata
  if (fs.existsSync(lastSyncFile)) {
    const lastSync = JSON.parse(fs.readFileSync(lastSyncFile, "utf-8"));
    lastSync.verifiedAt = new Date().toISOString();
    lastSync.onlineModels = models.filter((m) => m.status === "online").length;
    lastSync.verifiedModels = models.filter((m) => m.verified).length;
    fs.writeFileSync(lastSyncFile, JSON.stringify(lastSync, null, 2), "utf-8");
  }

  console.log(`Health check verification completed! Verified ${verifiedCount} models.`);
}

main().catch((e) => {
  console.error("Fatal verification error:", e);
  process.exit(1);
});
