import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface KillSshResponse {
  success: boolean;
  message: string;
}

/**
 * POST /api/agent/ssh/kill
 * Proxies request to agent to kill a specific SSH connection
 */
export async function POST(request: Request): Promise<Response> {
  // Verify user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json<KillSshResponse>(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL || "http://localhost:3001";
  const agentSecret = process.env.AGENT_SECRET || "agent-secret-key";

  try {
    const body = await request.json();
    const { remoteAddress, remotePort } = body;

    if (!remoteAddress || !remotePort) {
      return NextResponse.json<KillSshResponse>(
        { success: false, message: "Missing remoteAddress or remotePort" },
        { status: 400 }
      );
    }

    const response = await fetch(`${agentUrl}/api/ssh/kill`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remoteAddress, remotePort }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();
    return NextResponse.json<KillSshResponse>(data, {
      status: response.ok ? 200 : 400,
    });
  } catch (error) {
    console.error("Agent kill SSH API error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json<KillSshResponse>({
        success: false,
        message: "Agent is offline or unreachable",
      });
    }

    return NextResponse.json<KillSshResponse>(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
