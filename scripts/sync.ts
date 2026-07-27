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
async function fetchGroq(apiKey: string, baseUrl = "https://api.groq.com/openai/v1"): Promise<RawModel[]> {
  if (apiKey && apiKey !== "public") {
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        interface GroqModelRaw {
          id: string;
          context_window?: number;
        }

        return ((data.data as GroqModelRaw[]) || []).map((m) => ({
          id: m.id,
          name: m.id,
          contextWindow: m.context_window || 8192,
          modalities: ["text", "code"] as Modality[],
        }));
      }
    } catch (err) {
      console.warn("Groq API query failed, using catalog seeds:", err);
    }
  }

  return [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "llama3-70b-8192", name: "Llama 3 70B", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
    { id: "llama3-8b-8192", name: "Llama 3 8B", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: 32768, modalities: ["text", "code"] as Modality[] },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", contextWindow: 128000, modalities: ["text", "code", "reasoning"] as Modality[] },
  ];
}

async function fetchOpenRouter(apiKey?: string, baseUrl = "https://openrouter.ai/api/v1"): Promise<RawModel[]> {
  const headers: Record<string, string> = {};
  if (apiKey && apiKey !== "public") headers["Authorization"] = `Bearer ${apiKey}`;
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
  const data = await res.json();
  
  interface OpenRouterModelRaw {
    id: string;
    name?: string;
    context_length?: number;
    top_provider?: { max_completion_tokens?: number };
    architecture?: { modality?: string; input_modalities?: string[] };
  }

  return ((data.data as OpenRouterModelRaw[]) || []).map((m) => {
    const modalities: Modality[] = ["text", "code"];
    if (m.architecture?.input_modalities?.includes("image") || m.architecture?.modality?.includes("text->image")) {
      modalities.push("image");
    }
    return {
      id: m.id,
      name: m.name || m.id,
      contextWindow: m.context_length || 4096,
      maxOutputTokens: m.top_provider?.max_completion_tokens || 4096,
      modalities,
    };
  });
}

async function fetchCohere(apiKey?: string, baseUrl = "https://api.cohere.com/v1"): Promise<RawModel[]> {
  if (apiKey && apiKey !== "public") {
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        interface CohereModelRaw {
          name: string;
          context_length?: number;
        }
        return ((data.models as CohereModelRaw[]) || []).map((m) => ({
          id: m.name,
          name: m.name,
          contextWindow: m.context_length || 128000,
          modalities: ["text", "code"] as Modality[],
        }));
      }
    } catch (err) {
      console.warn("Cohere API query failed, using catalog seeds:", err);
    }
  }

  return [
    { id: "command-r-plus", name: "Command R+", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "command-r", name: "Command R", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
  ];
}

async function fetchMistral(apiKey: string, baseUrl = "https://api.mistral.ai/v1"): Promise<RawModel[]> {
  if (apiKey && apiKey !== "public") {
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        interface MistralModelRaw {
          id: string;
          name?: string;
          max_context_length?: number;
        }

        return ((data.data as MistralModelRaw[]) || []).map((m) => ({
          id: m.id,
          name: m.name || m.id,
          contextWindow: m.max_context_length || 32768,
          modalities: ["text", "code"] as Modality[],
        }));
      }
    } catch (err) {
      console.warn("Mistral API query failed, using catalog seeds:", err);
    }
  }

  return [
    { id: "mistral-large-latest", name: "Mistral Large", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "mistral-small-latest", name: "Mistral Small", contextWindow: 32768, modalities: ["text", "code"] as Modality[] },
    { id: "codestral-latest", name: "Codestral", contextWindow: 32768, modalities: ["code"] as Modality[] },
    { id: "open-mistral-7b", name: "Mistral 7B", contextWindow: 32768, modalities: ["text", "code"] as Modality[] },
    { id: "open-mixtral-8x7b", name: "Mixtral 8x7B", contextWindow: 32768, modalities: ["text", "code"] as Modality[] },
  ];
}

