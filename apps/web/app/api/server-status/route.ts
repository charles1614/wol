import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { ServerStatus, AgentPushResponse } from "@asus/shared";

// In-memory store for server status (in production, use Redis or similar)
let latestStatus: ServerStatus | null = null;

/**
 * POST /api/server-status
 * Receives status updates from the agent
 */
export async function POST(request: Request): Promise<Response> {
  // Verify agent secret
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.AGENT_SECRET;
  if (!expectedSecret) {
    console.error("AGENT_SECRET not configured");
    return NextResponse.json<AgentPushResponse>(
      { success: false, error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json<AgentPushResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const status: ServerStatus = await request.json();

    // Validate payload
    if (!status.hostname || !status.timestamp) {
      return NextResponse.json<AgentPushResponse>(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Store latest status
    latestStatus = status;

    console.log(`[Agent] Received status from ${status.hostname}: ${status.sshConnections.length} SSH connections`);

    return NextResponse.json<AgentPushResponse>({
      success: true,
      message: "Status updated",
    });
  } catch (error) {
    console.error("Error processing agent status:", error);
    return NextResponse.json<AgentPushResponse>(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/server-status
 * Returns the latest server status for the UI
 */
export async function GET(): Promise<Response> {
  // Verify user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { connected: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!latestStatus) {
    return NextResponse.json({
      connected: false,
      message: "No agent data received yet",
    });
  }

  // Check if data is stale (older than 30 seconds)
  const isStale = Date.now() - latestStatus.timestamp > 30000;

  return NextResponse.json({
    connected: !isStale,
    isStale,
    ...latestStatus,
  });
}
