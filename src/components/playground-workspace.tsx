"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Model, Provider, ChatMessage } from "@/lib/types";
import {
  Send,
  Trash2,
  Key,
  Terminal,
  AlertTriangle,
  Cpu,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  GitCompare,
  DollarSign,
  History,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { estimateTokens, addSavingsLog } from "@/lib/savings";

interface PlaygroundWorkspaceProps {
  models: Model[];
  providers: Provider[];
}

interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  systemPrompt: string;
  timestamp: string;
}

export default function PlaygroundWorkspace({ models, providers }: PlaygroundWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Collapsible History Sidebar state
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  // 1. Derive selectedModelId directly from URL query parameters or default to first online
  const selectedTier = useMemo(() => {
    const tierParam = searchParams.get("tier");
    return tierParam === "paid" ? "paid" : "free";
  }, [searchParams]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => (selectedTier === "paid" ? !m.freeTier : m.freeTier));
  }, [models, selectedTier]);

  const selectedModelId = useMemo(() => {
    const modelParam = searchParams.get("model");
    if (modelParam && filteredModels.some((m) => m.id === modelParam)) {
      return modelParam;
    }
    const firstOnline = filteredModels.find((m) => m.status === "online");
    return firstOnline ? firstOnline.id : (filteredModels[0]?.id || "");
  }, [searchParams, filteredModels]);

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId);
  }, [selectedModelId, models]);

  const selectedProvider = useMemo(() => {
    if (!selectedModel) return undefined;
    return providers.find((p) => p.id === selectedModel.providerId);
  }, [selectedModel, providers]);

  // 2. Track custom API keys entered during this session
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const getApiKeyForProvider = useCallback((pId: string) => {
    if (apiKeys[pId] !== undefined) {
      return apiKeys[pId];
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem(`apikey_${pId}`) || "";
    }
    return "";
  }, [apiKeys]);

  const apiKey = useMemo(() => {
    if (!selectedProvider) return "";
    return getApiKeyForProvider(selectedProvider.id);
  }, [selectedProvider, getApiKeyForProvider]);

  const handleApiKeyChange = (val: string) => {
    if (selectedProvider) {
      setApiKeys((prev) => ({ ...prev, [selectedProvider.id]: val }));
      localStorage.setItem(`apikey_${selectedProvider.id}`, val);
      setKeyStatus("idle");
      setKeyError("");
    }
  };

  // 3. Smart API Key Health Checker
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [keyError, setKeyError] = useState("");

  const handleVerifyKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;
    setKeyStatus("checking");
    setKeyError("");
    try {
      const response = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          apiKey: apiKey.trim(),
        }),
      });
      const data = await response.json();
      if (data.valid) {
        setKeyStatus("valid");
      } else {
        setKeyStatus("invalid");
        setKeyError(data.error || "Verification failed");
      }
    } catch (err: unknown) {
      setKeyStatus("invalid");
      setKeyError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  // 4. View Mode: Standard vs Arena
  const [isArenaMode, setIsArenaMode] = useState(false);

  // Arena Models state
  const onlineModels = useMemo(() => models.filter(m => m.status === "online"), [models]);
  const [arenaModelA, setArenaModelA] = useState(() => onlineModels[0]?.id || "");
  const [arenaModelB, setArenaModelB] = useState(() => onlineModels[1]?.id || onlineModels[0]?.id || "");
  const [arenaModelC, setArenaModelC] = useState(() => onlineModels[2]?.id || onlineModels[0]?.id || "");

  // Arena Chat history, loading, and stats state
  const [arenaMessagesA, setArenaMessagesA] = useState<ChatMessage[]>([]);
  const [arenaMessagesB, setArenaMessagesB] = useState<ChatMessage[]>([]);
  const [arenaMessagesC, setArenaMessagesC] = useState<ChatMessage[]>([]);

  const [arenaLoadingA, setArenaLoadingA] = useState(false);
  const [arenaLoadingB, setArenaLoadingB] = useState(false);
  const [arenaLoadingC, setArenaLoadingC] = useState(false);

  const [arenaErrorA, setArenaErrorA] = useState("");
  const [arenaErrorB, setArenaErrorB] = useState("");
  const [arenaErrorC, setArenaErrorC] = useState("");

  interface ArenaPerf {
    latencyMs: number;
    tokensSec: number;
    tokensCount: number;
  }
  const [arenaPerfA, setArenaPerfA] = useState<ArenaPerf | null>(null);
  const [arenaPerfB, setArenaPerfB] = useState<ArenaPerf | null>(null);
  const [arenaPerfC, setArenaPerfC] = useState<ArenaPerf | null>(null);

  // Common parameters
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful coding assistant.");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Standard Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const arenaChatEndRefA = useRef<HTMLDivElement>(null);
  const arenaChatEndRefB = useRef<HTMLDivElement>(null);
  const arenaChatEndRefC = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    if (isArenaMode) {
      arenaChatEndRefA.current?.scrollIntoView({ behavior: "smooth" });
      arenaChatEndRefB.current?.scrollIntoView({ behavior: "smooth" });
      arenaChatEndRefC.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, arenaMessagesA, arenaMessagesB, arenaMessagesC, isLoading, arenaLoadingA, arenaLoadingB, arenaLoadingC, isArenaMode]);

  // Load chat history sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem("zerollm_chat_sessions");
    if (saved) {
      try {
        const parsed: ChatSession[] = JSON.parse(saved);
        const timer = setTimeout(() => {
          setSessions(parsed);
          if (parsed.length > 0) {
            const first = parsed[0];
            setActiveSessionId(first.id);
            setMessages(first.messages);
            setSystemPrompt(first.systemPrompt || "You are a helpful coding assistant.");
            // Update URL params to match first session model
            const params = new URLSearchParams(searchParams.get("tier") ? { tier: searchParams.get("tier")! } : {});
            params.set("model", first.modelId);
            router.replace(`?${params.toString()}`);
          }
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, [router, searchParams]);

  // Save/Persist updated sessions list
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem("zerollm_chat_sessions", JSON.stringify(updated));
  };

  const startNewChat = (modelId: string = selectedModelId) => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: `New Chat (${models.find(m => m.id === modelId)?.name || "Model"})`,
      modelId,
      messages: [],
      systemPrompt: "You are a helpful coding assistant.",
      timestamp: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setSystemPrompt("You are a helpful coding assistant.");
    
    const params = new URLSearchParams(searchParams.get("tier") ? { tier: searchParams.get("tier")! } : {});
    params.set("model", modelId);
    router.replace(`?${params.toString()}`);
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setSystemPrompt(session.systemPrompt || "You are a helpful coding assistant.");
      
      const params = new URLSearchParams(searchParams.get("tier") ? { tier: searchParams.get("tier")! } : {});
      params.set("model", session.modelId);
      router.replace(`?${params.toString()}`);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        switchSession(updated[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
        setSystemPrompt("You are a helpful coding assistant.");
      }
    }
  };

  const handleModelChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("model", id);
    router.replace(`?${params.toString()}`);

    if (activeSessionId && !isArenaMode) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, modelId: id, timestamp: new Date().toISOString() };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  const handleTierChange = (tier: string) => {
    const params = new URLSearchParams();
    params.set("tier", tier);
    router.replace(`?${params.toString()}`);
  };

  const handleSystemPromptChange = (val: string) => {
    setSystemPrompt(val);
    if (activeSessionId && !isArenaMode) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, systemPrompt: val, timestamp: new Date().toISOString() };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError("");
    setArenaMessagesA([]);
    setArenaMessagesB([]);
    setArenaMessagesC([]);
    setArenaPerfA(null);
    setArenaPerfB(null);
    setArenaPerfC(null);
    setArenaErrorA("");
    setArenaErrorB("");
    setArenaErrorC("");

    if (activeSessionId && !isArenaMode) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [], timestamp: new Date().toISOString() };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  // Single Model Send Handler (with Ollama direct fetch client bypass)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedModel || !selectedProvider) return;

    // Direct connection bypass for Local Ollama, otherwise check key vault
    const isOllama = selectedProvider.id === "ollama";
    if (!apiKey.trim() && !isOllama) {
      setError("Please configure and check your API key in the Settings panel.");
      return;
    }

    setError("");
    const userPrompt = input.trim();
    const userMessage: ChatMessage = { role: "user", content: userPrompt };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Save prompt to session history directly
    if (activeSessionId) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: updatedMessages,
            title: updatedMessages[0].content.substring(0, 30) + (updatedMessages[0].content.length > 30 ? "..." : ""),
            timestamp: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSessions(updated);
    }

    try {
      const contextMessages: ChatMessage[] = [];
      if (systemPrompt.trim()) {
        contextMessages.push({ role: "system", content: systemPrompt.trim() });
      }
      contextMessages.push(...updatedMessages);

      const targetUrl = isOllama ? "http://localhost:11434/v1/chat/completions" : "/api/chat";
      const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const fetchBody: Record<string, unknown> = {
        modelId: selectedModel.modelId,
        messages: contextMessages,
        stream: true,
      };

      if (isOllama) {
        fetchBody.model = selectedModel.modelId;
      } else {
        fetchHeaders.Authorization = `Bearer ${apiKey.trim()}`;
        fetchBody.providerId = selectedProvider.id;
        fetchBody.apiKey = apiKey.trim();
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(fetchBody),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch response");
      }

      if (!response.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content || "";
              if (content) {
                assistantText += content;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: assistantText };
                  return copy;
                });
              }
            } catch {
              // Ignore partial chunks split
            }
          }
        }
      }

      // Sync final response to session history
      if (activeSessionId) {
        const finalMessages: ChatMessage[] = [...updatedMessages, { role: "assistant", content: assistantText }];
        const updated = sessions.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: finalMessages,
              timestamp: new Date().toISOString(),
            };
          }
          return s;
        });
        saveSessions(updated);
      }

      // Log stats to Savings Dashboard
      addSavingsLog(
        selectedModel.id,
        selectedProvider.id,
        userPrompt,
        assistantText,
        selectedModel.freeTier
      );

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred during communication.");
    } finally {
      setIsLoading(false);
    }
  };

  // Arena Model parallel fetch handler (with Ollama direct fetch client bypass)
  const sendArenaQuery = async (
    index: "A" | "B" | "C",
    modelId: string,
    userPrompt: string,
    setMessagesState: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
    setErrorState: React.Dispatch<React.SetStateAction<string>>,
    setPerfState: React.Dispatch<React.SetStateAction<ArenaPerf | null>>
  ) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      setErrorState("Model configuration missing.");
      return;
    }
    const provider = providers.find(p => p.id === model.providerId);
    if (!provider) {
      setErrorState("Provider missing.");
      return;
    }
    const key = getApiKeyForProvider(provider.id);
    const isOllama = provider.id === "ollama";
    if (!key.trim() && !isOllama) {
      setErrorState(`API key is required for ${provider.name}.`);
      return;
    }

    setLoadingState(true);
    setErrorState("");
    setPerfState(null);

    const userMessage: ChatMessage = { role: "user", content: userPrompt };
    let currentHistory: ChatMessage[] = [];
    setMessagesState(prev => {
      currentHistory = [...prev, userMessage];
      return currentHistory;
    });

    const startTime = performance.now();

    try {
      const contextMessages: ChatMessage[] = [];
      if (systemPrompt.trim()) {
        contextMessages.push({ role: "system", content: systemPrompt.trim() });
      }
      contextMessages.push(...currentHistory);

      const targetUrl = isOllama ? "http://localhost:11434/v1/chat/completions" : "/api/chat";
      const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const fetchBody: Record<string, unknown> = {
        modelId: model.modelId,
        messages: contextMessages,
        stream: true,
      };

      if (isOllama) {
        fetchBody.model = model.modelId;
      } else {
        fetchHeaders.Authorization = `Bearer ${key.trim()}`;
        fetchBody.providerId = provider.id;
        fetchBody.apiKey = key.trim();
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(fetchBody),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch response");
      }

      if (!response.body) throw new Error("No response body");

      setMessagesState(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content || "";
              if (content) {
                assistantText += content;
                setMessagesState((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: assistantText };
                  return copy;
                });
              }
            } catch {
              // Ignore partial chunk splits
            }
          }
        }
      }

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const tokensCount = estimateTokens(assistantText);
      const tokensSec = tokensCount > 0 ? parseFloat((tokensCount / (latencyMs / 1000)).toFixed(1)) : 0;

      setPerfState({ latencyMs, tokensCount, tokensSec });

      // Log statistics to Savings Dashboard
      addSavingsLog(
        model.id,
        provider.id,
        userPrompt,
        assistantText,
        model.freeTier
      );

    } catch (err: unknown) {
      console.error(err);
      setErrorState(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoadingState(false);
    }
  };

  const handleSendArena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || arenaLoadingA || arenaLoadingB || arenaLoadingC) return;

    const userPrompt = input.trim();
    setInput("");

    await Promise.all([
      sendArenaQuery("A", arenaModelA, userPrompt, setArenaMessagesA, setArenaLoadingA, setArenaErrorA, setArenaPerfA),
      sendArenaQuery("B", arenaModelB, userPrompt, setArenaMessagesB, setArenaLoadingB, setArenaErrorB, setArenaPerfB),
      sendArenaQuery("C", arenaModelC, userPrompt, setArenaMessagesC, setArenaLoadingC, setArenaErrorC, setArenaPerfC)
    ]);
  };

  // Token & context estimator values
  const currentPromptTokens = useMemo(() => estimateTokens(input), [input]);
  const estimatedSavings = useMemo(() => {
    if (!selectedModel) return 0;
    const historyTokens = messages.reduce(
      (acc, m) => acc + estimateTokens(m.content),
      0
    );
    const totalPrompt = historyTokens + currentPromptTokens;
    // Estimate a 150 token average completion cost comparison
    return (totalPrompt / 1000000) * 2.5 + (150 / 1000000) * 10;
  }, [messages, currentPromptTokens, selectedModel]);

  const contextWindowTotal = useMemo(() => {
    if (isArenaMode) return 0;
    return selectedModel?.contextWindow || 0;
  }, [selectedModel, isArenaMode]);

  const contextWindowUsed = useMemo(() => {
    if (isArenaMode) return 0;
    const historyTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
    return historyTokens + currentPromptTokens;
  }, [messages, currentPromptTokens, isArenaMode]);

  const contextPercent = useMemo(() => {
    if (contextWindowTotal === 0) return 0;
    return Math.min(100, (contextWindowUsed / contextWindowTotal) * 100);
  }, [contextWindowUsed, contextWindowTotal]);

  const filteredSessionsList = useMemo(() => {
    return sessions.filter(s => 
      s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.messages.some(m => m.content.toLowerCase().includes(historySearch.toLowerCase()))
    );
  }, [sessions, historySearch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px] items-stretch">
      {/* 1. Collapsible Left Sidebar for Chat History (col-span-3) */}
      {isHistoryOpen && (
        <div className="lg:col-span-3 bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col h-[600px] animate-fade-in overflow-hidden shrink-0">
          <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary" />
              Chat History
            </h3>
            <button
              onClick={() => startNewChat()}
              className="p-1 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-primary cursor-pointer transition-colors shadow-sm"
              title="Start a new chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* History Search bar */}
          <div className="mt-3 relative shrink-0">
            <input
              type="text"
              placeholder="Search conversations..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* History Sessions List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1 divide-y divide-border/20">
            {filteredSessionsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-medium">
                No conversations found.
              </div>
            ) : (
              filteredSessionsList.map(s => {
                const isActive = s.id === activeSessionId;
                const mName = models.find(m => m.id === s.modelId)?.name || "Model";
                return (
                  <div
                    key={s.id}
                    onClick={() => switchSession(s.id)}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer group transition-all border ${
                      isActive 
                        ? "bg-primary/5 border-primary/25 text-primary" 
                        : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-bold truncate pr-1">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate font-semibold">{mName}</p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-rose-500/10 cursor-pointer transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Container Strategy to dynamically span columns based on history toggle state */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch ${isHistoryOpen ? "lg:col-span-9" : "lg:col-span-12"}`}>
        
        {/* 2. Settings Panel Column */}
        <div className="lg:col-span-4 bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6 h-[600px] overflow-hidden">
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-sm font-extrabold flex items-center gap-1.5 text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                <Terminal className="h-4.5 w-4.5 text-primary animate-pulse" />
                Workspace
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="p-1.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-foreground cursor-pointer shadow-sm"
                  title="Toggle Chat History Sidebar"
                >
                  {isHistoryOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsArenaMode(!isArenaMode);
                    handleClear();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <GitCompare className="h-3 w-3" />
                  {isArenaMode ? "Single" : "Arena"}
                </button>
              </div>
            </div>

            {!isArenaMode ? (
              // Standard Single Mode settings
              <div className="space-y-4">
                {/* Tier Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tier
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => handleTierChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                  >
                    <option value="free">Free Models</option>
                    <option value="paid">Paid Models</option>
                  </select>
                </div>

                {/* Model Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Model
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                  >
                    {providers.map((p) => {
                      const groupModels = filteredModels.filter((m) => m.providerId === p.id && m.status === "online");
                      if (groupModels.length === 0) return null;
                      return (
                        <optgroup key={p.id} label={p.name}>
                          {groupModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* API Key validation & custom banner bypass for Ollama */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Key className="h-3.5 w-3.5" />
                      API Key
                    </label>
                    {selectedProvider && selectedProvider.id !== "ollama" && (
                      <a
                        href={selectedProvider.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                      >
                        Get key <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  {selectedProvider?.id !== "ollama" ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Paste API key or setup in Vault..."
                          value={apiKey}
                          onChange={(e) => handleApiKeyChange(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                        />
                        <button
                          onClick={handleVerifyKey}
                          disabled={keyStatus === "checking" || !apiKey.trim()}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer border border-border"
                          title="Verify key health status"
                        >
                          {keyStatus === "checking" ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : keyStatus === "valid" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 animate-bounce" />
                          ) : keyStatus === "invalid" ? (
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          ) : (
                            "Check"
                          )}
                        </button>
                      </div>
                      {keyError && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono leading-normal">
                          Error: {keyError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-green-500/10 dark:bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/25 rounded-xl text-[10px] leading-relaxed flex gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-bold">Ollama Local Integration</p>
                        <p className="mt-0.5 opacity-90">
                          Connecting directly from browser to local port `11434`. No external API keys required!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Arena Mode settings: select three models
              <div className="space-y-4">
                <span className="text-[9px] text-primary font-extrabold bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                  Arena configuration
                </span>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Model A
                  </label>
                  <select
                    value={arenaModelA}
                    onChange={(e) => setArenaModelA(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                  >
                    {onlineModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.providerId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Model B
                  </label>
                  <select
                    value={arenaModelB}
                    onChange={(e) => setArenaModelB(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                  >
                    {onlineModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.providerId})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Model C
                  </label>
                  <select
                    value={arenaModelC}
                    onChange={(e) => setArenaModelC(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                  >
                    {onlineModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.providerId})</option>
                    ))}
                  </select>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                  * Models use credentials configured in settings. Local Ollama bypass is supported.
                </p>
              </div>
            )}

            {/* Prompt Snippet Manager Selector & System Instruction */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  System Instruction
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSystemPromptChange(e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="px-2 py-0.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 text-[10px] focus:outline-none font-semibold text-muted-foreground hover:text-foreground cursor-pointer shadow-sm"
                >
                  <option value="" disabled>Presets</option>
                  <option value="You are a helpful coding assistant.">Coding Assistant</option>
                  <option value="You are an expert software architect. Help design scalable software systems, databases, API schemas, and document code structures.">Software Architect</option>
                  <option value="You are a rigorous code reviewer. Analyze the provided code for logic bugs, performance inefficiencies, security issues, and edge cases. Offer clean fixes.">Code Reviewer</option>
                  <option value="You are a JSON formatter. Output ONLY valid raw JSON data. Do not include markdown code block syntax (like ```json), notes, explanations, or wrapper texts.">JSON Output Mode</option>
                  <option value="You are a writing editor. Proofread and refine my drafts for clarity, tone, and grammar. Keep corrections concise.">Writing Editor</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-normal resize-none font-semibold"
              />
            </div>
          </div>

          {/* Reset Terminal Action */}
          <div className="pt-4 border-t border-border/50 shrink-0">
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-danger hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              <Trash2 className="h-4 w-4" />
              Clear Terminal
            </button>
          </div>
        </div>

        {/* 3. Chat Workspace panel */}
        <div className={`lg:col-span-8 bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden`}>
          {/* Workspace Status Bar */}
          {!isArenaMode ? (
            <div className="border-b border-border p-4 bg-muted/20 flex justify-between items-center text-xs shrink-0">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary animate-pulse" />
                <div>
                  <span className="font-bold text-foreground">{selectedModel?.name || "No Model"}</span>
                  <span className="text-muted-foreground ml-2 font-mono text-[10px]">({selectedModel?.modelId})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-bold">Provider:</span>
                <span className="font-bold text-foreground">{selectedProvider?.name || "None"}</span>
              </div>
            </div>
          ) : (
            <div className="border-b border-border p-4 bg-muted/20 flex justify-between items-center text-xs shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <GitCompare className="h-4 w-4 text-primary" />
                Arena Split Mode
              </div>
              <div className="text-[10px] text-muted-foreground font-extrabold">
                Streaming prompt concurrently to three models
              </div>
            </div>
          )}

          {/* Cost Arbitrage Optimizer Alert Banner */}
          {!isArenaMode && selectedModel && !selectedModel.freeTier && (
            <div className="bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/10 p-3 flex justify-between items-center gap-3 text-xs text-amber-700 dark:text-amber-400 shrink-0">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500 animate-pulse" />
                <div>
                  <span className="font-bold">AgentRadar Optimizer: </span>
                  <span>You are on a paid model. Switch to Llama 3.3 70B (Free) right now to save costs.</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const freeModel = models.find(m => m.freeTier && m.status === "online");
                  if (freeModel) {
                    handleModelChange(freeModel.id);
                  }
                }}
                className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer hover:bg-amber-600 transition-colors shrink-0"
              >
                Switch to Free
              </button>
            </div>
          )}

          {/* Chat History columns */}
          {!isArenaMode ? (
            // Single Chat history
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <Sparkles className="h-8 w-8 text-primary/40 mb-3 animate-pulse" />
                  <h3 className="font-bold mb-1 text-sm text-slate-900 dark:text-slate-50">Welcome to the LLM Playground</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    Test free models live. Configure credentials on the left, type a prompt, and see streaming completions instantly.
                  </p>
                </div>
              ) : (
                messages.map((m, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                          : "bg-muted text-foreground rounded-tl-none border border-border/50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-semibold">{m.content || "..."}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1 font-bold">
                      {m.role === "user" ? "You" : selectedModel?.name}
                    </span>
                  </div>
                ))
              )}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex flex-col items-start">
                  <div className="bg-muted text-foreground rounded-2xl rounded-tl-none border border-border/50 p-4 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 font-bold">
                    {selectedModel?.name} (Generating...)
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold">Request Failed</p>
                    <p className="mt-0.5 leading-relaxed font-mono font-bold">{error}</p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          ) : (
            // Arena Side-by-Side Splits
            <div className="flex-1 grid grid-cols-3 divide-x divide-border overflow-hidden">
              {/* Column A */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="border-b border-border bg-slate-50 dark:bg-slate-900 p-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  A: {models.find(m => m.id === arenaModelA)?.name || "Model A"}
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {arenaMessagesA.map((m, i) => (
                    <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-primary/5 border border-primary/10 ml-4' : 'bg-muted border border-border/50 mr-4'}`}>
                      <p className="whitespace-pre-wrap leading-relaxed font-semibold">{m.content || "..."}</p>
                    </div>
                  ))}
                  {arenaLoadingA && <div className="text-[10px] text-muted-foreground animate-pulse p-2 font-extrabold">Generating...</div>}
                  {arenaErrorA && <div className="text-[10px] text-rose-500 p-2 border border-rose-500/20 rounded bg-rose-50 dark:bg-rose-950/20 font-mono">{arenaErrorA}</div>}
                  <div ref={arenaChatEndRefA} />
                </div>
                {arenaPerfA && (
                  <div className="border-t border-border bg-slate-50 dark:bg-slate-900 p-2 text-[9px] text-muted-foreground font-mono leading-tight space-y-0.5 shrink-0">
                    <div>Latency: {arenaPerfA.latencyMs}ms</div>
                    <div>Tokens: {arenaPerfA.tokensCount}</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Speed: {arenaPerfA.tokensSec} t/s</div>
                  </div>
                )}
              </div>

              {/* Column B */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="border-b border-border bg-slate-50 dark:bg-slate-900 p-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  B: {models.find(m => m.id === arenaModelB)?.name || "Model B"}
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {arenaMessagesB.map((m, i) => (
                    <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-primary/5 border border-primary/10 ml-4' : 'bg-muted border border-border/50 mr-4'}`}>
                      <p className="whitespace-pre-wrap leading-relaxed font-semibold">{m.content || "..."}</p>
                    </div>
                  ))}
                  {arenaLoadingB && <div className="text-[10px] text-muted-foreground animate-pulse p-2 font-extrabold">Generating...</div>}
                  {arenaErrorB && <div className="text-[10px] text-rose-500 p-2 border border-rose-500/20 rounded bg-rose-50 dark:bg-rose-950/20 font-mono">{arenaErrorB}</div>}
                  <div ref={arenaChatEndRefB} />
                </div>
                {arenaPerfB && (
                  <div className="border-t border-border bg-slate-50 dark:bg-slate-900 p-2 text-[9px] text-muted-foreground font-mono leading-tight space-y-0.5 shrink-0">
                    <div>Latency: {arenaPerfB.latencyMs}ms</div>
                    <div>Tokens: {arenaPerfB.tokensCount}</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Speed: {arenaPerfB.tokensSec} t/s</div>
                  </div>
                )}
              </div>

              {/* Column C */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="border-b border-border bg-slate-50 dark:bg-slate-900 p-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  C: {models.find(m => m.id === arenaModelC)?.name || "Model C"}
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {arenaMessagesC.map((m, i) => (
                    <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-primary/5 border border-primary/10 ml-4' : 'bg-muted border border-border/50 mr-4'}`}>
                      <p className="whitespace-pre-wrap leading-relaxed font-semibold">{m.content || "..."}</p>
                    </div>
                  ))}
                  {arenaLoadingC && <div className="text-[10px] text-muted-foreground animate-pulse p-2 font-extrabold">Generating...</div>}
                  {arenaErrorC && <div className="text-[10px] text-rose-500 p-2 border border-rose-500/20 rounded bg-rose-50 dark:bg-rose-950/20 font-mono">{arenaErrorC}</div>}
                  <div ref={arenaChatEndRefC} />
                </div>
                {arenaPerfC && (
                  <div className="border-t border-border bg-slate-50 dark:bg-slate-900 p-2 text-[9px] text-muted-foreground font-mono leading-tight space-y-0.5 shrink-0">
                    <div>Latency: {arenaPerfC.latencyMs}ms</div>
                    <div>Tokens: {arenaPerfC.tokensCount}</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Speed: {arenaPerfC.tokensSec} t/s</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visualizers & Input Cost Bar */}
          {!isArenaMode && selectedModel && (
            <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono select-none shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                  <DollarSign className="h-3 w-3 animate-pulse" />
                  Saved on prompt: ${estimatedSavings.toFixed(6)}
                </span>
                <span>(~{currentPromptTokens} tokens)</span>
              </div>

              <div className="flex items-center gap-2 w-1/3 max-w-[200px]">
                <span className="shrink-0 font-extrabold">Context: {contextWindowUsed.toLocaleString()} / {contextWindowTotal.toLocaleString()}</span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${contextPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Input Form Panel */}
          <form onSubmit={isArenaMode ? handleSendArena : handleSend} className="p-4 border-t border-border bg-muted/20 shrink-0">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder={
                  isArenaMode
                    ? "Enter prompt for parallel model arena..."
                    : (!apiKey && selectedProvider?.id !== "ollama")
                    ? `Enter API key on left or Settings to chat...`
                    : `Send prompt to ${selectedModel?.name || "model"}...`
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isArenaMode ? (arenaLoadingA || arenaLoadingB || arenaLoadingC) : (isLoading || (!apiKey && selectedProvider?.id !== "ollama"))}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={isArenaMode ? (!input.trim() || arenaLoadingA || arenaLoadingB || arenaLoadingC) : (!input.trim() || isLoading || (!apiKey && selectedProvider?.id !== "ollama"))}
                className="p-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
