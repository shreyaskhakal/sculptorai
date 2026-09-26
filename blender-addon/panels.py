import bpy

class VIEW3D_PT_sculptor_ai(bpy.types.Panel):
    bl_label = "SculptorAI Copilot"
    bl_idname = "VIEW3D_PT_sculptor_ai"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'SculptorAI'

    def draw(self, context):
        layout = self.layout
        props = context.scene.sculptor_props

        # Header / Status Card
        box_header = layout.box()
        row_status = box_header.row(align=True)
        
        if "Connected" in props.last_status:
            row_status.label(text=f"● {props.last_status}", icon='CHECKMARK')
        elif "Error" in props.last_status or "Failed" in props.last_status:
            row_status.label(text=f"● {props.last_status}", icon='ERROR')
        elif props.is_busy:
            row_status.label(text=f"● {props.last_status}", icon='TIME')
        else:
            row_status.label(text=f"Status: {props.last_status}", icon='WORLD')

        row_status.operator("sculptor.test_connection", text="", icon='FILE_REFRESH')
        row_status.operator("sculptor.fetch_task", text="Sync Web Tasks", icon='IMPORT')

        # Prompt Input
        col_prompt = layout.column(align=True)
        col_prompt.label(text="Prompt:")
        col_prompt.prop(props, "prompt", text="")

        # Action: Generate
        row_gen = layout.row()
        row_gen.scale_y = 1.3
        row_gen.operator("sculptor.generate", text="Generate", icon='SHADERFX')

        # Plan Summary (if present)
        if props.plan_summary:
            box_plan = layout.box()
            box_plan.label(text="Modeling Plan:", icon='INFO')
            box_plan.label(text=props.plan_summary[:50] + "..." if len(props.plan_summary) > 50 else props.plan_summary)

        # Generated Code Preview
        if props.generated_code:
            layout.separator()
            box_code = layout.box()
            box_code.label(text="Generated Blender Python:", icon='TEXT')
            
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

        # Error State & Fix With AI
        if props.last_error:
            layout.separator()
            box_err = layout.box()
            box_err.alert = True
            box_err.label(text="✕ Blender Error Detected:", icon='CANCEL')
            
            err_lines = props.last_error.strip().split("\n")
            for line in err_lines[-3:]:
                box_err.label(text=line[:45])
                
            row_fix = box_err.row()
            row_fix.scale_y = 1.2
            row_fix.operator("sculptor.fix_error", text="Fix with AI", icon='TOOL_SETTINGS')

        # Quick reset button
        if props.generated_code or props.last_error:
            row_reset = layout.row()
            row_reset.operator("sculptor.clear", text="Clear", icon='TRASH')
