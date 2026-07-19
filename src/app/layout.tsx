import type { Metadata } from "next";
import { Instrument_Sans, Syne } from "next/font/google";

import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getLastSync } from "@/lib/data";
import { auth } from "../../auth";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free Models & Agents | AgentRadar",
  description: "Find free LLM APIs with context windows, limits, capabilities, and live health status.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lastSync = await getLastSync();
  const lastSyncDate = lastSync.syncedAt;
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${syne.variable} antialiased dark bg-void`}
    >
      <head>
      </head>
      <body className="min-h-screen flex flex-col bg-void text-white">
        <SiteHeader lastSyncDate={lastSyncDate} session={session} />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
