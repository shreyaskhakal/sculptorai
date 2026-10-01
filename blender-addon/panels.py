import bpy
from .compat import get_blender_version_string

class VIEW3D_PT_sculptor_ai(bpy.types.Panel):
    bl_label = "SculptorAI Copilot"
    bl_idname = "VIEW3D_PT_sculptor_ai"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'SculptorAI'

    def draw(self, context):
        layout = self.layout
        props = context.scene.sculptor_props

        # 1. Connection & Live Heartbeat Header Card
        box_header = layout.box()
        row_conn = box_header.row(align=True)

        if "Connected" in props.last_status:
            row_conn.label(text="🟢 Connected", icon='NONE')
        elif props.is_busy or "Executing" in props.last_status:
            row_conn.label(text="⚡ Executing", icon='NONE')
        elif "Error" in props.last_status or "Failed" in props.last_status:
            row_conn.label(text="🔴 Error", icon='NONE')
        else:
            row_conn.label(text="⚪ Idle", icon='NONE')

        row_conn.operator("sculptor.send_heartbeat", text="", icon='RADIOBUT_ON')
        row_conn.operator("sculptor.test_connection", text="", icon='FILE_REFRESH')

        # Project & Task Context
        col_ctx = box_header.column(align=True)
        col_ctx.prop(props, "active_project_id", text="Project")
        if props.plan_summary:
            col_ctx.label(text=f"Task: {props.plan_summary[:38]}...", icon='CHECKBOX_HLT')
        else:
            col_ctx.label(text="Task: None Active", icon='CHECKBOX_DEHLT')

        # Realtime Stream & Fallback Status
        row_rt = box_header.row(align=True)
        if props.realtime_status == "CONNECTED":
            row_rt.label(text="⚡ Stream: Active", icon='NONE')
        elif props.realtime_status == "RECONNECTING":
            row_rt.label(text="🟡 Stream: Reconnecting", icon='NONE')
        else:
            row_rt.label(text="○ Stream: Polling Mode", icon='NONE')
        row_rt.operator("sculptor.toggle_realtime", text="Stream", icon='RADIOBUT_ON' if props.realtime_status == 'CONNECTED' else 'RADIOBUT_OFF')

        if props.execution_progress > 0 and props.execution_progress < 100:
            box_header.prop(props, "execution_progress", text="Progress", slider=True)

        # 2. Web Sync & Scene Intelligence Actions
        row_sync = layout.row(align=True)
        row_sync.operator("sculptor.fetch_task", text="Sync Tasks", icon='IMPORT')
        row_sync.operator("sculptor.send_snapshot", text="Snapshot Scene", icon='OUTLINER')
        row_sync.operator("sculptor.export_glb", text="Export 3D Preview", icon='EXPORT')

        # 3. Prompt Input
        layout.separator()
        col_prompt = layout.column(align=True)
        col_prompt.label(text="Natural Language Instruction:")
        col_prompt.prop(props, "prompt", text="")

        # Action: Generate
        row_gen = layout.row()
        row_gen.scale_y = 1.3
        row_gen.operator("sculptor.generate", text="Generate with AI", icon='SHADERFX')

        # 4. Plan Summary (if present)
        if props.plan_summary:
            box_plan = layout.box()
            box_plan.label(text="Modeling Plan:", icon='INFO')
            box_plan.label(text=props.plan_summary[:50] + "..." if len(props.plan_summary) > 50 else props.plan_summary)

        # 5. Generated Code Preview & Human Approval
        if props.generated_code:
            layout.separator()
            box_code = layout.box()
            box_code.label(text="Generated Blender Python (Ready for Approval):", icon='TEXT')
            
            # Show preview lines
            code_lines = props.generated_code.strip().split("\n")
            preview_lines = code_lines[:8]
            for line in preview_lines:
                box_code.label(text=line[:42])
            if len(code_lines) > 8:
                box_code.label(text=f"... (+{len(code_lines) - 8} more lines)")

            # Explicit User Approval Button
            layout.separator()
            row_run = layout.row()
            row_run.scale_y = 1.5
            row_run.alert = True
            row_run.operator("sculptor.approve_and_run", text="Approve & Run in Blender", icon='PLAY')

        # 6. Error State & AI Self-Repair
        if props.last_error:
            layout.separator()
            box_err = layout.box()
            box_err.alert = True
            box_err.label(text="✕ Blender Error Detected:", icon='CANCEL')
            
            err_lines = props.last_error.strip().split("\n")
            for line in err_lines[-3:]:
                box_err.label(text=line[:45])
                
            row_fix = box_err.row()
            row_fix.scale_y = 1.3
            row_fix.operator("sculptor.fix_error", text="Fix with AI", icon='TOOL_SETTINGS')

        # 7. Reset and Metadata Footer
        layout.separator()
        row_foot = layout.row(align=True)
        if props.generated_code or props.last_error:
            row_foot.operator("sculptor.clear", text="Reset", icon='TRASH')
        row_foot.label(text=f"Blender {get_blender_version_string()} | SculptorAI v1.1.0")

