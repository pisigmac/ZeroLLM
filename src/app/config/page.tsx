import { getModels, getProviders } from "@/lib/data";
import ConfigGenerator from "@/components/config-generator";
import { Settings } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "AI Editor Config Generator | AgentRadar",
  description: "Generate copy-paste configuration profiles for Claude Code, Cursor, Cline, and LiteLLM utilizing free LLM APIs.",
};

export default async function ConfigPage() {
  const [models, providers] = await Promise.all([getModels(), getProviders()]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1.5">
            <Settings className="h-4 w-4" />
            <span>Developer Tooling Configurator</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Generate Tool Configs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create configurations for Claude Code, Cursor, Cline, or LiteLLM to use free LLM endpoints.
          </p>
        </div>

        {/* Generator Workspace */}
        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center bg-card border border-border rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Loading configurator workspace...</span>
              </div>
            </div>
          }
        >
          <ConfigGenerator models={models} providers={providers} />
        </Suspense>
      </div>
    </div>
  );
}
