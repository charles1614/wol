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
      const text = await response.text();
      console.error(`Agent SSH API error (${response.status}):`, text.substring(0, 500));

      return NextResponse.json<SshApiResponse>(
        { success: false, error: `Agent returned ${response.status}: ${text.substring(0, 100)}` },
        { status: response.status }
      );
    }

    // Try to parse JSON, but handle HTML/text responses gracefully
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json<SshApiResponse>(data);
    } catch (e) {
      console.error("Failed to parse agent SSH response:", text.substring(0, 500));
      return NextResponse.json<SshApiResponse>(
        { success: false, error: `Invalid response from agent. Expected JSON, got: ${text.substring(0, 50)}...` },
        { status: 502 }
      );
    }
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
