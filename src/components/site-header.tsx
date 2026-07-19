"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Layers, GitCompare, Settings, Terminal, Menu, X, Zap, BarChart2, Server, Key, Bot } from "lucide-react";

const navigation = [
  { name: "Models", href: "/models", icon: Cpu },
  { name: "Providers", href: "/providers", icon: Layers },
  { name: "Compare", href: "/compare", icon: GitCompare, protected: true },
  { name: "Config Generator", href: "/config", icon: Settings },
  { name: "Playground", href: "/playground", icon: Terminal, protected: true },
  { name: "Vault", href: "/settings", icon: Key, protected: true },
  { name: "Dashboard", href: "/dashboard", icon: BarChart2, protected: true },
  { name: "Gateway", href: "/gateway", icon: Server },
  { name: "Assistant", href: "/config-assistant", icon: Bot, protected: true },
];

interface SiteHeaderProps {
  lastSyncDate?: string;
  session?: any;
}

export default function SiteHeader({ lastSyncDate, session }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();



  const formattedDate = useMemo(() => {
    if (!lastSyncDate) return "";
    try {
      const date = new Date(lastSyncDate);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }, [lastSyncDate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel !rounded-none !shadow-none">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl transition-transform hover:scale-105">
              <Zap className="h-6 w-6 text-accentCyan fill-accentCyan animate-pulse" />
              <span className="tracking-tight text-gradient">
                ZeroLLM
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-8">
              {navigation.filter(item => !item.protected || session?.user).map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:text-accentCyan ${
                      isActive ? "text-accentCyan" : "text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            {/* Last synced date indicator */}
            {formattedDate && (
              <span className="hidden lg:flex items-center gap-2 text-[10px] text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-mono uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-accentCyan animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.8)]" />
                Refreshed: {formattedDate}
              </span>
            )}



            {/* Authentication UI */}
            {session?.user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-9 h-9 rounded-full border border-accentCyan/50" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm border border-white/20">
                    {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                  </div>
                )}
                <a href="/api/auth/signout" className="text-sm font-medium text-gray-400 hover:text-accentMagenta transition-colors hidden md:block">
                  Sign Out
                </a>
              </div>
            ) : (
              <a href="/sign-in" className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm">
                Sign In
              </a>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center xl:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-white/10 bg-void/90 backdrop-blur-xl px-6 pt-2 pb-6 space-y-2">
          {navigation.filter(item => !item.protected || session?.user).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-accentCyan"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
