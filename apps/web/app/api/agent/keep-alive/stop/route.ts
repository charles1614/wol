import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface KeepAliveActionResponse {
  success: boolean;
  message: string;
}

/**
 * POST /api/agent/keep-alive/stop
 * Proxies request to agent to stop keep-alive process
 */
export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session) {
    return NextResponse.json<KeepAliveActionResponse>(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const agentUrl = process.env.AGENT_URL || "http://localhost:3001";
  const agentSecret = process.env.AGENT_SECRET || "agent-secret-key";

  try {
    const response = await fetch(`${agentUrl}/api/keep-alive/stop`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();
    return NextResponse.json<KeepAliveActionResponse>(data, {
      status: response.ok ? 200 : 400,
    });
  } catch (error) {
    console.error("Agent keep-alive stop error:", error);
    return NextResponse.json<KeepAliveActionResponse>(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
