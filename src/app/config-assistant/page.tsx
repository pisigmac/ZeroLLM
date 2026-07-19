"use client";

import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

export default function ConfigAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Config Assistant. Tell me what kind of project you're building and I'll generate the right configuration for your environment using the models in our directory." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || data.error || "Unknown error" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to connect to the orchestrator backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto h-[calc(100vh-100px)]">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Config Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-card border border-border rounded-xl shadow-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
            <div className={`p-2 rounded-lg ${msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
              {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className={`p-3 rounded-xl max-w-[80%] ${msg.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-muted"><Bot className="h-5 w-5" /></div>
            <div className="p-3 rounded-xl bg-muted text-foreground flex items-center gap-2">
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to configure your project..."
          className="flex-1 bg-card border border-border rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
