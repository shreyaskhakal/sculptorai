import bpy

def get_preferences(context=None):
    if context is None:
        context = bpy.context
    candidates = []
    if __package__:
        candidates.append(__package__.split('.')[0])
        candidates.append(__package__)
    candidates.extend(["blender-addon", "blender_addon", "sculptorai"])
    for name in candidates:
        addon = context.preferences.addons.get(name)
        if addon and addon.preferences:
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
