import { getProviders, getModels } from "@/lib/data";
import ProvidersList from "@/components/providers-list";
import { Layers } from "lucide-react";

export const metadata = {
  title: "Free LLM API Providers | AgentRadar",
  description: "Find free LLM API providers, check signup friction (credit card, phone required) and model counts.",
};

export default async function ProvidersPage() {
  const [providers, models] = await Promise.all([getProviders(), getModels()]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1.5">
            <Layers className="h-4 w-4" />
            <span>Platform Registry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Free LLM API Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare signup requirements, rate limits, and capacities across {providers.length} platforms.
          </p>
        </div>

        {/* Client-side filterable list */}
        <ProvidersList providers={providers} models={models} />
      </div>
    </div>
  );
}
