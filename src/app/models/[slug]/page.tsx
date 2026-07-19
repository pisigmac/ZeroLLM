import Link from "next/link";
import { notFound } from "next/navigation";
import { getModels, getProviders } from "@/lib/data";
import { slugify, formatContext } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";
import ModalityBadges from "@/components/modality-badges";
import { Calendar, ArrowLeft, Terminal, Settings, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const [models, providers] = await Promise.all([getModels(), getProviders()]);

  const model = models.find((m) => slugify(m.id) === slug);
  if (!model) notFound();

  const provider = providers.find((p) => p.id === model.providerId);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/models"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Models Directory
        </Link>

        {/* Model Info Header Card */}
        <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-border/50">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={model.status} verified={model.verified} />
                {provider && (
                  <Link
                    href={`/providers/${provider.slug}`}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {provider.name}
                  </Link>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{model.name}</h1>
              <p className="text-sm font-mono text-muted-foreground mt-1">{model.modelId}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-xl min-w-[100px]">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                Score
              </span>
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {model.score || 0}
              </span>
            </div>
          </div>

          {/* Model Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Context Window
              </span>
              <p className="text-lg font-bold font-mono">{formatContext(model.contextWindow)} tokens</p>
              <p className="text-xs text-muted-foreground">Total input window size</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Max Output Tokens
              </span>
              <p className="text-lg font-bold font-mono">
                {model.maxOutputTokens ? `${formatContext(model.maxOutputTokens)} tokens` : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">Max generation limit</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Rate Limit
              </span>
              <p className="text-lg font-bold">{model.rateLimit || "Generous"}</p>
              <p className="text-xs text-muted-foreground">Free tier limits</p>
            </div>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            {/* Quickstart Config */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-1.5">
                <Terminal className="h-4.5 w-4.5 text-primary" />
                API Integration Quickstart
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Integrate {model.name} into your software using the provider&apos;s API key.
              </p>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre">
{`// cURL Request
curl ${provider?.baseUrl || "https://api.provider.com"}/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.modelId}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
              </pre>
            </div>

            {/* Health Status */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                Live Health Verification
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Availability Status</span>
                  <StatusBadge status={model.status} verified={model.verified} />
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Last Checked</span>
                  <span>
                    {model.lastVerifiedAt
                      ? new Date(model.lastVerifiedAt).toLocaleString()
                      : "Never checked"}
                  </span>
                </div>
                {model.lastError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
                    <p className="font-semibold">Last verification error:</p>
                    <p className="mt-1 font-mono">{model.lastError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action buttons */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
              <h3 className="font-bold text-sm mb-4">Model Actions</h3>
              <Link
                href={`/playground?model=${model.providerId}/${model.modelId}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm"
              >
                <Terminal className="h-4 w-4" />
                Test in Playground
              </Link>
              <Link
                href={`/config?model=${model.providerId}/${model.modelId}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-sm font-semibold transition-all"
              >
                <Settings className="h-4 w-4" />
                Generate Config
              </Link>
            </div>

            {/* Attributes Card */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-sm pb-2 border-b border-border/50">Details</h3>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Modalities
                  </span>
                  <div className="mt-1">
                    <ModalityBadges modalities={model.modalities} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Access Tier
                  </span>
                  <span className="text-sm font-medium mt-0.5 block">
                    {model.freeTier ? "100% Free" : "Trial limits"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    No Credit Card
                  </span>
                  <span className="text-sm font-medium mt-0.5 block">
                    {model.noCreditCard ? "Yes, zero friction" : "Required for billing setup"}
                  </span>
                </div>

                {model.releasedAt && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Release Date
                    </span>
                    <span className="text-sm font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(model.releasedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
