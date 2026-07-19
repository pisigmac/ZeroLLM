import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviders, getModels } from "@/lib/data";
import { slugify, formatContext } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";
import ModalityBadges from "@/components/modality-badges";
import { ArrowLeft, ExternalLink, Terminal, Settings, GitCompare, CreditCard, Smartphone } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProviderDetailPage({ params }: Props) {
  const { slug } = await params;
  const [providers, models] = await Promise.all([getProviders(), getModels()]);

  const provider = providers.find((p) => p.slug === slug);
  if (!provider) notFound();

  const providerModels = models.filter((m) => m.providerId === provider.id);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/providers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Providers Directory
        </Link>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - info card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize mb-2 inline-block">
                  {provider.tierType} Free Tier
                </span>
                <h1 className="text-2xl font-bold tracking-tight">{provider.name}</h1>
                <p className="text-xs text-muted-foreground mt-0.5 uppercase font-mono">ID: {provider.id}</p>
              </div>

              {provider.notes && <p className="text-sm text-muted-foreground">{provider.notes}</p>}

              {/* Friction Checklist */}
              <div className="space-y-3 pt-4 border-t border-border/50 text-sm">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Signup Friction Check
                </h3>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Credit Card Required
                  </span>
                  {provider.creditCardRequired ? (
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                      Yes
                    </span>
                  ) : (
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                      No Card Required
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    Phone Verification
                  </span>
                  {provider.phoneVerificationRequired ? (
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-500/10 text-slate-600">
                      Yes
                    </span>
                  ) : (
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                      Not Required
                    </span>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2 pt-4 border-t border-border/50 text-sm">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Platform Links
                </h3>
                <a
                  href={provider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors group text-xs font-semibold"
                >
                  Create API Key / Access Console
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {provider.docsUrl && (
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors group text-xs font-semibold"
                  >
                    API Documentation
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}
              </div>

              {/* Endpoint Information */}
              <div className="space-y-2 pt-4 border-t border-border/50 text-sm">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  API Configuration
                </h3>
                <div className="space-y-1 bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[10px] select-all overflow-x-auto">
                  <p className="text-slate-500">{"// Base Endpoint URL"}</p>
                  <p>{provider.baseUrl}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - models table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-lg font-bold mb-1">Offered Models</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Active free models available from {provider.name}.
              </p>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Model</th>
                        <th className="py-3 px-4">Context</th>
                        <th className="py-3 px-4">Modalities</th>
                        <th className="py-3 px-4">Rate Limits</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {providerModels.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                            No models indexed for this provider. Run sync adapter.
                          </td>
                        </tr>
                      ) : (
                        providerModels.map((model) => (
                          <tr key={model.id} className="hover:bg-muted/10 transition-colors group">
                            <td className="py-3.5 px-4 font-semibold">
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
                            <td className="py-3.5 px-4 font-mono text-xs">
                              {formatContext(model.contextWindow)}
                            </td>
                            <td className="py-3.5 px-4">
                              <ModalityBadges modalities={model.modalities} />
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {model.rateLimit || "N/A"}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={model.status} verified={model.verified} />
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/playground?model=${model.providerId}/${model.modelId}`}
                                  title="Test in Playground"
                                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Terminal className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/compare?models=${model.providerId}/${model.modelId}`}
                                  title="Compare Model"
                                  className="p-1 rounded text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                                >
                                  <GitCompare className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/config?model=${model.providerId}/${model.modelId}`}
                                  title="Generate Config"
                                  className="p-1 rounded text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                                >
                                  <Settings className="h-4 w-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
