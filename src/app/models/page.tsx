import { getModels, getProviders } from "@/lib/data";
import ModelTable from "@/components/model-table";
import { Cpu } from "lucide-react";

export const metadata = {
  title: "Free LLM Models Directory | AgentRadar",
  description: "Search and filter through 50+ free LLM models across major providers, comparing context windows and rates.",
};

export default async function ModelsPage() {
  const [models, providers] = await Promise.all([getModels(), getProviders()]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1.5">
              <Cpu className="h-4 w-4" />
              <span>Full Access Index</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Free LLM Models</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse, filter, and compare {models.length} free LLM models with API limits.
            </p>
          </div>
        </div>

        {/* Interactive Table Component */}
        <ModelTable initialModels={models} providers={providers} />
      </div>
    </div>
  );
}
