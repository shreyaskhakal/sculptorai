bl_info = {
    "name": "SculptorAI Copilot",
    "author": "SculptorAI",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > SculptorAI",
    "description": "Your AI Copilot for Blender — Generate, understand, debug, and execute modeling scripts with explicit approval.",
    "warning": "",
    "doc_url": "https://github.com/shreyaskhakal/sculptorai",
    "category": "3D View",
}

import bpy
from . import preferences
from . import operators
from . import panels

classes = (
    preferences.SculptorAddonPreferences,
    operators.SculptorProperties,
    operators.SCULPTOR_OT_test_connection,
    operators.SCULPTOR_OT_generate,
    operators.SCULPTOR_OT_approve_and_run,
    operators.SCULPTOR_OT_fix_error,
    operators.SCULPTOR_OT_fetch_task,
    operators.SCULPTOR_OT_clear,
    operators.SCULPTOR_OT_send_snapshot,
    operators.SCULPTOR_OT_send_heartbeat,
    operators.SCULPTOR_OT_export_glb,
    operators.SCULPTOR_OT_toggle_realtime,
    panels.VIEW3D_PT_sculptor_ai,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.sculptor_props = bpy.props.PointerProperty(type=operators.SculptorProperties)
    
    # Register background heartbeat timer (every 20s)
    if hasattr(bpy.app, "timers") and not bpy.app.timers.is_registered(operators.sculptor_heartbeat_timer):
        bpy.app.timers.register(operators.sculptor_heartbeat_timer, first_interval=5.0)

def unregister():
    if hasattr(bpy.app, "timers") and bpy.app.timers.is_registered(operators.sculptor_heartbeat_timer):
        bpy.app.timers.unregister(operators.sculptor_heartbeat_timer)
    del bpy.types.Scene.sculptor_props
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()

