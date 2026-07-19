"use client";

import { useState } from "react";
import { Copy, Check, Server, Shield, HelpCircle, Terminal } from "lucide-react";

export default function GatewayPage() {
  const [copied, setCopied] = useState(false);

  const gatewayScript = `/**
 * AgentRadar Failover Gateway Proxy Server
 * 
 * Runs a local server (http://localhost:8080) conforming to OpenAI Schema.
 * Automatically rotates and falls back to alternate free providers/models
 * if a request is rate-limited (HTTP 429) or fails.
 * 
 * Usage:
 *   1. Save this script as 'gateway.mjs'
 *   2. Set environment keys:
 *        export GROQ_API_KEY="your-groq-key"
 *        export OPENROUTER_API_KEY="your-openrouter-key"
 *        export GEMINI_API_KEY="your-gemini-key"
 *   3. Run with Node:
 *        node gateway.mjs
 *   4. Point your codebase base URL to: http://localhost:8080/v1
 */

import http from 'http';

const PORT = 8080;

// Configured fallback models pool in priority order
const getModelPool = () => [
  {
    name: "Groq Llama-3.3-70b",
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile"
  },
  {
    name: "OpenRouter Llama-3.3-70b (Free)",
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.3-70b-instruct:free",
    headers: {
      "HTTP-Referer": "https://zerollm.vercel.app",
      "X-Title": "AgentRadar Gateway"
    }
  },
  {
    name: "Gemini 1.5 Flash (Google)",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-1.5-flash"
  }
].filter(p => !!p.apiKey); // Only include providers with active environment keys

const server = http.createServer(async (req, res) => {
  // Add basic CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only intercept Chat Completions
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const pool = getModelPool();

        if (pool.length === 0) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Gateway Error: No API keys configured in environment variables." }));
          return;
        }

        // Attempt providers in order of fallback
        for (let i = 0; i < pool.length; i++) {
          const provider = pool[i];
          console.log(\`[Gateway] Attempting request using \${provider.name} (\${provider.model})...\`);

          try {
            const reqHeaders = {
              "Content-Type": "application/json",
              "Authorization": \`Bearer \${provider.apiKey}\`,
              ...(provider.headers || {})
            };

            const response = await fetch(provider.url, {
              method: "POST",
              headers: reqHeaders,
              body: JSON.stringify({
                model: provider.model,
                messages: payload.messages,
                stream: !!payload.stream,
                temperature: payload.temperature
              })
            });

            // If rate limited or service unavailable, try the next provider in the pool
            if (response.status === 429 || response.status >= 500) {
              console.warn(\`[Gateway] \${provider.name} returned HTTP \${response.status}. Falling back to next...\`);
              continue;
            }

            // Pipe direct headers
            res.writeHead(response.status, {
              "Content-Type": response.headers.get("content-type") || "application/json",
              ...(payload.stream ? { "Cache-Control": "no-cache", "Connection": "keep-alive" } : {})
            });

            if (payload.stream) {
              // Stream translation
              const reader = response.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            } else {
              const resData = await response.text();
              res.end(resData);
            }
            return; // Successfully resolved request
          } catch (err) {
            console.error(\`[Gateway] Connection error for \${provider.name}: \${err.message}. Falling back...\`);
          }
        }

        // All providers failed
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Gateway Failover Error: All fallback providers in the pool failed." }));

      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body: " + err.message }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found. Connect to POST /v1/chat/completions" }));
  }
});

server.listen(PORT, () => {
  console.log(\`[AgentRadar Gateway] Local failover gateway running at http://localhost:\${PORT}\`);
  console.log(\`[AgentRadar Gateway] Configured API keys count: \${getModelPool().length}\`);
});
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gatewayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header Title */}
      <div className="border-b border-border pb-6 space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
          <Server className="h-4 w-4" />
          High-Availability Routing
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          AgentRadar Failover Gateway
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Get around low rate limits. Spin up a lightweight local server that automatically redirects traffic to alternate free providers when rate-limiting limits occur.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
          <div className="text-primary font-bold text-xs flex items-center gap-1.5 uppercase">
            <Server className="h-4 w-4" />
            Unified Endpoint
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exposes a single OpenAI-compliant endpoint at <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">http://localhost:8080/v1</code>. No code changes needed to switch models.
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
          <div className="text-green-600 dark:text-green-400 font-bold text-xs flex items-center gap-1.5 uppercase">
            <Shield className="h-4 w-4" />
            Automatic Failover
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If Groq returns a rate limit error (HTTP 429), the gateway automatically falls back to OpenRouter or Gemini in milliseconds without crashing your app.
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
          <div className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 uppercase">
            <Terminal className="h-4 w-4" />
            Zero-Dependency
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Uses native Node.js HTTP/fetch libraries. You do not need to run npm install or configure external routers. Just launch with Node.
          </p>
        </div>
      </div>

      {/* Code script card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Code header */}
        <div className="flex justify-between items-center bg-slate-950 px-5 py-3 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-mono">
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            gateway.mjs
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Script
              </>
            )}
          </button>
        </div>

        {/* Code display */}
        <pre className="p-5 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
          <code>{gatewayScript}</code>
        </pre>
      </div>

      {/* Step Guide */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-border p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-primary" />
          Setup Walkthrough
        </h3>
        <ol className="text-xs text-muted-foreground space-y-3 list-decimal pl-5">
          <li>
            Copy the script above and save it to your local machine as <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono">gateway.mjs</code>.
          </li>
          <li>
            Export your API Keys as environment variables. The gateway will dynamically filter and skip providers that have no active keys configured:
            <pre className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-lg font-mono text-[10px] mt-1.5 space-y-0.5 overflow-x-auto">
              <div>{"export GROQ_API_KEY=\"your_groq_api_key\""}</div>
              <div>{"export GEMINI_API_KEY=\"your_google_gemini_key\""}</div>
              <div>{"export OPENROUTER_API_KEY=\"your_openrouter_key\""}</div>
            </pre>
          </li>
          <li>
            Launch the proxy server:
            <pre className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg font-mono text-[10px] mt-1.5 inline-block">
              node gateway.mjs
            </pre>
          </li>
          <li>
            In your code client SDK (e.g. OpenAI library, Cursor, or Claude Code), point your client base URL endpoint to:
            <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded font-mono ml-1">http://localhost:8080/v1</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}
