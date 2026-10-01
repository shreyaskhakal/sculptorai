# SculptorAI — Troubleshooting & Diagnostics Guide

## 1. Blender Bridge & Connection Issues

### Symptom: Dashboard shows "Blender Offline"
- **Cause 1**: Add-on is not installed or enabled in Blender.
  - *Fix*: Go to **Edit** → **Preferences** → **Add-ons** and ensure **3D View: SculptorAI Bridge** is checked.
- **Cause 2**: URL or Project ID mismatch.
  - *Fix*: In Blender's SculptorAI panel (`N` key in 3D Viewport), ensure **API URL** matches your server (e.g. `http://localhost:3000`) and the **Project ID** matches the current URL.
- **Cause 3**: Firewall blocking outbound requests from Blender's embedded Python.
  - *Fix*: Allow local loopback traffic on port 3000.

---

## 2. Execution Errors & Traceback Debugging

### Symptom: Execution Task fails with `Operator poll() failed`
- **Cause**: Blender operators like `bpy.ops.mesh.bevel()` require an active mesh selection in `EDIT` or `OBJECT` mode.
- **Fix**: Click **Fix with AI** in the Studio or Blender panel. The AI Debugger (`/api/debug`) analyzes the traceback and adds safe context checks:
  ```python
  if bpy.context.active_object and bpy.context.active_object.type == 'MESH':
      bpy.ops.object.mode_set(mode='OBJECT')
  ```

---

## 3. WebGL 3D Viewer Issues

### Symptom: Black screen or WebGL context loss
- **Cause**: Hardware acceleration disabled or outdated browser graphics driver.
- **Fix**:
  - In Chrome/Firefox, navigate to `chrome://settings/system` and toggle **Use graphics acceleration when available**.
  - Click the **Reset View** icon in the viewer controls toolbar.
