# SculptorAI — Blender Add-on Setup & Bridge Guide

## 1. Prerequisites
- **Blender**: Version 4.x (Recommended: 4.2 LTS / 4.1) or Blender 3.6 LTS.
- **Python**: Bundled Python 3.10 / 3.11 with `requests` library.
- **SculptorAI Add-on**: `blender-addon.zip` (located in repository root).

---

## 2. Installation Steps

1. Open Blender.
2. Navigate to **Edit** → **Preferences** → **Add-ons**.
3. In the top right corner, click the **arrow dropdown** (or **Install from Disk...** in Blender 4.2+).
4. Select `blender-addon.zip` from your SculptorAI folder and click **Install Add-on**.
5. Enable the checkbox next to **3D View: SculptorAI Bridge**.

---

## 3. Configuration

In the 3D Viewport:
1. Press `N` to open the sidebar.
2. Click the **SculptorAI** tab.
3. Configure connection settings:
   - **API URL**: `http://localhost:3000` (or your deployed production URL, e.g., `https://sculptor.ai`).
   - **API Token**: Enter your personal project token or session bearer key.
   - **Project ID**: The ID of the project you are working on (from the studio URL `/projects/[id]`).
4. Click **Connect to Studio**.

---

## 4. Operational Features & Heartbeat

- **Automatic Heartbeat Timer**: Every 20 seconds, the add-on runs `sculptor_heartbeat_timer()` sending:
  - Addon version (`1.1.0`)
  - Blender version (`4.x` / `3.6 LTS`)
  - Active device hostname
  - Execution state (`IDLE`, `EXECUTING`, `ERROR`)
  - Active project ID
- **Send Scene Snapshot**: Clicking **Send Scene Snapshot** scans all mesh objects, lights, cameras, and collections, sending a compact JSON summary to `/api/blender/snapshot`.
- **Export & Sync GLB**: Automatically exports the active scene into a GLB binary and uploads it for the Three.js Web Viewer.
- **Task Claim & Approval**:
  - The add-on polls `/api/executions/claim-next` for tasks assigned to the active project.
  - When a task arrives, the script is displayed in the panel with a **Safety Summary**.
  - Clicking **Approve & Run** executes the code inside Blender's safe execution context, capturing `stdout`, `stderr`, and execution time.
  - Results are immediately posted back to `/api/executions/[id]/result`.
