export type Modality =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "reasoning"
  | "embedding"
  | "pdf"
  | "rerank";

export type ModelStatus = "online" | "offline" | "unknown";
export type TierType = "permanent" | "trial" | "credits";

export interface Provider {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKeyUrl: string;
  docsUrl?: string;
  tierType: TierType;
  creditCardRequired: boolean;
  phoneVerificationRequired: boolean;
  capabilities: Modality[];
  freeModelCount: number;
  onlineModelCount: number;
  notes?: string;
  lastSyncedAt: string;
}

export interface Model {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  contextWindow: number;
  maxOutputTokens?: number;
  modalities: Modality[];
  rateLimit?: string;
  score?: number;
  status: ModelStatus;
  verified: boolean;
  freeTier: boolean;
  noCreditCard: boolean;
  releasedAt?: string;
  lastVerifiedAt?: string;
  lastError?: string;
}

export interface LastSync {
  syncedAt: string;
  verifiedAt?: string;
  totalModels: number;
  onlineModels: number;
  verifiedModels: number;
  providerCount: number;
}

export interface RawModel {
  id: string;
  name?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  modalities?: Modality[];
  rateLimit?: string;
}

export interface VerifyResult {
  status: ModelStatus;
  verified: boolean;
  error?: string;
}

export interface ProviderAdapter {
  id: string;
  envKey: string;
  fetchModels: (apiKey: string) => Promise<RawModel[]>;
  verifyModel: (apiKey: string, modelId: string) => Promise<VerifyResult>;
}

export type CodingTool = "claude-code" | "cursor" | "codex" | "gemini-cli";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
