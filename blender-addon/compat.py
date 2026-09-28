import bpy

def get_blender_version_tuple():
    """Returns the current Blender version as a tuple (major, minor, patch)."""
    return bpy.app.version

def get_blender_version_string():
    """Returns formatted version string e.g. '4.2' or '3.6'."""
    return f"{bpy.app.version[0]}.{bpy.app.version[1]}"

def is_blender_4():
    """Returns True if running Blender 4.0 or newer."""
    return bpy.app.version[0] >= 4

def is_blender_3_6():
    """Returns True if running Blender 3.6 LTS series."""
    return bpy.app.version[0] == 3 and bpy.app.version[1] >= 6

def get_principled_socket_name(socket_type):
    """
    Handles naming changes in Principled BSDF between Blender 3.6 LTS and Blender 4.x.
    - Blender 3.6: 'Specular', 'Subsurface'
    - Blender 4.x: 'Specular IOR Level', 'Subsurface Weight'
    """
    if is_blender_4():
        mapping = {
            "specular": "Specular IOR Level",
            "subsurface": "Subsurface Weight",
            "transmission": "Transmission Weight",
            "coat": "Coat Weight",
            "sheen": "Sheen Weight",
        }
    else:
        mapping = {
            "specular": "Specular",
            "subsurface": "Subsurface",
            "transmission": "Transmission",
            "coat": "Coat",
            "sheen": "Sheen",
        }
    return mapping.get(socket_type.lower(), socket_type)

def safe_context_override(context, **kwargs):
    """
    Provides safe context overriding compatible with both Blender 3.6 and Blender 4.x.
    """
    if hasattr(context, "temp_override"):
        return context.temp_override(**kwargs)
    return nullcontext()

class nullcontext:
    def __enter__(self):
        return self
    def __exit__(self, *exc):
        return False
