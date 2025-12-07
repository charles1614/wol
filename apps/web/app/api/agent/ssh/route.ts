import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { SshConnection } from "@asus/shared";

export interface SshApiResponse {
  success: boolean;
  hostname?: string;
  timestamp?: number;
  connections?: SshConnection[];
  error?: string;
  agentOffline?: boolean;
}

/**
 * GET /api/agent/ssh
 * Proxies request to agent to get SSH connection states
 */
export async function GET(): Promise<Response> {
  // Verify user is authenticated
  const session = await auth();
  if (!session) {
    return NextResponse.json<SshApiResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL || "http://localhost:3001";
  const agentSecret = process.env.AGENT_SECRET || "agent-secret-key";

  try {
    const response = await fetch(`${agentUrl}/api/ssh`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
      },
      // Short timeout for agent
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json<SshApiResponse>(
        { success: false, error: `Agent error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json<SshApiResponse>(data);
  } catch (error) {
    console.error("Agent SSH API error:", error);

    // Check if agent is offline
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch"))) {
      return NextResponse.json<SshApiResponse>({
        success: false,
        error: "Agent is offline or unreachable",
        agentOffline: true,
      });
    }

    return NextResponse.json<SshApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