async function fetchCerebras(apiKey: string, baseUrl = "https://api.cerebras.ai/v1"): Promise<RawModel[]> {
  if (apiKey && apiKey !== "public") {
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        interface CerebrasModelRaw {
          id: string;
          name?: string;
        }

        return ((data.data as CerebrasModelRaw[]) || []).map((m) => ({
          id: m.id,
          name: m.name || m.id,
          contextWindow: 8192,
          modalities: ["text", "code"] as Modality[],
        }));
      }
    } catch (err) {
      console.warn("Cerebras API query failed, using catalog seeds:", err);
    }
  }

  return [
    { id: "llama3.1-70b", name: "Cerebras Llama 3.1 70B", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
    { id: "llama3.1-8b", name: "Cerebras Llama 3.1 8B", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
  ];
}

async function fetchGemini(apiKey: string, baseUrl = "https://generativelanguage.googleapis.com"): Promise<RawModel[]> {
  if (apiKey && apiKey !== "public") {
    try {
      const cleanBase = baseUrl.replace(/\/+$/, "");
      const url = `${cleanBase}/v1beta/models?key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        interface GeminiModelRaw {
          name: string;
          displayName?: string;
          supportedGenerationMethods?: string[];
          inputTokenLimit?: number;
          outputTokenLimit?: number;
        }

        const models = ((data.models as GeminiModelRaw[]) || []).filter(
          (m) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            !m.name.toLowerCase().includes("deep-research") &&
            !m.name.toLowerCase().includes("antigravity") &&
            !m.name.toLowerCase().includes("tts") &&
            !m.name.toLowerCase().includes("stt")
        );

        return models.map((m) => {
          const cleanId = m.name.replace("models/", "");
          const modalities: Modality[] = ["text", "code"];
          if (m.inputTokenLimit && m.inputTokenLimit > 100000) modalities.push("pdf");
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
    } catch (err) {
      console.warn("Gemini API query failed, using catalog seeds:", err);
    }
  }

  return [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 2000000, maxOutputTokens: 8192, modalities: ["text", "code", "image", "video", "pdf"] as Modality[] },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 1000000, maxOutputTokens: 8192, modalities: ["text", "code", "image", "video", "pdf"] as Modality[] },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2000000, maxOutputTokens: 8192, modalities: ["text", "code", "image", "video", "pdf"] as Modality[] },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1000000, maxOutputTokens: 8192, modalities: ["text", "code", "image", "video", "pdf"] as Modality[] },
  ];
}

async function fetchGitHub(apiKey?: string, baseUrl = "https://models.inference.ai.azure.com"): Promise<RawModel[]> {
  const headers: Record<string, string> = {};
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub Models returned ${res.status}`);
  const data = await res.json();

  interface GitHubModelRaw {
    id: string;
    name?: string;
    friendly_name?: string;
    task?: string;
  }

  return ((data as GitHubModelRaw[]) || []).map((m) => ({
    id: m.name || m.id,
    name: m.friendly_name || m.name || m.id,
    contextWindow: 128000,
    modalities: m.task === "embeddings" ? (["embedding"] as Modality[]) : (["text", "code"] as Modality[]),
  }));
}

async function fetchNvidia(apiKey?: string, baseUrl = "https://integrate.api.nvidia.com/v1"): Promise<RawModel[]> {
  const modelMap = new Map<string, RawModel>();

  // 1. Try fetching from NVIDIA NIM API endpoint
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const url = `${baseUrl.replace(/\/+$/, "")}/models`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      interface NvidiaModelRaw {
        id: string;
      }
      for (const m of (data.data as NvidiaModelRaw[]) || []) {
        const parts = m.id.split("/");
        const simpleName = parts[parts.length - 1]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        modelMap.set(m.id, {
          id: m.id,
          name: simpleName,
          contextWindow: 128000,
          modalities: ["text", "code"] as Modality[],
        });
      }
    }
  } catch (err) {
    console.warn("NVIDIA NIM API endpoint query skipped/failed:", err);
  }

  // 2. Scrape build.nvidia.com catalog pages
  const catalogPages = [
    "https://build.nvidia.com/models?pageSize=96&page=1",
    "https://build.nvidia.com/models?pageSize=96&page=2",
  ];

  const blacklist = [
    "explore", "docs", "legal", "privacy", "_next", "api", "models",
    "orgs", "teams", "contact", "support", "community", "account"
  ];

  for (const pageUrl of catalogPages) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (res.ok) {
        const html = await res.text();
        const hrefMatches = [...html.matchAll(/href=\"\/([^\/\"]+)\/([^\/\"]+)\"/g)];
        for (const match of hrefMatches) {
          const vendor = match[1];
          const name = match[2];
          if (!blacklist.includes(vendor) && !blacklist.includes(name)) {
            const fullId = `${vendor}/${name}`;
            if (!modelMap.has(fullId)) {
              const formattedName = name
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              modelMap.set(fullId, {
                id: fullId,
                name: `${vendor}/${formattedName}`,
                contextWindow: 128000,
                modalities: ["text", "code"] as Modality[],
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to scrape NVIDIA catalog page ${pageUrl}:`, err);
    }
  }

  return Array.from(modelMap.values());
}

async function fetchHuggingFace(apiKey?: string, baseUrl = "https://huggingface.co/api/models"): Promise<RawModel[]> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };
  if (apiKey && apiKey !== "public") headers["Authorization"] = `Bearer ${apiKey}`;
  const cleanBase = baseUrl.includes("?") ? baseUrl : `${baseUrl}?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=25`;
  const res = await fetch(cleanBase, { headers });
  if (!res.ok) throw new Error(`HuggingFace returned ${res.status}`);
  const data = await res.json();

  interface HFModelRaw {
    id: string;
  }

  return ((data as HFModelRaw[]) || []).map((m) => ({
    id: m.id,
    name: m.id,
    contextWindow: 32768,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchOllama(baseUrl = "http://localhost:11434"): Promise<RawModel[]> {
  const cleanBase = baseUrl.replace(/\/v1\/?$/, "").replace(/\/+$/, "");
  const res = await fetch(`${cleanBase}/api/tags`);
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const data = await res.json();

  interface OllamaModelRaw {
    name: string;
  }

  return ((data.models as OllamaModelRaw[]) || []).map((m) => ({
    id: m.name,
    name: m.name,
    contextWindow: 32768,
    modalities: ["text", "code"] as Modality[],
  }));
}

async function fetchOpenAI(apiKey: string, baseUrl = "https://api.openai.com/v1"): Promise<RawModel[]> {
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
  const data = await res.json();

  interface OpenAIModelRaw {
    id: string;
  }

  const models = ((data.data as OpenAIModelRaw[]) || []).filter(
    (m) =>
      m.id.startsWith("gpt-") ||
      m.id.startsWith("o1") ||
      m.id.startsWith("o3") ||
      m.id.startsWith("chatgpt")
  );

  return models.map((m) => {
    let contextWindow = 128000;
    if (m.id.includes("3.5-turbo")) contextWindow = 16385;
    else if (m.id.includes("gpt-4o")) contextWindow = 128000;
    else if (m.id.includes("o1") || m.id.includes("o3")) contextWindow = 200000;
    else if (m.id.includes("gpt-5")) contextWindow = 256000;

    const modalities: Modality[] = ["text", "code"];
    if (m.id.includes("4o") || m.id.includes("gpt-5") || m.id.includes("vision")) {
      modalities.push("image", "audio");
    }

    return {
      id: m.id,
      name: m.id,
      contextWindow,
      maxOutputTokens: 16384,
      modalities,
    };
  });
}

async function fetchAnthropic(apiKey?: string, docsUrl = "https://platform.claude.com/docs/en/about-claude/pricing"): Promise<RawModel[]> {
  try {
    const res = await fetch(docsUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const modelRegex = /Claude\s+(Fable|Mythos|Opus|Sonnet|Haiku)\s+([0-9\.]+)/gi;
    let match: RegExpExecArray | null;
    const map = new Map<string, RawModel & { status?: string; lastError?: string }>();

    while ((match = modelRegex.exec(html)) !== null) {
      const name = match[0].trim();
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const start = Math.max(0, match.index - 50);
      const end = Math.min(html.length, match.index + 200);
      const snippet = html.substring(start, end);

      const isDeprecated = snippet.toLowerCase().includes("deprecated");
      const isRetired = snippet.toLowerCase().includes("retired");
      const isOffline = isDeprecated || isRetired;

      const existing = map.get(slug);
      if (!existing || isOffline) {
        map.set(slug, {
          id: slug,
          name: name,
          contextWindow: 1000000,
          maxOutputTokens: name.includes("Haiku") ? 8192 : 16384,
          modalities: name.includes("Opus") || name.includes("Mythos")
            ? (["text", "code", "image", "pdf", "reasoning"] as Modality[])
            : (["text", "code", "image", "pdf"] as Modality[]),
          status: isOffline ? "offline" : "online",
          lastError: isDeprecated ? "Deprecated model" : isRetired ? "Retired model" : undefined,
        });
      }
    }

    if (map.size > 0) {
      return Array.from(map.values());
    }
  } catch (err) {
    console.warn("Failed to scrape Anthropic pricing page, using fallback seeds:", err);
  }

  // Fallback seed list
  return [
    { id: "claude-fable-5", name: "Claude Fable 5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-mythos-5", name: "Claude Mythos 5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf", "reasoning"] as Modality[] },
    { id: "claude-opus-5", name: "Claude Opus 5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf", "reasoning"] as Modality[] },
    { id: "claude-opus-4.8", name: "Claude Opus 4.8", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf", "reasoning"] as Modality[] },
    { id: "claude-opus-4.7", name: "Claude Opus 4.7", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf", "reasoning"] as Modality[] },
    { id: "claude-opus-4.6", name: "Claude Opus 4.6", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-opus-4.5", name: "Claude Opus 4.5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", contextWindow: 1000000, maxOutputTokens: 16384, modalities: ["text", "code", "image", "pdf"] as Modality[] },
    { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", contextWindow: 1000000, maxOutputTokens: 8192, modalities: ["text", "code", "image"] as Modality[] },
  ];
}

async function fetchKimi(apiKey: string, baseUrl = "https://api.moonshot.ai/v1"): Promise<RawModel[]> {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const endpoints = [`${cleanBase}/models`, "https://api.moonshot.cn/v1/models"];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        interface KimiModelRaw {
          id: string;
          context_length?: number;
          supports_image_in?: boolean;
          supports_video_in?: boolean;
          supports_reasoning?: boolean;
        }
        return ((data.data as KimiModelRaw[]) || []).map((m) => {
          const modalities: Modality[] = ["text", "code"];
          if (m.supports_image_in) modalities.push("image");
          if (m.supports_video_in) modalities.push("video");
          if (m.supports_reasoning) modalities.push("reasoning");

          return {
            id: m.id,
            name: m.id,
            contextWindow: m.context_length || 262144,
            maxOutputTokens: 16384,
            modalities,
          };
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch Kimi models from ${url}:`, err);
    }
  }

  return [
    { id: "moonshot-v1-8k", name: "Moonshot Kimi v1 8K", contextWindow: 8192, modalities: ["text", "code"] as Modality[] },
    { id: "moonshot-v1-32k", name: "Moonshot Kimi v1 32K", contextWindow: 32768, modalities: ["text", "code"] as Modality[] },
    { id: "moonshot-v1-128k", name: "Moonshot Kimi v1 128K", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "kimi-k1.5", name: "Kimi k1.5 Reasoning", contextWindow: 128000, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "kimi-k2.5", name: "Kimi k2.5 Multimodal", contextWindow: 256000, modalities: ["text", "code", "image", "reasoning"] as Modality[] },
    { id: "kimi-k2.6", name: "Kimi k2.6", contextWindow: 256000, modalities: ["text", "code", "image", "reasoning"] as Modality[] },
    { id: "kimi-k2.7-code", name: "Kimi k2.7 Code", contextWindow: 262144, modalities: ["text", "code", "image", "video", "reasoning"] as Modality[] },
    { id: "kimi-k3", name: "Kimi K3 Flagship Reasoning", contextWindow: 524288, modalities: ["text", "code", "image", "video", "reasoning"] as Modality[] },
  ];
}

async function fetchDeepSeek(apiKey?: string, docsUrl = "https://api-docs.deepseek.com/quick_start/pricing/"): Promise<RawModel[]> {
  try {
    const res = await fetch(docsUrl);
    if (res.ok) {
      const html = await res.text();
      const matches = [...html.matchAll(/deepseek-v4-[a-z0-9-]+/gi)].map((m) => m[0].toLowerCase());
      const uniqueIds = [...new Set(matches)];

      if (uniqueIds.length > 0) {
        return uniqueIds.map((id) => ({
          id,
          name: id === "deepseek-v4-flash" ? "DeepSeek V4 Flash" : id === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : id,
          contextWindow: 1000000,
          maxOutputTokens: 393216,
          modalities: ["text", "code", "reasoning"] as Modality[],
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to scrape DeepSeek docs pricing page, using catalog seeds:", err);
  }

  return [
    { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", contextWindow: 1000000, maxOutputTokens: 393216, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", contextWindow: 1000000, maxOutputTokens: 393216, modalities: ["text", "code", "reasoning"] as Modality[] },
  ];
}

async function fetchZhipu(apiKey?: string, docsUrl = "https://docs.z.ai/guides/overview/pricing"): Promise<RawModel[]> {
  try {
    const res = await fetch(docsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (res.ok) {
      const html = await res.text();
      const matches = [...html.matchAll(/glm-[a-z0-9\.-]+/gi)].map((m) => m[0].toLowerCase());
      const uniqueIds = [...new Set(matches)].filter((id) => !["glm-new", "glm-image", "glm-ocr"].includes(id));

      if (uniqueIds.length > 0) {
        return uniqueIds.map((id) => {
          const isVision = id.includes("v");
          const is52 = id.includes("5.2");
          const modalities: Modality[] = isVision
            ? ["text", "code", "image", "reasoning"]
            : ["text", "code", "reasoning"];

          return {
            id,
            name: id.toUpperCase().replace("-", " "),
            contextWindow: is52 ? 256000 : 128000,
            maxOutputTokens: 16384,
            modalities,
          };
        });
      }
    }
  } catch (err) {
    console.warn("Failed to scrape Zhipu Z.AI pricing page, using catalog seeds:", err);
  }

  return [
    { id: "glm-5.2", name: "GLM 5.2 Flagship", contextWindow: 256000, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "glm-5.1", name: "GLM 5.1", contextWindow: 128000, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "glm-5-turbo", name: "GLM 5 Turbo", contextWindow: 128000, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "glm-4.7", name: "GLM 4.7", contextWindow: 128000, modalities: ["text", "code", "reasoning"] as Modality[] },
    { id: "glm-4.7-flash", name: "GLM 4.7 Flash (Free)", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "glm-4.7-flashx", name: "GLM 4.7 FlashX", contextWindow: 128000, modalities: ["text", "code"] as Modality[] },
    { id: "glm-5v-turbo", name: "GLM 5V Turbo (Vision)", contextWindow: 128000, modalities: ["text", "code", "image", "reasoning"] as Modality[] },
    { id: "glm-4.6v", name: "GLM 4.6V (Vision)", contextWindow: 128000, modalities: ["text", "code", "image"] as Modality[] },
    { id: "glm-4.6v-flash", name: "GLM 4.6V Flash (Free Vision)", contextWindow: 128000, modalities: ["text", "code", "image"] as Modality[] },
  ];
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
    openrouter: process.env.OPENROUTER_API_KEY || "public",
    mistral: process.env.MISTRAL_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
    gemini: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    github: process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY || "public",
    nvidia: process.env.NVIDIA_API_KEY || "public",
    huggingface: process.env.HUGGINGFACE_API_KEY || "public",
    ollama: "public",
    openai: process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY || "public",
    kimi: process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY || "public",
    zhipu: process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || "public",
  };

  for (const provider of providers) {
    const apiKey = (configKeys as Record<string, string | undefined>)[provider.id];

    console.log(`Syncing models for '${provider.name}'... (URL: ${provider.baseUrl || provider.docsUrl})`);
    try {
      let rawModels: RawModel[] = [];
      if (provider.id === "groq") rawModels = await fetchGroq(apiKey || "public", provider.baseUrl);
      else if (provider.id === "openrouter") rawModels = await fetchOpenRouter(apiKey, provider.baseUrl);
      else if (provider.id === "mistral") rawModels = await fetchMistral(apiKey || "public", provider.baseUrl);
      else if (provider.id === "cohere") rawModels = await fetchCohere(apiKey || "public", provider.baseUrl);
      else if (provider.id === "cerebras") rawModels = await fetchCerebras(apiKey || "public", provider.baseUrl);
      else if (provider.id === "gemini") rawModels = await fetchGemini(apiKey || "public", provider.baseUrl);
      else if (provider.id === "github") rawModels = await fetchGitHub(apiKey === "public" ? undefined : apiKey, provider.baseUrl);
      else if (provider.id === "nvidia") rawModels = await fetchNvidia(apiKey === "public" ? undefined : apiKey, provider.baseUrl);
      else if (provider.id === "huggingface") rawModels = await fetchHuggingFace(apiKey === "public" ? undefined : apiKey, provider.baseUrl);
      else if (provider.id === "ollama") rawModels = await fetchOllama(provider.baseUrl);
      else if (provider.id === "openai") rawModels = await fetchOpenAI(apiKey || "public", provider.baseUrl);
      else if (provider.id === "anthropic") rawModels = await fetchAnthropic(apiKey, provider.docsUrl);
      else if (provider.id === "kimi") rawModels = await fetchKimi(apiKey || "public", provider.baseUrl);
      else if (provider.id === "deepseek") rawModels = await fetchDeepSeek(apiKey === "public" ? undefined : apiKey, provider.docsUrl);
      else if (provider.id === "zhipu") rawModels = await fetchZhipu(apiKey === "public" ? undefined : apiKey, provider.docsUrl);

      console.log(`Found ${rawModels.length} models for ${provider.name}. Merging...`);

      for (const raw of rawModels) {
        const uniqueId = `${provider.id}/${raw.id}`;
        const existingIdx = updatedModels.findIndex((m) => m.id === uniqueId);
        const rawStatus = (raw as any).status as string | undefined;
        const rawLastError = (raw as any).lastError as string | undefined;
        const isOffline = rawStatus === "offline";

        const newModel: Model = {
          id: uniqueId,
          providerId: provider.id,
          name: raw.name || raw.id,
          modelId: raw.id,
          contextWindow: raw.contextWindow || 8192,
          maxOutputTokens: raw.maxOutputTokens || 4096,
          modalities: raw.modalities || ["text", "code"],
          status: isOffline ? "offline" : "online",
          verified: !isOffline,
          freeTier: provider.tierType !== "credits" || !provider.creditCardRequired,
          noCreditCard: !provider.creditCardRequired,
          score: 50,
          releasedAt: new Date().toISOString().split("T")[0],
          lastVerifiedAt: new Date().toISOString(),
          lastError: rawLastError,
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

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to sync models for provider '${provider.name}':`, errMsg);
    }
  }

  // Recalculate per-provider counts & lastSyncedAt
  for (const provider of providers) {
    const providerModels = updatedModels.filter((m) => m.providerId === provider.id);
    if (providerModels.length > 0) {
      provider.freeModelCount = providerModels.filter((m) => m.freeTier).length;
      provider.onlineModelCount = providerModels.filter((m) => m.status === "online").length;
      provider.lastSyncedAt = new Date().toISOString();
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

