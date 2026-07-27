import { NextRequest, NextResponse } from "next/server";
import { getProviders } from "@/lib/data";
import { ChatMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { providerId, modelId, apiKey, messages, stream } = await req.json();

    if (!providerId || !modelId || !apiKey || !messages) {
      return NextResponse.json(
        { error: "Missing required parameters: providerId, modelId, apiKey, messages" },
        { status: 400 }
      );
    }

    const providers = await getProviders();
    const provider = providers.find((p) => p.id === providerId);

    if (!provider) {
      return NextResponse.json(
        { error: `Provider '${providerId}' not found in database` },
        { status: 404 }
      );
    }

    // Determine target URL and headers based on provider
    let targetUrl = `${provider.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Routing and header configurations per provider type
    if (providerId === "openai") {
      targetUrl = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (providerId === "deepseek") {
      targetUrl = "https://api.deepseek.com/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (providerId === "kimi") {
      targetUrl = "https://api.moonshot.ai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (providerId === "nvidia") {
      targetUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["Accept"] = stream ? "text/event-stream" : "application/json";
    } else if (providerId === "gemini") {
      // Gemini OpenAI-compatible path
      targetUrl = `${provider.baseUrl}/v1beta/openai/chat/completions`;
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (providerId === "huggingface") {
      // Hugging Face OpenAI-compatible path
      targetUrl = `https://api-inference.huggingface.co/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (providerId === "openrouter") {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://zerollm.vercel.app";
      headers["X-Title"] = "AgentRadar";
    } else if (providerId === "anthropic") {
      targetUrl = "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      // Default fallback header mapping for other seeded free providers
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Anthropic API requires messages role/system translation
    if (providerId === "anthropic") {
      const msgList = messages as ChatMessage[];
      const systemMessage = msgList.find((m) => m.role === "system");
      const userMessages = msgList.filter((m) => m.role !== "system");

      const payload: Record<string, unknown> = {
        model: modelId,
        messages: userMessages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        max_tokens: 4096,
        stream: !!stream,
      };

      if (systemMessage) {
        payload.system = systemMessage.content;
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = null;
        }
        return NextResponse.json(
          {
            error: errorJson?.error?.message || errorJson?.error || errorText || "Anthropic API error",
            status: response.status,
          },
          { status: response.status }
        );
      }

      if (stream) {
        const streamResponse = new ReadableStream({
          async start(controller) {
            if (!response.body) {
              controller.close();
              return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;

                  try {
                    const jsonStr = trimmed.slice(5).trim();
                    if (jsonStr === "[DONE]") continue;

                    const parsed = JSON.parse(jsonStr);
                    if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                      const openaiChunk = {
                        choices: [
                          {
                            delta: {
                              content: parsed.delta.text,
                            },
                          },
                        ],
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                    }
                  } catch {
                    // Ignore parsing issues for partial JSON blocks
                  }
                }
              }
            } catch (e) {
              console.error("Anthropic streaming error in proxy:", e);
              controller.error(e);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(streamResponse, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Non-streaming response translation
      const data = await response.json();
      const translated = {
        id: data.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: data.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: data.content?.[0]?.text || "",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
      return NextResponse.json(translated);
    }

    // Default OpenAI-compatible payload & streaming proxy forwarder
    const payload = {
      model: modelId,
      messages: messages,
      stream: !!stream,
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = null;
      }
      return NextResponse.json(
        {
          error: errorJson?.error?.message || errorJson?.error || errorText || "Provider API error",
          status: response.status,
        },
        { status: response.status }
      );
    }

    // If streaming, pipe the response directly to the client
    if (stream) {
      const streamResponse = new ReadableStream({
        async start(controller) {
          if (!response.body) {
            controller.close();
            return;
          }
          const reader = response.body.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error("Streaming error in proxy:", e);
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Chat proxy handler error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
