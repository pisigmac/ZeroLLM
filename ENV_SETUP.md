# Environment Setup Guide

Here is a step-by-step guide on how to get every single environment variable required for your project to run in production.

There are two categories of variables you need: **Model Provider Keys** (for your automated data syncing) and **Application & Auth Secrets** (for logging users in securely).

## Part 1: Model Provider API Keys (For `pnpm sync`)

These are used by your backend chron script to fetch the latest model lists and verify uptime. You need to create a free account for each and generate an API key.

1.  **`GROQ_API_KEY`**: Go to [Groq Console](https://console.groq.com/keys) -> Create API Key.
2.  **`OPENROUTER_API_KEY`**: Go to [OpenRouter Keys](https://openrouter.ai/keys) -> Create Key. *(Note: You don't need credits; fetching the models list is free).*
3.  **`GOOGLE_API_KEY`**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) -> Get API key -> Create API key.
4.  **`MISTRAL_API_KEY`**: Go to [Mistral Console](https://console.mistral.ai/api-keys/) -> Create new key.
5.  **`COHERE_API_KEY`**: Go to [Cohere Dashboard](https://dashboard.cohere.com/api-keys) -> Create API key.
6.  **`CEREBRAS_API_KEY`**: Go to [Cerebras Cloud](https://cloud.cerebras.ai/platform/) -> API Keys -> Create API Key.
7.  **`NVIDIA_API_KEY`**: Go to [NVIDIA NIM](https://build.nvidia.com/) -> Select any model -> Click "Get API Key" -> Generate Key.
8.  **`HUGGINGFACE_API_KEY`**: Go to [Hugging Face Settings](https://huggingface.co/settings/tokens) -> Access Tokens -> Create a new "Read" token.
9.  **`GITHUB_TOKEN`**: Go to [GitHub Tokens](https://github.com/settings/tokens) -> Generate new token (classic). You don't need to select any special scopes, the default public access is fine for fetching GitHub's free models list.

## Part 2: Application Secrets (For Next.js & Vercel)

These are required to secure your frontend application and cron jobs.

1.  **`CRON_SECRET`**: This is just a random password you invent to ensure random people on the internet can't trigger your sync scripts.
    *   **How to get it:** Open your terminal and run `openssl rand -base64 32`, or just type a long, random string like `super_secret_cron_trigger_123!`.
2.  **`AUTH_SECRET`**: This encrypts user login sessions for Next-Auth.
    *   **How to get it:** Run `npx auth secret` in your terminal, or generate another random string using `openssl rand -base64 32`.

## Part 3: Authentication Variables (Next-Auth)

Because your `auth.ts` file supports signing in with Google and GitHub, you need OAuth credentials for both.

### GitHub Login:
1.  Go to your [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click **OAuth Apps** -> **New OAuth App**.
3.  Fill it out:
    *   **Application name:** AgentRadar
    *   **Homepage URL:** `https://agentradar.in`
    *   **Authorization callback URL:** `https://agentradar.in/api/auth/callback/github`
4.  Register the application.
5.  Copy the **Client ID** — this is your `AUTH_GITHUB_ID`.
6.  Click "Generate a new client secret" and copy it — this is your `AUTH_GITHUB_SECRET`.

### Google Login:
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new Project (name it "AgentRadar").
3.  Go to **APIs & Services** -> **OAuth consent screen** and set it to External, fill out the basic names/emails, and save.
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
5.  Select **Web application**.
6.  Under "Authorized redirect URIs", add: `https://agentradar.in/api/auth/callback/google`
7.  Click Create. You will get a popup with your Client ID and Client Secret.
8.  Use these for your `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

## Final Step

Once you have collected all these strings, go to your **Vercel Dashboard**, open your project, click **Settings**, and go to **Environment Variables**. Paste them all in there, hit Save, and redeploy your app!
