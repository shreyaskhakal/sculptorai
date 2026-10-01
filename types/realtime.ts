/**
 * SCULPTOR AI — Realtime & Collaboration Shared Types
 * Strongly typed Supabase Realtime Broadcast and Presence event schemas.
 */

// -----------------------------------------------------------------------------
// Realtime Channel Name Helpers
// -----------------------------------------------------------------------------

export const RealtimeChannels = {
  project: (projectId: string) => `sculptor:project:${projectId}`,
  execution: (executionId: string) => `sculptor:execution:${executionId}`,
  blender: (deviceId: string) => `sculptor:blender:${deviceId}`,
  collaboration: (projectId: string) => `sculptor:collaboration:${projectId}`,
} as const;

// -----------------------------------------------------------------------------
// Realtime Event Names
// -----------------------------------------------------------------------------

export type RealtimeEventName =
  | "task.created"
  | "task.updated"
  | "task.cancelled"
  | "blender.connected"
  | "blender.disconnected"
  | "blender.heartbeat"
  | "execution.claimed"
  | "execution.started"
  | "execution.progress"
  | "execution.completed"
  | "execution.failed"
  | "scene.updated"
  | "scene.snapshot_created"
  | "collaboration.joined"
  | "collaboration.left"
  | "collaboration.cursor"
  | "collaboration.selection"
  | "template.published"
  | "template.updated"
  | "template.deleted";

// -----------------------------------------------------------------------------
// Realtime Event Payload Schemas
// -----------------------------------------------------------------------------

export interface TaskCreatedEvent {
  taskId: string;
  projectId: string;
  generationId?: string;
  blenderVersion: string;
  prompt: string;
  script: string;
  createdAt: string;
}

export interface TaskUpdatedEvent {
  taskId: string;
  projectId: string;
  status: "pending" | "claimed" | "running" | "success" | "failed" | "cancelled";
  updatedAt: string;
}

export interface BlenderHeartbeatEvent {
  deviceId: string;
  deviceName: string;
  blenderVersion: string;
  addonVersion: string;
  status: "CONNECTED" | "IDLE" | "BUSY" | "EXECUTING" | "ERROR" | "OFFLINE";
  currentProjectId?: string;
  currentExecutionId?: string;
  lastSeen: string;
}

export interface ExecutionProgressEvent {
  executionId: string;
  projectId: string;
  percent: number;
  stage: string;
  message?: string;
}

export interface ExecutionCompletedEvent {
  executionId: string;
  projectId: string;
  status: "success" | "failed";
  stdout: string;
  stderr: string;
  durationMs: number;
  completedAt: string;
}

export interface SceneUpdatedEvent {
  projectId: string;
  sceneName: string;
  activeObject?: string | null;
  objectsCount: number;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Collaboration Presence & Cursor Payloads
// -----------------------------------------------------------------------------

export interface CollaboratorPresence {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  activePanel: "chat" | "viewer" | "code" | "plan" | "diff";
  selectedObject?: string | null;
  lastActive: string;
}

export interface CursorPosition {
  userId: string;
  displayName: string;
  color: string;
  lineNumber: number;
  column: number;
  selectionEndLine?: number;
  selectionEndColumn?: number;
  timestamp: number;
}

export interface SelectionSyncEvent {
  userId: string;
  displayName: string;
  objectName: string | null;
  timestamp: number;
}
