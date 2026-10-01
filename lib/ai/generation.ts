import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelPlanInput, ModelPlan, GeneratedCode } from "../../types/ai";
import { SYSTEM_PROMPT_BLENDER_ARCHITECT } from "./prompts";
import { ModelPlanSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";
import { validateBlenderScript } from "../blender/validator";

export async function generateModelPlanWithAI(
  input: ModelPlanInput,
  apiKey?: string
): Promise<{ plan: ModelPlan; code: GeneratedCode; warnings: string[] }> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    return generateFallbackPlan(input);
  }

  const blenderVer = input.blenderVersion || "4.x";
  const style = input.style || "low-poly";
  const complexity = input.complexity || "medium";

  try {
    const genAI = new GoogleGenerativeAI(key);
    const modelName = selectModelForTask("generation", complexity);

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      systemInstruction: SYSTEM_PROMPT_BLENDER_ARCHITECT,
    });

    const promptText = `
Request: "${input.prompt}"
Target Blender Version: ${blenderVer}
Target Style: ${style}
Target Complexity: ${complexity}
${
  input.previousCode
    ? `Existing Scene Script to Modify:
\`\`\`python
${input.previousCode}
\`\`\`
CRITICAL INSTRUCTION: The user is requesting a modification or refinement to the scene above. Retain established objects and collections, and surgically apply requested geometric, material, scale, or lighting changes.`
    : ""
}
${input.context ? `Additional Scene Context: ${input.context}` : ""}
${input.sceneSnapshot ? `Active Scene Snapshot: ${JSON.stringify(input.sceneSnapshot)}` : ""}

Generate the complete JSON modeling plan and executable Blender Python (bpy).
`;

    const validated = await executeWithRetry(async () => {
      const res = await model.generateContent(promptText);
      const text = res.response.text();
      return parseAndValidateJson(text, ModelPlanSchema);
    });

    const codeValidation = validateBlenderScript(validated.blenderCode);

    const combinedWarnings = [
      ...validated.warnings,
      ...codeValidation.warnings,
    ];

    return {
      plan: {
        intent: validated.intent,
        summary: validated.summary,
        objects: validated.objects,
        steps: validated.steps,
        materials: validated.materials,
        lighting: validated.lighting,
        camera: validated.camera,
        assumptions: validated.assumptions,
        warnings: combinedWarnings,
      },
      code: {
        language: "python",
        content: validated.blenderCode,
        clearSceneFirst: !input.previousCode,
      },
      warnings: combinedWarnings,
    };
  } catch (err: unknown) {
    console.warn("AI generation call encountered error, falling back gracefully:", err);
    return generateFallbackPlan(input);
  }
}

export function generateFallbackPlan(input: ModelPlanInput): {
  plan: ModelPlan;
  code: GeneratedCode;
  warnings: string[];
} {
  const p = input.prompt.toLowerCase();
  const isDesk = p.includes("desk");
  const isChair = p.includes("chair");
  const isTree = p.includes("tree");
  const isCar = p.includes("car");

  const subject = isDesk
    ? "Gaming Desk"
    : isChair
    ? "Chair"
    : isTree
    ? "Low-Poly Tree"
    : isCar
    ? "Futuristic Car"
    : "3D Asset";

  let specificCode = "";

  if (isTree) {
    specificCode = `
    # Trunk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=2.0, location=(0, 0, 1.0))
    trunk = bpy.context.active_object
    trunk.name = "Tree_Trunk"
    wood_mat = create_material("Wood_Bark", (0.35, 0.2, 0.1, 1.0), roughness=0.8)
    trunk.data.materials.append(wood_mat)

    # Foliage layers
    foliage_mat = create_material("Leaves_Green", (0.1, 0.55, 0.15, 1.0), roughness=0.6)
    for i, z in enumerate([2.2, 3.0, 3.7]):
        bpy.ops.mesh.primitive_cone_add(radius1=1.4 - (i * 0.3), depth=1.4, location=(0, 0, z))
        leaf = bpy.context.active_object
        leaf.name = f"Foliage_Layer_{i+1}"
        leaf.data.materials.append(foliage_mat)
