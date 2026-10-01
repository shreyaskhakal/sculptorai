# SculptorAI — Conversational Scene Intelligence & Patch System

## 1. Overview

Rather than regenerating entire Blender files from scratch for every conversation prompt, SculptorAI implements **Incremental Conversational 3D Editing**.

The workflow is:
```
ACTIVE BLENDER SCENE
       │
       ▼
Extract Compact Snapshot (Add-on)
       │
       ▼
Web Studio State (/api/blender/snapshot)
       │
       ▼
User Refinement Prompt ("Make the table legs 20% thinner")
       │
       ▼
Scene Editor AI (/api/ai/edit)
       │
       ▼
Structured ScenePatch + Surgical Python Script
       │
       ▼
AST Safety Validator & Visual Diff
       │
       ▼
Artist Approval & Blender Execution
```

---

## 2. Compact Scene Snapshot Format

Sent periodically or upon manual refresh by `SCULPTOR_OT_send_snapshot` in the Blender add-on:

```json
{
  "sceneName": "Scene",
  "blenderVersion": "4.2.0",
  "objects": [
    {
      "name": "Desk_Top",
      "type": "MESH",
      "location": [0.0, 0.0, 0.75],
      "rotation": [0.0, 0.0, 0.0],
      "scale": [1.0, 1.0, 1.0],
      "dimensions": [1.6, 0.8, 0.04],
      "materials": ["DarkWalnut"],
      "modifiers": ["Bevel"],
      "collection": "MasterDesk"
    },
    {
      "name": "Desk_Leg_01",
      "type": "MESH",
      "location": [-0.7, -0.35, 0.375],
      "dimensions": [0.05, 0.05, 0.75],
      "materials": ["MatteBlackMetal"],
      "collection": "MasterDesk"
    }
  ],
  "cameras": ["Camera"],
  "lights": ["KeyLight", "FillLight"],
  "collections": ["MasterDesk"],
  "activeObject": "Desk_Top",
  "selectedObjects": ["Desk_Top"]
}
```

---

## 3. Supported Patch Operations

The `ScenePatch` contract strictly supports 17 distinct granular operations:

- `create_object`: Spawns a new primitive or composite mesh.
- `modify_object`: Adjusts transforms, names, or general properties.
- `delete_object`: Safely purges an unused or temporary mesh.
- `duplicate_object`: Clones an existing geometry with offset.
- `rename_object`: Updates object identifier.
- `transform_object`: Precise translation, rotation (euler), or scale adjustments.
- `modify_mesh`: Geometry modifications (extrusions, cuts).
- `modify_material`: Tweaks Principled BSDF attributes (roughness, baseColor, metallic).
- `add_modifier`: Attaches modifier (e.g. `BEVEL`, `SUBSURF`, `BOOLEAN`, `MIRROR`).
- `remove_modifier`: Detaches modifier by name.
- `modify_modifier`: Updates modifier parameters (segments, width, angle).
- `create_collection`: Organizes scene hierarchy.
- `move_object`: Relocates object between collections.
- `create_light`: Spawns point/spot/sun/area lights with wattage and color.
- `modify_light`: Adjusts light intensity, radius, or color temperature.
- `create_camera`: Spawns focal-length calibrated cameras.
- `modify_camera`: Adjusts camera position, FOV, and clip distances.

---

## 4. Visual Code & Object Diff

Before any incremental change runs in Blender, the user reviews a visual diff in the Studio:
- **Monaco Code Diff**: Side-by-side script delta showing newly injected functions.
- **Object Diff Summary**: Badge matrix indicating:
  - `+ Added`: New objects created.
  - `- Removed`: Deprecated objects removed.
  - `~ Retained`: Preserved geometry and unchanged parameters.
