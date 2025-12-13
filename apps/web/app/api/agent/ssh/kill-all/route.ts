import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface KillAllSshResponse {
  success: boolean;
  message: string;
  killed?: number;
}

/**
 * POST /api/agent/ssh/kill-all
 * Proxies request to agent to kill all SSH connections
 */
export async function POST(): Promise<Response> {
  // Verify user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json<KillAllSshResponse>(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL;
  const agentSecret = process.env.AGENT_SECRET;

  if (!agentUrl || !agentSecret) {
    return NextResponse.json<KillAllSshResponse>(
      { success: false, message: "Agent not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${agentUrl}/api/ssh/kill-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();
    return NextResponse.json<KillAllSshResponse>(data, {
      status: response.ok ? 200 : 400,
    });
  } catch (error) {
    console.error("Agent kill-all SSH API error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json<KillAllSshResponse>({
        success: false,
        message: "Agent is offline or unreachable",
      });
    }

    return NextResponse.json<KillAllSshResponse>(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
