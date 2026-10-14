import assert from "node:assert/strict";
import { GET } from "../../app/api/blender/stream/route.ts";

export async function testBlenderStreamAuthorization() {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoMode = process.env.DEMO_MODE;
  try {
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "false";
    const unauthorized = await GET(new Request("http://localhost/api/blender/stream?projectId=private-project"));
    assert.equal(unauthorized.status, 401, "the stream must reject requests without a verified user");

    process.env.DEMO_MODE = "true";
    const inaccessible = await GET(new Request("http://localhost/api/blender/stream?projectId=private-project", {
      headers: { Authorization: "Bearer demo-token" },
    }));
    assert.equal(inaccessible.status, 404, "the stream must not disclose another tenant's project events");
    assert.match((await inaccessible.json()).error, /not found or access denied/i);
    console.log("  ✓ Blender event stream rejects anonymous and unauthorized project subscriptions");
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;
  }
}
