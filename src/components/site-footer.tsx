import Link from "next/link";
import { Zap } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-void/50 backdrop-blur-xl py-12 md:py-16 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-accentCyan fill-accentCyan animate-pulse shadow-[0_0_12px_rgba(0,242,254,0.6)]" />
            <span className="font-display font-bold text-xl tracking-tight text-gradient">
              AgentRadar
            </span>
            <span className="text-gray-500 font-mono text-xs border border-white/10 px-2 py-0.5 rounded-full ml-2">v1.0.0</span>
          </div>

          <p className="text-sm text-gray-400 text-center md:text-left max-w-md font-light leading-relaxed">
            An index and health check status dashboard for free LLM API providers. We do not host or operate any models listed here.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <Link
              href="/models"
              className="text-sm font-medium text-gray-400 hover:text-accentCyan transition-colors"
            >
              Models Directory
            </Link>
            <Link
              href="/playground"
              className="text-sm font-medium text-gray-400 hover:text-accentCyan transition-colors"
            >
              Playground
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-400 hover:text-accentCyan transition-colors"
            >
              Keys Vault
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-400 hover:text-accentCyan transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/gateway"
              className="text-sm font-medium text-gray-400 hover:text-accentCyan transition-colors"
            >
              Gateway
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-mono">
            &copy; {new Date().getFullYear()} AgentRadar. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accentCyan animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.8)]" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
