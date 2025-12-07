import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface KeepAliveStatusResponse {
  success: boolean;
  active: boolean;
  pid: number | null;
  error?: string;
  agentOffline?: boolean;
}

/**
 * GET /api/agent/keep-alive
 * Proxies request to agent to get keep-alive status
 */
export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session) {
    return NextResponse.json<KeepAliveStatusResponse>(
      { success: false, active: false, pid: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL || "http://localhost:3001";
  const agentSecret = process.env.AGENT_SECRET || "agent-secret-key";

  try {
    const response = await fetch(`${agentUrl}/api/keep-alive`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json<KeepAliveStatusResponse>(
        { success: false, active: false, pid: null, error: `Agent error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json<KeepAliveStatusResponse>(data);
  } catch (error) {
    console.error("Agent keep-alive status error:", error);
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch"))) {
      return NextResponse.json<KeepAliveStatusResponse>({
        success: false,
        active: false,
        pid: null,
        error: "Agent is offline or unreachable",
        agentOffline: true,
      });
    }
    return NextResponse.json<KeepAliveStatusResponse>(
      { success: false, active: false, pid: null, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
