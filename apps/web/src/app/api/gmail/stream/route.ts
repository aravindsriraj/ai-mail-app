import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient } from "../pubsub/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      addSSEClient(controller);

      // Send initial keepalive
      controller.enqueue(
        new TextEncoder().encode("data: {\"type\":\"connected\"}\n\n")
      );

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        removeSSEClient(controller);
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
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
