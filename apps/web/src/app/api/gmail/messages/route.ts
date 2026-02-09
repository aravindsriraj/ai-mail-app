import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listMessages } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const label = searchParams.get("label") || "INBOX";
    const query = searchParams.get("q") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "20", 10);
    const pageToken = searchParams.get("pageToken") || undefined;

    const result = await listMessages(session.accessToken, {
      label,
      query,
      maxResults,
      pageToken,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gmail list messages error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
