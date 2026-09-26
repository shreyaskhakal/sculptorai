export const BLENDER_CLEANUP_SNIPPET = `
def clear_scene(remove_materials=False):
    """Safely clear active mesh objects from the scene without deleting cameras or lights."""
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')
    
    # Select mesh objects
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            
    # Delete selected
    bpy.ops.object.delete(use_global=False)
`;

export const BLENDER_MATERIAL_HELPER_SNIPPET = `
def create_principled_material(name, color_rgba=(0.8, 0.8, 0.8, 1.0), roughness=0.5, metallic=0.0):
    """Creates a modern Principled BSDF node material compatible with Blender 3.6 - 4.x+."""
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        # Compatible with Blender 3.x and 4.x
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color_rgba
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return mat
`;

export const BLENDER_COLLECTION_HELPER_SNIPPET = `
def get_or_create_collection(collection_name):
    """Ensures created assets are cleanly isolated in their own named Blender collection."""
    if collection_name in bpy.data.collections:
        return bpy.data.collections[collection_name]
    new_col = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(new_col)
    return new_col
`;
