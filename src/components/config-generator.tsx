"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Model, Provider } from "@/lib/types";
import { configTemplates } from "@/lib/config-templates";
import { Settings, Copy, Check, ExternalLink } from "lucide-react";

interface ConfigGeneratorProps {
  models: Model[];
  providers: Provider[];
}

export default function ConfigGenerator({ models, providers }: ConfigGeneratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTool, setSelectedTool] = useState<string>("cursor");
  const [copied, setCopied] = useState(false);

  // Derive selectedModelId directly from searchParams
  const selectedModelId = useMemo(() => {
    const modelParam = searchParams.get("model");
    if (modelParam && models.some((m) => m.id === modelParam)) {
      return modelParam;
    }
    if (models.length > 0) {
      const topModel = [...models].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      return topModel.id;
    }
    return "";
  }, [searchParams, models]);

  // Update URL parameter when model changes
  const handleModelChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("model", id);
    router.replace(`?${params.toString()}`);
  };

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId);
  }, [selectedModelId, models]);

  const selectedProvider = useMemo(() => {
    if (!selectedModel) return undefined;
    return providers.find((p) => p.id === selectedModel.providerId);
  }, [selectedModel, providers]);

  const template = useMemo(() => {
    return configTemplates[selectedTool];
  }, [selectedTool]);

  const generated = useMemo(() => {
    if (!selectedModel || !selectedProvider || !template) return null;
    return template.generate(selectedProvider, selectedModel);
  }, [selectedModel, selectedProvider, template]);

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel - model and tool selection */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-lg font-bold">Generator Settings</h2>

          {/* Tool Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Coding Tool
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(configTemplates).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTool(t.id)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    selectedTool === t.id
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Free LLM Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            >
              {providers.map((p) => {
                const providerModels = models.filter((m) => m.providerId === p.id);
                if (providerModels.length === 0) return null;
                return (
                  <optgroup key={p.id} label={p.name}>
                    {providerModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.modelId})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Provider stats display */}
          {selectedProvider && selectedModel && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-border/50 text-xs space-y-3.5 pt-4">
              <h3 className="font-bold border-b border-border/50 pb-2">Active Model Settings</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold">{selectedProvider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Endpoint:</span>
                <span className="font-mono text-[10px] break-all select-all font-semibold max-w-[150px] text-right">
                  {selectedProvider.baseUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model Name:</span>
                <span className="font-mono text-[10px] select-all font-semibold text-right max-w-[150px] break-all">
                  {selectedModel.modelId}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground">API key console:</span>
                <a
                  href={selectedProvider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  Go to console <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel - config result display */}
      <div className="lg:col-span-2 space-y-6">
        {generated ? (
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-1.5 text-foreground">
                <Settings className="h-5 w-5 text-primary" />
                Configuration for {template?.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{template?.description}</p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Step-by-Step Setup
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-border/50 text-sm whitespace-pre-line leading-relaxed">
                {generated.instructions}
              </div>
            </div>

            {/* Generated Code Codeblock */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Configuration Snippet {generated.filename && `(${generated.filename})`}
                </h3>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <pre className="bg-slate-950 text-slate-200 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-normal">
                  <code>{generated.code}</code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground">Generating configuration...</span>
          </div>
        )}
      </div>
    </div>
  );
}
