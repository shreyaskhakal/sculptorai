/**
 * SCULPTOR AI — Realtime Server Broadcaster
 * Dispatches strongly-typed events to Supabase Realtime Broadcast channels with in-memory fallback.
 */

import { EventEmitter } from "events";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RealtimeChannels,
  RealtimeEventName,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  ExecutionProgressEvent,
  ExecutionCompletedEvent,
  SceneUpdatedEvent,
  BlenderHeartbeatEvent,
} from "@/types/realtime";

// In-memory bus for local testing and offline execution
export const localRealtimeBus = new EventEmitter();
localRealtimeBus.setMaxListeners(100);

export async function broadcastEvent<T>(
  channelName: string,
  event: RealtimeEventName,
  payload: T
): Promise<void> {
  // Always emit to local memory bus
  localRealtimeBus.emit(channelName, { event, payload });
  localRealtimeBus.emit("*", { channel: channelName, event, payload });

  // If live Supabase credentials exist, broadcast over Supabase Realtime channel
  const hasLiveSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

  if (hasLiveSupabase) {
    try {
      const admin = createAdminClient();
      const channel = admin.channel(channelName);
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (err) {
      console.warn(`[Realtime Broadcast Error] Channel: ${channelName}, Event: ${event}:`, err);
    }
  }
}

// -----------------------------------------------------------------------------
// Specialized Helper Dispatchers
// -----------------------------------------------------------------------------

export async function broadcastTaskCreated(task: TaskCreatedEvent): Promise<void> {
  await broadcastEvent(RealtimeChannels.project(task.projectId), "task.created", task);
}

export async function broadcastTaskUpdated(
  projectId: string,
  taskId: string,
  status: TaskUpdatedEvent["status"]
): Promise<void> {
  const payload: TaskUpdatedEvent = {
    taskId,
    projectId,
    status,
    updatedAt: new Date().toISOString(),
  };
  await broadcastEvent(RealtimeChannels.project(projectId), "task.updated", payload);
}

export async function broadcastExecutionProgress(progress: ExecutionProgressEvent): Promise<void> {
  await broadcastEvent(
    RealtimeChannels.execution(progress.executionId),
    "execution.progress",
    progress
  );
  await broadcastEvent(
    RealtimeChannels.project(progress.projectId),
    "execution.progress",
    progress
  );
}

export async function broadcastExecutionCompleted(completed: ExecutionCompletedEvent): Promise<void> {
  await broadcastEvent(
    RealtimeChannels.execution(completed.executionId),
    "execution.completed",
    completed
  );
  await broadcastEvent(
    RealtimeChannels.project(completed.projectId),
    "execution.completed",
    completed
  );
}

export async function broadcastSceneUpdated(scene: SceneUpdatedEvent): Promise<void> {
  await broadcastEvent(RealtimeChannels.project(scene.projectId), "scene.updated", scene);
}

export async function broadcastBlenderHeartbeat(heartbeat: BlenderHeartbeatEvent): Promise<void> {
  await broadcastEvent(
    RealtimeChannels.blender(heartbeat.deviceId),
    "blender.heartbeat",
    heartbeat
  );
  if (heartbeat.currentProjectId) {
    await broadcastEvent(
      RealtimeChannels.project(heartbeat.currentProjectId),
      "blender.heartbeat",
      heartbeat
    );
  }
}
