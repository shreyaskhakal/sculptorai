# SculptorAI — Realtime Communication Architecture

## Overview

SculptorAI utilizes a hybrid event transport model with PostgreSQL as the authoritative source of truth and Supabase Realtime (Broadcast and Presence) coupled with Server-Sent Events (SSE) for low-latency live synchronization between the Next.js web application, multi-user project collaborators, and the Blender Python add-on.

```text
               PostgreSQL (Supabase)
                         |
           [Durable Transactions & RLS]
                         |
                 Supabase Realtime
            (Broadcast & Presence Roster)
                         |
        +----------------+----------------+
        |                                 |
     Web App                       Blender Add-on
(Monaco Editor &                   (Streaming Worker &
 3D WebGL Canvas)                   Idempotent Executor)
```

---

## Channel Topology

All Realtime channels follow a standardized namespace convention:

| Channel Pattern | Scope | Purpose |
| :--- | :--- | :--- |
| `sculptor:project:{projectId}` | Project Room | Dispatches `task.created`, `task.updated`, `execution.progress`, `execution.completed`, `scene.updated` |
| `sculptor:collaboration:{projectId}` | Presence Roster | Tracks active users, avatars, active panels, live 50ms throttled cursor broadcasts, and 3D object selections |
| `sculptor:blender:{deviceId}` | Device Pipeline | Dedicated device telemetry, heartbeat checks, and error reporting |

---

## Event Schema Specification

Events are strongly typed in `types/realtime.ts` and validated prior to dispatch:

1. **`task.created`**: Broadcast when a user approves code or applies a template. Includes `taskId`, `projectId`, `script`, `prompt`, `blenderVersion`.
2. **`execution.progress`**: Sent during task execution in Blender. Contains `percent` (0-100) and `stage` (e.g. "Generating Bevel Vertices").
3. **`execution.completed`**: Sent on execution conclusion with `status` (`success` | `failed`), `stdout`, `stderr`, and `durationMs`.
4. **`blender.heartbeat`**: Periodic ping from Blender add-on every 5 seconds. Reports `deviceId`, `blenderVersion`, and `status` (`IDLE` | `BUSY` | `EXECUTING`).
5. **`collaboration.cursor`**: Live position `{ line, column }` throttled to 50ms intervals.
6. **`collaboration.selection`**: Synchronizes selected 3D mesh object across all connected user viewports.

---

## Fault Tolerance & HTTP Fallback

If WebSocket or SSE streaming disconnects:
1. The web UI displays `🟡 Reconnecting` or `🔴 Offline` status badge.
2. The Blender add-on immediately falls back to poll HTTP `GET /api/executions/claim-next?projectId={id}` every 2 seconds.
3. Once the stream reconnects, it resumes zero-latency event streaming.
4. **Idempotency Protection**: `SculptorRealtimeClient.has_executed_task()` tracks executed task IDs to prevent duplicate execution when network packets repeat.
