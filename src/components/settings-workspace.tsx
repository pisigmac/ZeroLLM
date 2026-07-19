"use client";

import { useState, useEffect, useMemo } from "react";
import { Provider } from "@/lib/types";
import { Key, ShieldCheck, RefreshCw, ExternalLink, ShieldAlert, Check, Eye, EyeOff } from "lucide-react";

interface SettingsWorkspaceProps {
  providers: Provider[];
}

interface KeyVerifyStatus {
  status: "idle" | "checking" | "valid" | "invalid";
  error?: string;
}

export default function SettingsWorkspace({ providers }: SettingsWorkspaceProps) {
  // Local keys state
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, KeyVerifyStatus>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Filter providers that require API keys
  const keyProviders = useMemo(() => {
    return providers.filter(p => p.id !== "ollama"); // Ollama runs locally, no key needed
  }, [providers]);

  // Load keys from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedKeys: Record<string, string> = {};
      const initialStatuses: Record<string, KeyVerifyStatus> = {};
      
      keyProviders.forEach(p => {
        const val = localStorage.getItem(`apikey_${p.id}`) || "";
        loadedKeys[p.id] = val;
        initialStatuses[p.id] = { status: "idle" };
      });
      
      setKeys(loadedKeys);
      setStatuses(initialStatuses);
    }, 0);
    return () => clearTimeout(timer);
  }, [keyProviders]);

  const handleKeyChange = (providerId: string, val: string) => {
    setKeys(prev => ({ ...prev, [providerId]: val }));
    localStorage.setItem(`apikey_${providerId}`, val);
    setStatuses(prev => ({ ...prev, [providerId]: { status: "idle" } }));
  };

  const handleToggleShow = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const verifyKey = async (providerId: string, keyVal: string) => {
    if (!keyVal.trim()) return;

    setStatuses(prev => ({ ...prev, [providerId]: { status: "checking" } }));

    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey: keyVal.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setStatuses(prev => ({ ...prev, [providerId]: { status: "valid" } }));
      } else {
        setStatuses(prev => ({ ...prev, [providerId]: { status: "invalid", error: data.error || "Invalid key format" } }));
      }
    } catch (err: unknown) {
      setStatuses(prev => ({
        ...prev,
        [providerId]: {
          status: "invalid",
          error: err instanceof Error ? err.message : "Connection failed"
        }
      }));
    }
  };

  const handleVerifyAll = async () => {
    const promises = Object.entries(keys).map(([pId, keyVal]) => {
      if (keyVal.trim()) {
        return verifyKey(pId, keyVal);
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <Key className="h-4 w-4" />
            Secrets Manager
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            API Keys Vault
          </h1>
          <p className="text-muted-foreground text-sm">
            Securely configure, save, and check authorization credentials for all integrated LLM models.
          </p>
        </div>
        <div>
          <button
            onClick={handleVerifyAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Verify All Keys
          </button>
        </div>
      </div>

      {/* Security callout banner */}
      <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs flex gap-3 leading-relaxed">
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="font-bold">100% Client-Side Privacy Policy</p>
          <p className="mt-1 opacity-90">
            Your credentials are saved exclusively inside your browser&apos;s localStorage cache. They never leave your local machine or touch any server databases. Requests are securely forwarded through a local Next.js proxy route to prevent CORS API connection blocks.
          </p>
        </div>
      </div>

      {/* Keys List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
        {keyProviders.map(p => {
          const keyVal = keys[p.id] || "";
          const status = statuses[p.id] || { status: "idle" };
          const showKey = showKeys[p.id] || false;

          return (
            <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
              {/* Provider Info */}
              <div className="md:w-1/4 space-y-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-50">{p.name}</span>
                  {p.tierType === "permanent" && (
                    <span className="text-[9px] bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full border border-green-500/10">
                      Free Tier
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                  <span>ID: {p.id}</span>
                  <span>•</span>
                  <a
                    href={p.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-0.5"
                  >
                    Console <ExternalLink className="h-2 w-2" />
                  </a>
                </div>
              </div>

              {/* Key Input Field */}
              <div className="flex-1 max-w-md relative flex items-center">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder={
                    keyVal ? "••••••••••••••••••••••••••••••••" : `Enter your ${p.name} API key...`
                  }
                  value={keyVal}
                  onChange={(e) => handleKeyChange(p.id, e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => handleToggleShow(p.id)}
                  type="button"
                  className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  title={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Verify button & Status Badge */}
              <div className="md:w-1/4 flex items-center justify-end gap-3 shrink-0">
                {/* Status indicator */}
                {status.status === "checking" && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg flex items-center gap-1 font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Checking
                  </span>
                )}
                {status.status === "valid" && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono border border-green-500/10 animate-fade-in">
                    <Check className="h-3 w-3 text-green-600" />
                    Authorized
                  </span>
                )}
                {status.status === "invalid" && (
                  <span
                    className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono border border-rose-500/10 cursor-help"
                    title={status.error || "Failed check"}
                  >
                    <ShieldAlert className="h-3 w-3 text-rose-600" />
                    Unauthorized
                  </span>
                )}
                {status.status === "idle" && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                    Unchecked
                  </span>
                )}

                <button
                  onClick={() => verifyKey(p.id, keyVal)}
                  disabled={status.status === "checking" || !keyVal.trim()}
                  className="px-3 py-1.5 rounded-xl border border-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Verify
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
