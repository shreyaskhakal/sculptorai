import type { ModelPlan, DebugDiagnosis } from "./ai";

export type BlenderVersion = "3.6" | "4.0" | "4.1" | "4.2" | "4.3" | "4.x" | string;

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  blenderVersion: BlenderVersion;
  createdAt: string;
  updatedAt: string;
  generationCount?: number;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageContent {
  text?: string;
  generationId?: string;
  analysisId?: string;
  debugId?: string;
  imageUrl?: string;
  meta?: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: MessageContent;
  createdAt: string;
}

export interface Generation {
  id: string;
  projectId: string;
  conversationId: string | null;
  userId: string;
  prompt: string;
  modelPlan: ModelPlan;
  code: string;
  blenderVersion: BlenderVersion;
  status: "pending" | "completed" | "failed";
  warnings: string[];
  createdAt: string;
}

export interface Execution {
  id: string;
  generationId: string;
  userId: string;
  status: "pending" | "running" | "success" | "error";
  stdout: string | null;
  stderr: string | null;
  durationMs: number | null;
  blenderVersion: BlenderVersion;
  createdAt: string;
  completedAt: string | null;
}

export interface DebugSession {
  id: string;
  generationId: string;
  userId: string;
  errorText: string;
  diagnosis: DebugDiagnosis;
  correctedCode: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  projectId: string;
  userId: string;
  storagePath: string;
  assetType: "reference_image" | "export" | "thumbnail";
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  signedUrl?: string;
}

export interface UsageEvent {
  id: string;
  userId: string;
  eventType: "generate" | "analyze_image" | "debug" | "execute";
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Re-export AI types for convenience
export * from "./ai";
