import { getModels, getProviders } from "@/lib/data";
import PlaygroundWorkspace from "@/components/playground-workspace";
import { Terminal } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Free LLM API Playground | AgentRadar",
  description: "Test free LLM APIs directly in your browser. Fully client-side storage, secure streaming chat proxy.",
};

export default async function PlaygroundPage() {
  const [models, providers] = await Promise.all([getModels(), getProviders()]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1.5">
            <Terminal className="h-4 w-4" />
            <span>Interactive Chat Terminal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">API Playground</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test and run models in the browser using your own credentials. Key data is never saved on servers.
          </p>
        </div>

        {/* Playground Client Workspace */}
        <Suspense
          fallback={
            <div className="h-[600px] flex items-center justify-center bg-card border border-border rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Hydrating playground terminal...</span>
              </div>
            </div>
          }
        >
          <PlaygroundWorkspace models={models} providers={providers} />
        </Suspense>
      </div>
    </div>
  );
}
