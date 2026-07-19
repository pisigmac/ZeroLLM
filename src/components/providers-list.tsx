"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Provider, Model, Modality } from "@/lib/types";
import ModalityBadges from "./modality-badges";
import { Search, CreditCard, Smartphone, Check, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";

interface ProvidersListProps {
  providers: Provider[];
  models: Model[];
}

export default function ProvidersList({ providers, models }: ProvidersListProps) {
  const [search, setSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [noCardRequired, setNoCardRequired] = useState(false);
  const [noPhoneRequired, setNoPhoneRequired] = useState(false);

  // Get list of all modalities present across providers
  const allModalities = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => p.capabilities.forEach((m) => set.add(m)));
    return Array.from(set) as Modality[];
  }, [providers]);

  // Filter providers list
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      // Search matches
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.notes?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Modality matches
      if (selectedModality !== "all") {
        if (!p.capabilities.includes(selectedModality as Modality)) {
          return false;
        }
      }

      // No card check
      if (noCardRequired && p.creditCardRequired) {
        return false;
      }

      // No phone check
      if (noPhoneRequired && p.phoneVerificationRequired) {
        return false;
      }

      return true;
    });
  }, [providers, search, selectedModality, noCardRequired, noPhoneRequired]);

  return (
    <div className="space-y-6">
      {/* Filters Control Card */}
      <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search providers by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>

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

        <div className="flex flex-wrap gap-6 pt-2 items-center text-sm border-t border-border/50 text-muted-foreground">
          <span>Filters:</span>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-foreground">
            <input
              type="checkbox"
              checked={noCardRequired}
              onChange={(e) => setNoCardRequired(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
            />
            <span>No Credit Card Required</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-foreground">
            <input
              type="checkbox"
              checked={noPhoneRequired}
              onChange={(e) => setNoPhoneRequired(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/20 h-4 w-4"
            />
            <span>No Phone Verification</span>
          </label>

          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filteredProviders.length} of {providers.length} providers
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => {
          const providerModels = models.filter((m) => m.providerId === provider.id);
          const onlineCount = providerModels.filter((m) => m.status === "online").length;

          return (
            <div
              key={provider.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/50 transition-all group"
            >
              <div>
                {/* Provider Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {provider.name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono block uppercase">
                      ID: {provider.id}
                    </span>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize">
                    {provider.tierType}
                  </span>
                </div>

                {/* notes */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                  {provider.notes || "Access free developer API models."}
                </p>

                {/* signup friction metrics */}
                <div className="space-y-2.5 mb-6 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-border/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      Credit Card Required:
                    </span>
                    {provider.creditCardRequired ? (
                      <span className="font-semibold text-amber-600">Yes</span>
                    ) : (
                      <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> No
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone Verification:
                    </span>
                    {provider.phoneVerificationRequired ? (
                      <span className="font-semibold text-slate-500">Yes</span>
                    ) : (
                      <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> No
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Active Models:
                    </span>
                    <span className="font-bold">
                      {onlineCount} / {providerModels.length || provider.freeModelCount} online
                    </span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mb-6">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
                    Supported Modalities
                  </span>
                  <ModalityBadges modalities={provider.capabilities} maxToShow={5} />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4 mt-auto">
                <Link
                  href={provider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Get API Key
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href={`/providers/${provider.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                >
                  View Provider Models
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
