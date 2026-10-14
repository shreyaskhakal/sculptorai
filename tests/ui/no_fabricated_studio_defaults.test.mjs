import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

export function testNoFabricatedStudioDefaults() {
  const workspace = read("../../app/projects/[projectId]/page.tsx");
  const viewer = read("../../components/viewer/ThreeDViewer.tsx");
  const codeViewer = read("../../components/code/CodeViewer.tsx");
  const collaborators = read("../../components/collaboration/CollaboratorsBar.tsx");
  const homepage = read("../../app/page.tsx");

  assert.match(workspace, /useState<string>\(""\)/, "workspace should start with no script");
  assert.match(workspace, /useState<ModelPlan \| null>\(null\)/, "workspace should start with no plan");
  assert.match(workspace, /router\.replace\("\/auth\/login"\)/, "workspace should send anonymous users to login");
  assert.match(workspace, /disabled=\{!activeCodeValidation\?\.isValid/, "workspace execution button must require a safe validated script");
  assert.match(viewer, /No scene preview yet/, "empty viewer should explain that there is no preview");
  assert.doesNotMatch(viewer, /Cyber_Desk_Surface|Curved_Monitor/, "viewer must not inject the showcase model");
  assert.match(codeViewer, /Static checks passed/, "script label should describe static validation accurately");
  assert.match(codeViewer, /disabled=\{!effectiveValidation\?\.isValid\}/, "execution must be disabled unless validation passes");
  assert.match(collaborators, /\$\{collaborators\.length\} Online/, "presence label should show actual online count");
  assert.doesNotMatch(homepage, /\/projects\/proj_cyberpunk_desk/, "homepage must not route to the fabricated sample project");

  console.log("  ✓ Studio starts without synthetic project data and accurately labels empty/validated states");
}
