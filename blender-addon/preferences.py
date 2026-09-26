import bpy

class SculptorAddonPreferences(bpy.types.AddonPreferences):
    bl_idname = __package__.split('.')[0] if '.' in __package__ else "blender-addon"

    api_url: bpy.props.StringProperty(
        name="API URL",
        description="SculptorAI backend server URL",
        default="http://localhost:3000",
    )

    api_token: bpy.props.StringProperty(
        name="API Token",
        description="SculptorAI authentication session token or API key",
        default="",
        subtype='PASSWORD',
    )

    default_blender_version: bpy.props.StringProperty(
        name="Blender Target Version",
        description="Target Blender API version to request from AI",
        default="4.x",
    )

    def draw(self, context):
        layout = self.layout
        layout.label(text="SculptorAI Server & Connection Settings:")
        layout.prop(self, "api_url")
        layout.prop(self, "api_token")
        layout.prop(self, "default_blender_version")
