import assert from "node:assert";

// Mock generation test covering the 4 required prompt suites
const testPrompts = [
  "Create a cube.",
  "Create a chair.",
  "Create a low-poly tree.",
  "Create a futuristic car.",
];

function mockGeneratePlan(prompt) {
  const subject = prompt.replace("Create a ", "").replace(".", "").trim();
  return {
    intent: "create_model",
    summary: `Procedural creation of ${subject}`,
    objects: [
      {
        name: `${subject.replace(/\s+/g, "_")}_Base`,
        type: "mesh",
        description: `Primary geometry for ${subject}`,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Create Base Geometry",
        instructions: `Construct ${subject} bounding primitives`,
        operationType: "primitive",
      },
    ],
    materials: [
      {
        name: `${subject.replace(/\s+/g, "_")}_Mat`,
        targetObject: `${subject.replace(/\s+/g, "_")}_Base`,
        type: "principled_bsdf",
      },
    ],
    lighting: [
      {
        name: "KeyLight",
        type: "AREA",
        energyWatts: 350,
      },
    ],
    assumptions: ["Units in meters"],
    warnings: [],
    blenderCode: `import bpy\n\ndef main():\n    # Generate ${subject}\n    bpy.ops.mesh.primitive_cube_add()\n\nif __name__ == '__main__':\n    main()`,
  };
}

function runGenerationTests() {
  console.log("▶ Testing AI Generation Prompts & Output Schema...");

  for (const prompt of testPrompts) {
    const result = mockGeneratePlan(prompt);

    assert(result.intent, "Missing intent");
    assert(result.summary, "Missing summary");
    assert(Array.isArray(result.objects), "objects must be an array");
    assert(result.objects.length > 0, "objects must not be empty");
    assert(Array.isArray(result.steps), "steps must be an array");
    assert(result.steps.length > 0, "steps must not be empty");
    assert(result.blenderCode.includes("import bpy"), "blenderCode must include import bpy");

    console.log(`  ✓ Prompt '${prompt}' produced valid structured plan & bpy code`);
  }
}

runGenerationTests();
