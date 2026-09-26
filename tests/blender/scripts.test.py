"""
Blender Python Syntax and Structural Test Suite
Verifies that all core Blender code generation snippets compile cleanly without syntax errors.
"""
import sys

# Ensure UTF-8 output if supported
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

TEST_SCRIPTS = {
    "create_cube": """
import bpy
bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0, 0, 1.0))
""",
    "move_cube": """
import bpy
obj = bpy.context.active_object
if obj:
    obj.location.x += 2.0
""",
    "create_material": """
import bpy
mat = bpy.data.materials.new(name="PBR_Material")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf and "Base Color" in bsdf.inputs:
    bsdf.inputs["Base Color"].default_value = (0.8, 0.2, 0.1, 1.0)
""",
    "create_sphere": """
import bpy
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.5, location=(0, 3.0, 1.5))
""",
    "create_camera": """
import bpy
bpy.ops.object.camera_add(location=(5.0, -5.0, 3.5), rotation=(1.1, 0, 0.78))
cam = bpy.context.active_object
cam.data.lens = 50
""",
    "create_light": """
import bpy
bpy.ops.object.light_add(type='AREA', location=(3.0, -2.0, 4.0))
light = bpy.context.active_object
light.data.energy = 500
"""
}

def run_tests():
    print("> Testing Blender Python Script Snippets...")
    for name, code in TEST_SCRIPTS.items():
        try:
            compile(code, f"<{name}>", "exec")
            print(f"  + Script '{name}' compiled cleanly")
        except SyntaxError as e:
            print(f"  - SyntaxError in '{name}': {e}")
            raise

    print("All Blender Python test scripts compiled successfully!\n")

if __name__ == "__main__":
    run_tests()
