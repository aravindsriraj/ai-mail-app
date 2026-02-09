import { NextRequest, NextResponse } from "next/server";

// In-memory store for SSE clients (in production, use Redis or similar)
const clients = new Set<ReadableStreamDefaultController>();

export function addSSEClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

export function removeSSEClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}

function notifyClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      clients.delete(controller);
    }
  });
}

// Google Pub/Sub push endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Decode the Pub/Sub message
    const pubsubMessage = body.message;
    if (!pubsubMessage?.data) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const decodedData = JSON.parse(
      Buffer.from(pubsubMessage.data, "base64").toString("utf-8")
    );

    console.log("Pub/Sub notification received:", decodedData);

    // Notify all connected SSE clients to refresh
    notifyClients({
      type: "new_email",
      emailAddress: decodedData.emailAddress,
      historyId: decodedData.historyId,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Pub/Sub webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
