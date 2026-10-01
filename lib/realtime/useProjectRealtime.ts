"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  RealtimeChannels,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  ExecutionProgressEvent,
  ExecutionCompletedEvent,
  BlenderHeartbeatEvent,
  SceneUpdatedEvent,
  CollaboratorPresence,
  CursorPosition,
  SelectionSyncEvent,
} from "@/types/realtime";

export interface UseProjectRealtimeProps {
  projectId: string;
  currentUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "owner" | "editor" | "commenter" | "viewer";
  };
  onTaskCreated?: (event: TaskCreatedEvent) => void;
  onTaskUpdated?: (event: TaskUpdatedEvent) => void;
  onExecutionProgress?: (event: ExecutionProgressEvent) => void;
  onExecutionCompleted?: (event: ExecutionCompletedEvent) => void;
  onBlenderHeartbeat?: (event: BlenderHeartbeatEvent) => void;
  onSceneUpdated?: (event: SceneUpdatedEvent) => void;
  onRemoteCursor?: (cursor: CursorPosition) => void;
  onRemoteSelection?: (selection: SelectionSyncEvent) => void;
}

export function useProjectRealtime({
  projectId,
  currentUser,
  onTaskCreated,
  onTaskUpdated,
  onExecutionProgress,
  onExecutionCompleted,
  onBlenderHeartbeat,
  onSceneUpdated,
  onRemoteCursor,
  onRemoteSelection,
}: UseProjectRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const channelRef = useRef<any>(null);
  const collabChannelRef = useRef<any>(null);
  const lastCursorSendRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();
    const projectChannelName = RealtimeChannels.project(projectId);
    const collabChannelName = RealtimeChannels.collaboration(projectId);

    // 1. Subscribe to Project Events Channel
    const projectChannel = supabase
      .channel(projectChannelName)
      .on("broadcast", { event: "task.created" }, (payload: any) => {
        onTaskCreated?.(payload.payload as TaskCreatedEvent);
      })
      .on("broadcast", { event: "task.updated" }, (payload: any) => {
        onTaskUpdated?.(payload.payload as TaskUpdatedEvent);
      })
      .on("broadcast", { event: "execution.progress" }, (payload: any) => {
        onExecutionProgress?.(payload.payload as ExecutionProgressEvent);
      })
      .on("broadcast", { event: "execution.completed" }, (payload: any) => {
        onExecutionCompleted?.(payload.payload as ExecutionCompletedEvent);
      })
      .on("broadcast", { event: "blender.heartbeat" }, (payload: any) => {
        onBlenderHeartbeat?.(payload.payload as BlenderHeartbeatEvent);
      })
      .on("broadcast", { event: "scene.updated" }, (payload: any) => {
        onSceneUpdated?.(payload.payload as SceneUpdatedEvent);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    channelRef.current = projectChannel;

    // 2. Subscribe to Collaboration & Presence Channel
    const collabChannel = supabase
      .channel(collabChannelName)
      .on("broadcast", { event: "collaboration.cursor" }, (payload: any) => {
        const cursor = payload.payload as CursorPosition;
        if (cursor.userId !== currentUser?.id) {
          onRemoteCursor?.(cursor);
        }
      })
      .on("broadcast", { event: "collaboration.selection" }, (payload: any) => {
        const sel = payload.payload as SelectionSyncEvent;
        if (sel.userId !== currentUser?.id) {
          onRemoteSelection?.(sel);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = collabChannel.presenceState();
        const activeUsers: CollaboratorPresence[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            activeUsers.push(presences[0] as CollaboratorPresence);
          }
        }
        setCollaborators(activeUsers);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED" && currentUser) {
          const initialPresence: CollaboratorPresence = {
            userId: currentUser.id,
            displayName: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            role: currentUser.role,
            activePanel: "viewer",
            lastActive: new Date().toISOString(),
          };
          await collabChannel.track(initialPresence);
        }
      });

    collabChannelRef.current = collabChannel;

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(collabChannel);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    currentUser?.id,
    onTaskCreated,
    onTaskUpdated,
    onExecutionProgress,
    onExecutionCompleted,
    onBlenderHeartbeat,
    onSceneUpdated,
    onRemoteCursor,
    onRemoteSelection,
  ]);

  // Broadcast throttled cursor updates (max 20 per second = 50ms throttle)
  const broadcastCursor = useCallback(
    (lineNumber: number, column: number, selectionEndLine?: number, selectionEndColumn?: number) => {
      if (!collabChannelRef.current || !currentUser) return;
      const now = Date.now();
      if (now - lastCursorSendRef.current < 50) return;
      lastCursorSendRef.current = now;

      const cursor: CursorPosition = {
        userId: currentUser.id,
        displayName: currentUser.name,
        color: "#F5792A",
        lineNumber,
        column,
        selectionEndLine,
        selectionEndColumn,
        timestamp: now,
      };

      collabChannelRef.current.send({
        type: "broadcast",
        event: "collaboration.cursor",
        payload: cursor,
      });
    },
    [currentUser]
  );

  // Broadcast 3D object selection
  const broadcastSelection = useCallback(
    (objectName: string | null) => {
      if (!collabChannelRef.current || !currentUser) return;

      const sel: SelectionSyncEvent = {
        userId: currentUser.id,
        displayName: currentUser.name,
        objectName,
        timestamp: Date.now(),
      };

      collabChannelRef.current.send({
        type: "broadcast",
        event: "collaboration.selection",
        payload: sel,
      });
    },
    [currentUser]
  );

  // Update presence status (e.g. active panel)
  const updatePresence = useCallback(
    async (patch: Partial<CollaboratorPresence>) => {
      if (!collabChannelRef.current || !currentUser) return;
      const updated: CollaboratorPresence = {
        userId: currentUser.id,
        displayName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        role: currentUser.role,
        activePanel: patch.activePanel || "viewer",
        selectedObject: patch.selectedObject,
        lastActive: new Date().toISOString(),
      };
      await collabChannelRef.current.track(updated);
    },
    [currentUser]
  );

  return {
    isConnected,
    collaborators,
    broadcastCursor,
    broadcastSelection,
    updatePresence,
  };
}
