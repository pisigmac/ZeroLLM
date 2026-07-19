import Link from "next/link";
import Image from "next/image";
import { getModels, getProviders, getLastSync } from "@/lib/data";
import { formatContext, slugify } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";
import ModalityBadges from "@/components/modality-badges";

export default async function Home() {
  const [models, providers] = await Promise.all([
    getModels(),
    getProviders(),
  ]);

  const onlineModelsCount = models.filter((m) => m.status === "online").length;
  
  const topModels = [...models]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8);

  return (
    <div className="dark bg-void text-white min-h-[200vh] relative overflow-hidden -mt-16 pt-16 selection:bg-accentMagenta selection:text-white">
      {/* Background Video */}
      <div className="video-bg fixed top-0 left-0 w-screen h-screen -z-20 overflow-hidden pointer-events-none">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30 saturate-150 hue-rotate-45">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-background-28499-large.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="overlay fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-void/90 to-void/40"></div>

      {/* Animated CSS Glows */}
      <div className="glow-blob w-[500px] h-[500px] bg-accentCyan top-[-100px] left-[-100px] animate-blob pointer-events-none absolute"></div>
      <div className="glow-blob w-[600px] h-[600px] bg-accentMagenta top-[60%] right-[-200px] animate-blob pointer-events-none absolute" style={{ animationDelay: '2s' }}></div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pt-32 pb-32 flex flex-col lg:flex-row items-center justify-between min-h-screen">
        
        {/* Left: Typography */}
        <div className="w-full lg:w-1/2 z-20 flex flex-col justify-center">
          <div className="overflow-hidden mb-6">
            <p className="font-medium text-accentCyan uppercase tracking-[0.2em] text-sm animate-slide-up">Next Generation Architecture</p>
          </div>
          
          <div className="overflow-hidden">
            <h1 className="font-display text-6xl sm:text-8xl xl:text-[7rem] leading-[0.9] tracking-tighter mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              ACCESS THE <br/>
              <span className="text-gradient">WORLD'S BEST.</span>
            </h1>
          </div>
          
          <div className="overflow-hidden">
            <p className="text-xl text-gray-300 max-w-md leading-relaxed font-light mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              Skip the waitlists. Instantly connect, compare, and chat with the most powerful language models on the planet—all in one place.
            </p>
          </div>

          <div className="flex gap-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <Link href="/models" className="bg-white text-black font-semibold px-10 py-4 rounded-full hover:scale-105 transition-transform text-lg block w-fit">
              Enter Gallery
            </Link>
          </div>
        </div>

        {/* Right: Generated Image as Floating Art Piece */}
        <div className="w-full lg:w-1/2 relative mt-20 lg:mt-0 flex justify-center animate-float-slow">
          <div className="relative w-full max-w-lg aspect-[4/5] image-reveal">
            <Image src="/abstract_chrome.jpg" alt="Abstract Chrome Sculpture" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover rounded-t-full rounded-bl-full shadow-[0_0_100px_rgba(254,9,121,0.3)] border border-white/20" priority />
            
            <div className="absolute -bottom-10 -left-10 glass-panel p-6 max-w-[280px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" fill sizes="48px" className="object-cover" />
                </div>
                <div>
                  <div className="font-bold text-sm">Global Array</div>
                  <div className="text-xs text-accentCyan">All Nodes Active</div>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-light">"{onlineModelsCount} models are synchronizing flawlessly across the global network."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Section */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-32">
        <div className="glass-panel w-full p-12 lg:p-24 flex flex-col lg:flex-row gap-16 justify-between items-center mb-32">
          <h2 className="font-display text-4xl lg:text-6xl max-w-xl leading-tight">
            A Curated Exhibition of Intelligence.
          </h2>
          <div className="w-full lg:w-1/3 grid grid-cols-2 gap-8">
            <div>
              <div className="text-4xl font-display text-accentCyan mb-2">{models.length}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Active Models</div>
            </div>
            <div>
              <div className="text-4xl font-display text-accentMagenta mb-2">{providers.length}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Providers</div>
            </div>
          </div>
        </div>

        {/* Re-integrated Tables/Grid with glass-panel styling */}
        <div className="mb-16">
          <h2 className="font-display text-4xl mb-8">Featured Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {providers.slice(0, 6).map((provider) => (
              <Link
                href={`/providers/${provider.slug}`}
                key={provider.id}
                className="group glass-panel p-6 hover:border-accentCyan/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg group-hover:text-accentCyan transition-colors">
                    {provider.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/10 text-gray-300">
                    {provider.tierType === "permanent" ? "Permanent" : "Trial"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 flex-1 line-clamp-2 mb-4">
                  {provider.notes || "Access free LLM models with API keys."}
                </p>
                <div className="flex justify-between items-center text-xs border-t border-white/10 pt-3">
                  <span className="text-gray-400">{provider.freeModelCount} free models</span>
                  <span className="text-accentCyan font-medium group-hover:translate-x-1 transition-transform">
                    View Models &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-4xl mb-8">Top Rated Models</h2>
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Model</th>
                    <th className="py-4 px-6">Provider</th>
                    <th className="py-4 px-6">Context</th>
                    <th className="py-4 px-6">Modalities</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topModels.map((model) => (
                    <tr key={model.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="py-4 px-6 font-medium">
                        <Link href={`/models/${slugify(model.id)}`} className="group-hover:text-accentCyan transition-colors block">
                          {model.name}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="text-gray-400">{providers.find((p) => p.id === model.providerId)?.name || model.providerId}</span>
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-gray-300">
                        {formatContext(model.contextWindow)}
                      </td>
                      <td className="py-4 px-6">
                        <ModalityBadges modalities={model.modalities} />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={model.status} verified={model.verified} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
