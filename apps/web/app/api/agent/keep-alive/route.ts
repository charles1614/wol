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

  const agentUrl = process.env.AGENT_URL;
  const agentSecret = process.env.AGENT_SECRET;

  if (!agentUrl || !agentSecret) {
    return NextResponse.json<KeepAliveStatusResponse>(
      { success: false, active: false, pid: null, error: "Agent not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${agentUrl}/api/keep-alive`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${agentSecret}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Agent error (${response.status}):`, text.substring(0, 500)); // Log first 500 chars

      return NextResponse.json<KeepAliveStatusResponse>(
        {
          success: false,
          active: false,
          pid: null,
          error: `Agent returned ${response.status}: ${text.substring(0, 100)}`
        },
        { status: response.status }
      );
    }

    // Try to parse JSON, but handle HTML/text responses gracefully
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json<KeepAliveStatusResponse>(data);
    } catch (e) {
      console.error("Failed to parse agent response:", text.substring(0, 500));
      return NextResponse.json<KeepAliveStatusResponse>(
        {
          success: false,
          active: false,
          pid: null,
          error: `Invalid response from agent. Expected JSON, got: ${text.substring(0, 50)}...`
        },
        { status: 502 }
      );
    }
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
