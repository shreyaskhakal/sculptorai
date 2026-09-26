import bpy

def get_preferences(context=None):
    if context is None:
        context = bpy.context
    addon_name = __package__.split('.')[0] if '.' in __package__ else "blender-addon"
    addon = context.preferences.addons.get(addon_name)
    if addon:
        return addon.preferences
    return None

def get_api_url(context=None):
    prefs = get_preferences(context)
    if prefs and prefs.api_url:
        return prefs.api_url.rstrip('/')
    return "http://localhost:3000"

def get_auth_headers(context=None):
    prefs = get_preferences(context)
    headers = {
        "Content-Type": "application/json",
        "User-Agent": f"Blender-SculptorAI/{bpy.app.version_string}",
    }
    if prefs and prefs.api_token:
        headers["Authorization"] = f"Bearer {prefs.api_token}"
    return headers
