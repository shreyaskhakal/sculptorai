# SculptorAI — Blender Streaming & Add-on Integration

## Overview

The SculptorAI Blender add-on connects directly to the platform via an asynchronous background event stream (`/api/blender/stream`), eliminating the latency of standard polling while retaining automatic HTTP fallback.

---

## Add-on Architecture

```text
       blender-addon/
       ├── __init__.py           # Registration & preferences
       ├── api_client.py         # HTTP fallback & task claiming
       ├── realtime_client.py    # Background streaming thread & event dispatcher
       ├── operators.py          # Claim, Approve, Execute, and Reconnect operators
       ├── panels.py             # 3D Viewport N-Panel UI & live status indicator
       └── preview_exporter.py   # GLB 3D scene exporter
```

---

## Connection Lifecycle

1. **Authentication**: Uses API Key (`sculptor_live_...`) configured in Blender Preferences -> Add-ons -> SculptorAI.
2. **Stream Connection**: Spawns a non-blocking daemon thread using Python standard library `urllib.request` that connects to:
   ```text
   GET /api/blender/stream?projectId={projectId}&deviceId={deviceId}
   ```
3. **Heartbeat Broadcast**: Every 5 seconds, reports workstation status (`IDLE`, `EXECUTING`, `BUSY`) to `/api/blender/heartbeat`.
4. **Task Reception**: When a task event is parsed from the stream, it is queued for main-thread execution via Blender's timer handler (`bpy.app.timers`).
5. **Human Approval**: The user reviews the Python code inside Blender's SculptorAI panel and clicks "Approve & Run".
6. **Live Progress**: As long-running procedural geometry generates, progress reports (0-100%) are sent to `/api/executions/{id}/progress`.
7. **Atomic Claim & Result**: Results (`stdout`, `stderr`, execution duration) are POSTed to `/api/executions/{id}/result`.
8. **Automatic HTTP Fallback**: If the SSE stream drops, the add-on automatically activates timer-based HTTP polling every 2 seconds until the stream reconnects.
