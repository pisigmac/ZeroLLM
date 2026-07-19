import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { providerId, apiKey } = await req.json();

    if (!providerId || !apiKey) {
      return NextResponse.json(
        { valid: false, error: "Missing providerId or apiKey" },
        { status: 400 }
      );
    }

    let url = "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let method = "GET";
    let body: string | undefined = undefined;

    switch (providerId) {
      case "openai":
        url = "https://api.openai.com/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "groq":
        url = "https://api.groq.com/openai/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "deepseek":
        url = "https://api.deepseek.com/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "kimi":
        url = "https://api.moonshot.cn/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "zhipu":
        url = "https://open.bigmodel.cn/api/paas/v4/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "gemini":
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        break;
      case "openrouter":
        url = "https://openrouter.ai/api/v1/auth/key";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "mistral":
        url = "https://api.mistral.ai/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "huggingface":
        url = "https://huggingface.co/api/whoami-v2";
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "anthropic":
        url = "https://api.anthropic.com/v1/messages";
        method = "POST";
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        body = JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        });
        break;
      default:
        // Generic fallback check
        url = `https://api.openai.com/v1/models`; // Assume standard headers
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ valid: false, error: "Invalid API Key" });
    }

    // Anthropic returns 400 for bad parameters, but if key is invalid it returns 401/403.
    // If it returns 200 or 400, the key itself is authorized.
    if (providerId === "anthropic" && response.status === 400) {
      return NextResponse.json({ valid: true });
    }

    if (response.ok) {
      return NextResponse.json({ valid: true });
    }

    const errorMsg = await response.text();
    return NextResponse.json({ valid: false, error: errorMsg || `HTTP ${response.status}` });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Network error";
    return NextResponse.json({ valid: false, error: errMsg }, { status: 500 });
  }
}
