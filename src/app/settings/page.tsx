import { getProviders } from "@/lib/data";
import SettingsWorkspace from "@/components/settings-workspace";

export const metadata = {
  title: "API Keys Vault | AgentRadar",
  description: "Securely manage and verify your custom provider API keys locally.",
};

export default async function SettingsPage() {
  const providers = await getProviders();
  // Filter out providers that do not require an API key (like Ollama if it is client-only, but let's list it anyway)
  return <SettingsWorkspace providers={providers} />;
}
