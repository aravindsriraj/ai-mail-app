import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMessage } from "@/lib/gmail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string;
  try {
    const p = await params;
    id = p.id;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!id || id.length < 5) {
    return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await getMessage(session.accessToken, id);
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch message" },
      { status: 500 }
    );
  }
}