`;
  } else if (isChair) {
    specificCode = `
    # Seat
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
    seat = bpy.context.active_object
    seat.name = "Chair_Seat"
    seat.scale = (0.5, 0.5, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    mat = create_material("Seat_Mat", (0.15, 0.15, 0.2, 1.0), roughness=0.4)
    seat.data.materials.append(mat)

    # Backrest
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.22, 0.85))
    back = bpy.context.active_object
    back.name = "Chair_Backrest"
    back.scale = (0.46, 0.04, 0.35)
    bpy.ops.object.transform_apply(scale=True)
    back.data.materials.append(mat)

    # Legs
    for i, (lx, ly) in enumerate([(-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)]):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.5, location=(lx, ly, 0.25))
        leg = bpy.context.active_object
        leg.name = f"Chair_Leg_{i+1}"
        leg.data.materials.append(mat)
`;
  } else {
    // Default Desk / Asset
    specificCode = `
    # 1. Main surface
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))
    table_top = bpy.context.active_object
    table_top.name = "${subject}_Top"
    table_top.scale = (1.6, 0.8, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    
    dark_mat = create_material("${subject}_DarkMat", (0.12, 0.12, 0.14, 1.0), roughness=0.3, metallic=0.8)
    table_top.data.materials.append(dark_mat)
    
    # 2. Legs / Frame
    positions = [(-0.7, -0.35, 0.35), (0.7, -0.35, 0.35), (-0.7, 0.35, 0.35), (0.7, 0.35, 0.35)]
    for i, pos in enumerate(positions):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.7, location=pos)
        leg = bpy.context.active_object
        leg.name = f"${subject}_Leg_{i+1}"
        leg.data.materials.append(dark_mat)
`;
  }

  const code = `import bpy
import math

def clear_scene():
    """Clear active mesh objects."""
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    bpy.ops.object.delete(use_global=False)

def create_material(name, color_rgba, roughness=0.4, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color_rgba
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return mat

def build_scene():
    clear_scene()
${specificCode}
    # Lighting and Camera
    bpy.ops.object.light_add(type='AREA', location=(2.5, -3.0, 3.5))
    light = bpy.context.active_object
    light.data.energy = 350
    light.data.size = 2.0

def main():
    build_scene()

if __name__ == '__main__':
    main()
`;

  return {
    plan: {
      intent: "create_model",
      summary: `Procedural creation of a ${subject} based on: "${input.prompt}"`,
      objects: [
        {
          name: `${subject}_Main`,
          type: "mesh",
          description: `Primary geometry for ${subject}`,
          approxDimensions: { x: 1.6, y: 0.8, z: 0.8 },
          modifiers: ["Bevel"],
        },
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Clear Environment",
          instructions: "Reset active meshes for clean asset generation",
          operationType: "other",
        },
        {
          stepNumber: 2,
          title: "Construct Geometry",
          instructions: `Generate procedural form for ${subject}`,
          operationType: "primitive",
        },
        {
          stepNumber: 3,
          title: "Shader & Lighting",
          instructions: "Configure Principled BSDF node shaders and area light",
          operationType: "material",
        },
      ],
      materials: [
        {
          name: `${subject}_Material`,
          targetObject: `${subject}_Main`,
          type: "principled_bsdf",
          roughness: 0.35,
          metallic: 0.5,
        },
      ],
      lighting: [
        {
          name: "MainLight",
          type: "AREA",
          energyWatts: 350,
          position: [2.5, -3.0, 3.5],
        },
      ],
      camera: {
        focalLengthMm: 50,
        position: [3.5, -3.5, 2.5],
        rotationDeg: [60, 0, 45],
        type: "PERSP",
      },
      assumptions: [
        "Units calibrated in standard meters",
        "Compatible with Blender 4.x & 3.6 LTS",
      ],
      warnings: ["Standalone generation mode active"],
    },
    code: {
      language: "python",
      content: code,
      clearSceneFirst: true,
    },
    warnings: [],
  };
}
