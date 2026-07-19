"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Model, Provider, Modality } from "@/lib/types";
import { formatContext, slugify } from "@/lib/utils";
import StatusBadge from "./status-badge";
import ModalityBadges from "./modality-badges";
import { Search, SlidersHorizontal, ArrowUpDown, Terminal, GitCompare, Settings, X } from "lucide-react";

interface ModelTableProps {
  initialModels: Model[];
  providers: Provider[];
}

type SortField = "name" | "contextWindow" | "score" | "provider";
type SortOrder = "asc" | "desc";

export default function ModelTable({ initialModels, providers }: ModelTableProps) {
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [noCcOnly, setNoCcOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Get all unique modalities present in models
  const allModalities = useMemo(() => {
    const set = new Set<string>();
    initialModels.forEach((m) => m.modalities.forEach((mod) => set.add(mod)));
    return Array.from(set) as Modality[];
  }, [initialModels]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter & Sort models
  const filteredModels = useMemo(() => {
    let result = [...initialModels];

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.modelId.toLowerCase().includes(q) ||
          m.providerId.toLowerCase().includes(q)
      );
    }

    // Filter by provider
    if (selectedProvider !== "all") {
      result = result.filter((m) => m.providerId === selectedProvider);
    }

    // Filter by modality
    if (selectedModality !== "all") {
      result = result.filter((m) => m.modalities.includes(selectedModality as Modality));
    }

    // Filter by No Credit Card
    if (noCcOnly) {
      result = result.filter((m) => {
        const prov = providers.find((p) => p.id === m.providerId);
        return prov ? !prov.creditCardRequired : m.noCreditCard;
      });
    }

    // Filter by Online status
    if (onlineOnly) {
      result = result.filter((m) => m.status === "online");
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: unknown = sortField === "provider" ? a.providerId : a[sortField as keyof Model];
      let bVal: unknown = sortField === "provider" ? b.providerId : b[sortField as keyof Model];

      // Handle custom sorting cases
      if (sortField === "provider") {
        const aProv = providers.find((p) => p.id === a.providerId)?.name || a.providerId;
        const bProv = providers.find((p) => p.id === b.providerId)?.name || b.providerId;
        aVal = aProv;
        bVal = bProv;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        const aNum = typeof aVal === "number" ? aVal : 0;
        const bNum = typeof bVal === "number" ? bVal : 0;
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }
    });

    return result;
  }, [initialModels, providers, search, selectedProvider, selectedModality, noCcOnly, onlineOnly, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Controls */}
      <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search models by name, ID, or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Modalities</option>
              {allModalities.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 items-center text-sm border-t border-border/50">
          <span className="flex items-center gap-1 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters:
          </span>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noCcOnly}
              onChange={(e) => setNoCcOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
            />
            <span>No Credit Card Required</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
            />
            <span>Online Only</span>
          </label>

          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filteredModels.length} of {initialModels.length} models
          </span>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    Model
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("provider")}>
                  <div className="flex items-center gap-1">
                    Provider
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("contextWindow")}>
                  <div className="flex items-center gap-1">
                    Context Window
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Modalities</th>
                <th className="py-4 px-6">Rate Limits</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 cursor-pointer select-none hover:bg-muted/50 transition-colors text-right" onClick={() => handleSort("score")}>
                  <div className="flex items-center justify-end gap-1">
                    Score
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    No models found matching your filter criteria. Try resetting filters.
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => {
                  const prov = providers.find((p) => p.id === model.providerId);
                  return (
                    <tr key={model.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-4 px-6 font-medium">
                        <Link
                          href={`/models/${slugify(model.id)}`}
                          className="group-hover:text-primary transition-colors block"
                        >
                          {model.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                          {model.modelId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <Link href={`/providers/${model.providerId}`} className="hover:underline">
                          {prov?.name || model.providerId}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm font-mono">
                        {formatContext(model.contextWindow)}
                      </td>
                      <td className="py-4 px-6">
                        <ModalityBadges modalities={model.modalities} />
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {model.rateLimit || "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={model.status} verified={model.verified} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm">
                          {model.score || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/playground?model=${model.providerId}/${model.modelId}`}
                            title="Test in Playground"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Terminal className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/compare?models=${model.providerId}/${model.modelId}`}
                            title="Compare Model"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                          >
                            <GitCompare className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/config?model=${model.providerId}/${model.modelId}`}
                            title="Generate Config"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
