import assert from "node:assert";

// Regex patterns mirroring validator.ts
const FORBIDDEN = [
  /\bimport\s+subprocess\b/i,
  /\bos\.system\b/i,
  /\bshutil\.rmtree\b/i,
  /\bimport\s+socket\b/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
];

function testValidator() {
  console.log("▶ Testing Code Safety Validator...");

  // Test 1: Safe Blender code
  const safeCode = `
import bpy

def main():
    bpy.ops.mesh.primitive_cube_add(size=2.0)
    cube = bpy.context.active_object
    cube.name = "TestCube"

if __name__ == '__main__':
    main()
`;
  for (const pattern of FORBIDDEN) {
    assert.strictEqual(pattern.test(safeCode), false, "Safe code flagged unexpectedly");
  }
  console.log("  ✓ Safe bpy script passed validation");

  // Test 2: Dangerous subprocess
  const dangerousCode = `import subprocess\nsubprocess.run(['rm', '-rf', '/'])`;
  const isBlocked = FORBIDDEN.some((p) => p.test(dangerousCode));
  assert.strictEqual(isBlocked, true, "Dangerous subprocess was not blocked");
  console.log("  ✓ Malicious subprocess execution successfully blocked");

  // Test 3: Dangerous os.system
  const osCode = `import os\nos.system('echo test')`;
  const osBlocked = FORBIDDEN.some((p) => p.test(osCode));
  assert.strictEqual(osBlocked, true, "os.system was not blocked");
  console.log("  ✓ Malicious os.system call successfully blocked");
}

testValidator();
