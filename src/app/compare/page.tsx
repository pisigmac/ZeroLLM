import { getModels, getProviders } from "@/lib/data";
import CompareWorkspace from "@/components/compare-workspace";
import { GitCompare } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Side-by-Side Model Comparison | AgentRadar",
  description: "Compare up to 6 free LLM models side-by-side on context windows, limits, modalities, and online statuses.",
};

// We wrap the compare view in a suspense boundary because the client component uses useSearchParams.
// This prevents Next.js from opting the entire route into fully dynamic rendering at build time if unnecessary,
// and shows a clean loader during client hydration.
export default async function ComparePage() {
  const [models, providers] = await Promise.all([getModels(), getProviders()]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1.5">
            <GitCompare className="h-4 w-4" />
            <span>Benchmark Comparison</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Compare Free Models</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze context window limits, modalities, and API rates side-by-side. Support up to 6 models.
          </p>
        </div>

        {/* Workspace */}
        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center bg-card border border-border rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Loading comparison matrix...</span>
              </div>
            </div>
          }
        >
          <CompareWorkspace models={models} providers={providers} />
        </Suspense>
      </div>
    </div>
  );
}
