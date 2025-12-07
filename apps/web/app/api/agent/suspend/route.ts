import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface SuspendApiResponse {
  success: boolean;
  message: string;
  agentOffline?: boolean;
}

/**
 * POST /api/agent/suspend
 * Proxies request to agent to suspend the system
 */
export async function POST(): Promise<Response> {
  // Verify user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json<SuspendApiResponse>(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL || "http://localhost:3001";
  const agentSecret = process.env.AGENT_SECRET || "agent-secret-key";

  try {
    const response = await fetch(`${agentUrl}/api/suspend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
        "Content-Type": "application/json",
      },
      // Longer timeout for suspend operation
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    return NextResponse.json<SuspendApiResponse>(data, {
      status: response.ok ? 200 : 400,
    });
  } catch (error) {
    console.error("Agent suspend API error:", error);

    // Check if agent is offline
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch"))) {
      return NextResponse.json<SuspendApiResponse>({
        success: false,
        message: "Agent is offline or unreachable",
        agentOffline: true,
      });
    }

    return NextResponse.json<SuspendApiResponse>(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
