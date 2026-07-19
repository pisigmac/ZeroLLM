"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Model, Provider } from "@/lib/types";
import { formatContext, slugify } from "@/lib/utils";
import StatusBadge from "./status-badge";
import ModalityBadges from "./modality-badges";
import { Plus, X, GitCompare, Terminal, Settings } from "lucide-react";

interface CompareWorkspaceProps {
  models: Model[];
  providers: Provider[];
}

export default function CompareWorkspace({ models, providers }: CompareWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sync selected models from URL search parameters dynamically
  const selectedIds = useMemo(() => {
    const modelsParam = searchParams.get("models");
    if (modelsParam) {
      const ids = modelsParam
        .split(",")
        .filter((id) => models.some((m) => m.id === id));
      return ids.slice(0, 6); // cap at 6 models
    } else {
      // Default to top 2 models if none specified
      const topTwo = [...models]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 2)
        .map((m) => m.id);
      return topTwo;
    }
  }, [searchParams, models]);

  // Update URL parameters when selection changes
  const updateUrl = (ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length > 0) {
      params.set("models", ids.join(","));
    }
    router.push(`?${params.toString()}`);
  };

  const handleAdd = (id: string) => {
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 6) {
      alert("You can compare up to 6 models side-by-side.");
      return;
    }
    const newIds = [...selectedIds, id];
    updateUrl(newIds);
    setSearch("");
    setDropdownOpen(false);
  };

  const handleRemove = (id: string) => {
    const newIds = selectedIds.filter((x) => x !== id);
    updateUrl(newIds);
  };

  // Get currently selected Model objects
  const selectedModels = useMemo(() => {
    return selectedIds
      .map((id) => models.find((m) => m.id === id))
      .filter((m): m is Model => !!m);
  }, [selectedIds, models]);

  // Filter dropdown search results
  const searchResults = useMemo(() => {
    if (!search.trim()) return models.filter((m) => !selectedIds.includes(m.id)).slice(0, 5);
    const q = search.toLowerCase();
    return models
      .filter(
        (m) =>
          !selectedIds.includes(m.id) &&
          (m.name.toLowerCase().includes(q) || m.providerId.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [search, models, selectedIds]);

  return (
    <div className="space-y-8">
      {/* Selector & Actions */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search model to add..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-border">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">No models found</div>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleAdd(m.id)}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold block">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))
                )}
              </div>
            )}
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {selectedModels.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-muted border border-border text-xs font-semibold"
              >
                {m.name}
                <button
                  onClick={() => handleRemove(m.id)}
                  className="text-muted-foreground hover:text-foreground rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {dropdownOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      {selectedModels.length === 0 ? (
        <div className="bg-card p-12 text-center border border-border rounded-2xl">
          <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">No Models Selected</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Choose models above to start comparing their context size, modalities, limits, and statuses.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-4 px-6 font-semibold text-xs text-muted-foreground uppercase w-48">
                    Specification
                  </th>
                  {selectedModels.map((m) => (
                    <th key={m.id} className="py-4 px-6 border-l border-border/60 relative">
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/models/${slugify(m.id)}`}
                          className="font-bold text-sm hover:text-primary transition-colors block mr-6"
                        >
                          {m.name}
                        </Link>
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-danger rounded-full p-1 hover:bg-muted"
                          title="Remove model"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block mt-1">
                        {providers.find((p) => p.id === m.providerId)?.name || m.providerId}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Score Row */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Score
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-sm">
                        {m.score || 0}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Context Window */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Context Window
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60 font-mono text-sm">
                      {formatContext(m.contextWindow)} tokens
                    </td>
                  ))}
                </tr>

                {/* Max Output Tokens */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Max Output Tokens
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60 font-mono text-sm">
                      {m.maxOutputTokens ? `${formatContext(m.maxOutputTokens)} tokens` : "N/A"}
                    </td>
                  ))}
                </tr>

                {/* Modalities */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Modalities
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60">
                      <ModalityBadges modalities={m.modalities} />
                    </td>
                  ))}
                </tr>

                {/* Rate Limit */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Rate Limit
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60 text-sm text-muted-foreground">
                      {m.rateLimit || "N/A"}
                    </td>
                  ))}
                </tr>

                {/* Status */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Health Status
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60">
                      <StatusBadge status={m.status} verified={m.verified} />
                    </td>
                  ))}
                </tr>

                {/* Model ID */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Model Identifier
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60 font-mono text-xs text-muted-foreground break-all select-all">
                      {m.modelId}
                    </td>
                  ))}
                </tr>

                {/* Base URL */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Base endpoint URL
                  </td>
                  {selectedModels.map((m) => {
                    const p = providers.find((pr) => pr.id === m.providerId);
                    return (
                      <td key={m.id} className="py-4 px-6 border-l border-border/60 font-mono text-[10px] text-muted-foreground break-all select-all">
                        {p?.baseUrl || "N/A"}
                      </td>
                    );
                  })}
                </tr>

                {/* Actions */}
                <tr className="hover:bg-muted/10 transition-colors bg-muted/10">
                  <td className="py-4 px-6 font-medium text-xs text-muted-foreground uppercase">
                    Actions
                  </td>
                  {selectedModels.map((m) => (
                    <td key={m.id} className="py-4 px-6 border-l border-border/60">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/playground?model=${m.providerId}/${m.modelId}`}
                          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition-all text-center"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          Test
                        </Link>
                        <Link
                          href={`/config?model=${m.providerId}/${m.modelId}`}
                          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-all text-center"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Config
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
