import { Provider, Model } from "./types";

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  generate: (provider: Provider, model: Model) => {
    instructions: string;
    code: string;
    filename?: string;
    lang: string;
  };
}

export const configTemplates: Record<string, ConfigTemplate> = {
  "claude-code": {
    id: "claude-code",
    name: "Claude Code CLI",
    description: "Configure Claude Code (anthropic-code) CLI to route through free models via OpenAI-compatible compatibility layers.",
    generate: (provider, model) => {
      const isGemini = provider.id === "gemini";
      const baseUrl = isGemini ? `${provider.baseUrl}/v1beta/openai` : provider.baseUrl;

      return {
        instructions: `Set the following environment variables in your terminal before running 'claude' CLI. Note that Claude Code requires an API key for authentication.`,
        code: `# For Linux/macOS (add to your ~/.bashrc or ~/.zshrc)
export ANTHROPIC_API_KEY="your_api_key_here"
export CLAUDE_BASE_URL="${baseUrl}"
export CLAUDE_MODEL="${model.modelId}"

# Now start Claude Code
claude`,
        filename: ".env",
        lang: "bash",
      };
    },
  },
  cursor: {
    id: "cursor",
    name: "Cursor IDE",
    description: "Add free API endpoints as custom OpenAI-compatible models directly inside Cursor settings.",
    generate: (provider, model) => {
      const isGemini = provider.id === "gemini";
      const keyUrl = provider.apiKeyUrl;
      const displayUrl = isGemini ? `${provider.baseUrl}/v1beta/openai` : provider.baseUrl;

      return {
        instructions: `1. Open Cursor Settings (Gear Icon) -> Models.
2. In 'OpenAI API' section, input your API key (obtained from ${keyUrl}).
3. Under 'Override OpenAI Base URL', enter:
   ${displayUrl}
4. Click 'Add Model' and register the model ID exactly:
   ${model.modelId}
5. Disable default models and select your newly added model in the chat panel.`,
        code: `{
  "openai.api_key": "YOUR_API_KEY",
  "openai.base_url": "${displayUrl}",
  "custom_model": "${model.modelId}"
}`,
        filename: "cursor-settings.json",
        lang: "json",
      };
    },
  },
  cline: {
    id: "cline",
    name: "Cline (VS Code)",
    description: "Configure the Cline (formerly Claude Dev) VS Code extension using OpenAI Compatible settings.",
    generate: (provider, model) => {
      const isGemini = provider.id === "gemini";
      const displayUrl = isGemini ? `${provider.baseUrl}/v1beta/openai` : provider.baseUrl;

      return {
        instructions: `Copy the JSON block below into your VS Code extension configurations, or input the parameters directly in the Cline Settings sidebar:
1. API Provider: Select "OpenAI Compatible"
2. Base URL: ${displayUrl}
3. API Key: Input your provider credential
4. Model ID: ${model.modelId}`,
        code: `{
  "apiProvider": "openai-compatible",
  "openAiBaseUrl": "${displayUrl}",
  "openAiModelId": "${model.modelId}",
  "apiKey": "YOUR_API_KEY",
  "openAiCustomModelInfo": {
    "name": "${model.name}",
    "contextWindow": ${model.contextWindow}
  }
}`,
        filename: "cline_config.json",
        lang: "json",
      };
    },
  },
  litellm: {
    id: "litellm",
    name: "LiteLLM Router",
    description: "Route requests to free providers using the LiteLLM proxy router.",
    generate: (provider, model) => {
      const isGemini = provider.id === "gemini";
      const litellmModel = isGemini
        ? `gemini/${model.modelId}`
        : `openai/${model.modelId}`;

      return {
        instructions: `Save the configuration as config.yaml and run 'litellm --config config.yaml'. This sets up a local proxy endpoint forwarding standard requests.`,
        code: `model_list:
  - model_name: free-${model.providerId}-${model.modelId.replace(/[:/]/g, "-")}
    litellm_params:
      model: ${litellmModel}
      api_base: ${provider.baseUrl}
      api_key: "os.environ/${provider.id.toUpperCase()}_API_KEY"
      rpm: 10`,
        filename: "config.yaml",
        lang: "yaml",
      };
    },
  },
};
