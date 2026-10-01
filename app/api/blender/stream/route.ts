import { NextRequest } from "next/server";
import { localRealtimeBus } from "@/lib/realtime/broadcast";
import { RealtimeChannels } from "@/types/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const deviceId = searchParams.get("deviceId") || "blender_default";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      const initialMsg = `event: connected\ndata: ${JSON.stringify({
        deviceId,
        projectId,
        status: "CONNECTED",
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMsg));

      // Listener for project events
      const handleProjectEvent = (data: { event: string; payload: any }) => {
        try {
          const sseMsg = `event: ${data.event}\ndata: ${JSON.stringify(data.payload)}\n\n`;
          controller.enqueue(encoder.encode(sseMsg));
        } catch {
          // Stream might be closed
        }
      };

      const projectChannel = projectId ? RealtimeChannels.project(projectId) : null;
      if (projectChannel) {
        localRealtimeBus.on(projectChannel, handleProjectEvent);
      }

      // Heartbeat ping interval
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        if (projectChannel) {
          localRealtimeBus.off(projectChannel, handleProjectEvent);
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
