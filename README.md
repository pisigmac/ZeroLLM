# ZeroLLM

ZeroLLM is an open-source directory, index, and health status dashboard for free Large Language Model (LLM) API providers. The project helps developers easily find, compare, and connect to free LLMs available across the web.

## Features

- **Models Directory**: Browse over 100+ free LLMs across multiple providers. Filter by modalities, status, and whether a credit card is required.
- **Providers Directory**: View and compare free tier limits, capabilities, and friction points across LLM API providers (e.g., Groq, OpenRouter, Google, Cohere, HuggingFace).
- **Compare Models**: Select up to 6 models side-by-side to compare context windows, output limits, rate limits, and capabilities.
- **Config Generator**: Generate drop-in configuration snippets for popular coding assistants and CLI tools like Cursor, Claude Code, and Codex.
- **Playground**: Test models instantly from the browser through a secure, non-logging local proxy server.
- **Automated Health Checks**: Daily cron jobs ping models to ensure they are online and responding correctly, automatically updating their statuses.

## Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Layer**: Flat JSON structure updated automatically via sync scripts.
- **Pipeline**: Daily sync and health checks powered by GitHub Actions.

## Getting Started

### Automated Installation (Recommended)

The easiest way to install and run ZeroLLM is by using the automated installation script. It will clone the repository, install dependencies, set up the environment, and create a global `zerollm` command.

Run the following command in your terminal:
```bash
curl -fsSL https://raw.githubusercontent.com/pisigmac/ZeroLLM/main/install.sh | bash
```

Once installed, you can start the dashboard from anywhere by running:
```bash
zerollm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.

To update to the latest version in the future, simply run:
```bash
zerollm update
```

### Manual Installation

If you prefer to set up the project manually:

#### 1. Clone & Install dependencies

```bash
git clone https://github.com/pisigmac/ZeroLLM.git
cd ZeroLLM
pnpm install
```

#### 2. Configure Environment Variables

Copy the example environment file and fill in any API keys you wish to use for the automated synchronization scripts.

```bash
cp .env.example .env.local
```

#### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.

## Data Synchronization & Verification

The project includes two CLI scripts to maintain the accuracy of the models list and their health statuses.

- **Sync Provider Data**: `pnpm sync`
  Fetches the latest models from provider APIs and normalizes them into the local JSON data store.
- **Verify Model Health**: `pnpm verify`
  Pings all tracked models with a minimal 5-token request to verify they are online and functioning.

These scripts run automatically via GitHub Actions in production.

## License

This project is licensed under the MIT License.
