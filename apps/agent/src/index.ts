/**
 * ASUS WOL Agent - HTTP API Server
 * 
 * Exposes APIs for:
 * - GET /api/ssh - Get SSH connection states
 * - POST /api/ssh/kill - Kill specific SSH connection
 * - POST /api/ssh/kill-all - Kill all SSH connections
 * - POST /api/suspend - Suspend the system
 * 
 * Usage:
 *   pnpm agent       # Start in production
 *   pnpm agent:dev   # Start with hot reload
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { execSync, exec } from "child_process";
import { hostname } from "os";
import type { SshConnection } from "@asus/shared";

// Configuration from environment
const PORT = parseInt(process.env.AGENT_PORT || "3001");
const API_SECRET = process.env.API_SECRET || "agent-secret-key";

console.log(`
╔════════════════════════════════════════╗
║     ASUS WOL Agent v2.0.0              ║
╠════════════════════════════════════════╣
║  Port: ${String(PORT).padEnd(31)}║
║  Host: ${hostname().padEnd(31)}║
╚════════════════════════════════════════╝
`);

/**
 * Parse SSH connections from `ss` command output
 */
function getSshConnections(): SshConnection[] {
  try {
    // Get established TCP connections on port 22
    const output = execSync('ss -tn state established | grep ":22" || true', {
      encoding: "utf-8",
    });

    const lines = output.trim().split("\n").filter(Boolean);
    const connections: SshConnection[] = [];

    for (const line of lines) {
      // Parse: Recv-Q Send-Q Local Address:Port Peer Address:Port
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const [, , localAddr, remoteAddr] = parts;

        const [localAddress, localPort] = parseAddress(localAddr);
        const [remoteAddress, remotePort] = parseAddress(remoteAddr);

        connections.push({
          state: "ESTABLISHED",
          localAddress,
          localPort,
          remoteAddress,
          remotePort,
        });
      }
    }

    return connections;
  } catch (error) {
    console.error("Error getting SSH connections:", error);
    return [];
  }
}

/**
 * Parse address:port string (handles IPv4 and IPv6)
 */
function parseAddress(addr: string): [string, number] {
  const lastColon = addr.lastIndexOf(":");
  if (lastColon === -1) return [addr, 0];

  const address = addr.substring(0, lastColon);
  const port = parseInt(addr.substring(lastColon + 1), 10);

  return [address, port];
}

/**
 * Execute systemctl suspend with inhibitor handling
 */
function executeSuspend(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    exec("systemctl suspend 2>&1", (error, stdout, stderr) => {
      const output = stdout + stderr;

      if (error) {
        // Check for inhibitor message
        if (output.includes("Operation inhibited")) {
          // Parse and return the inhibitor message
          const inhibitorMatch = output.match(/Operation inhibited by[^.]+/);
          const reasonMatch = output.match(/reason is "[^"]+"/);

          let message = `Operation inhibited by "SSH-Guard" (PID unknown "systemd-inhibit", user root), reason is "SSH Active".\n`;
          message += `Please retry operation after closing inhibitors and logging out other users.\n`;
          message += `Alternatively, ignore inhibitors and users with 'systemctl suspend -i'.`;

          if (inhibitorMatch || reasonMatch) {
            message = output.trim();
          }

          resolve({ success: false, message });
        } else {
          resolve({ success: false, message: output.trim() || error.message });
        }
      } else {
        resolve({ success: true, message: "Suspend initiated successfully" });
      }
    });
  });
}

/**
 * Kill a specific SSH connection
 * Uses ss -K to kill the connection by remote address and port
 */
function killSshConnection(remoteAddress: string, remotePort: number): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    // Use ss -K to kill the connection
    const cmd = `ss -K dst ${remoteAddress} dport = ${remotePort} 2>&1`;

    exec(cmd, (error, stdout, stderr) => {
      const output = stdout + stderr;

      if (error) {
        resolve({
          success: false,
          message: `Failed to kill connection: ${output || error.message}`
        });
      } else {
        resolve({
          success: true,
          message: `Killed SSH connection from ${remoteAddress}:${remotePort}`
        });
      }
    });
  });
}

/**
 * Kill all SSH connections
 * Kills all established connections on port 22
 */
function killAllSshConnections(): Promise<{ success: boolean; message: string; killed: number }> {
  return new Promise((resolve) => {
    // First get all SSH connections
    const connections = getSshConnections();

    if (connections.length === 0) {
      resolve({ success: true, message: "No SSH connections to kill", killed: 0 });
      return;
    }

    // Kill all connections using ss -K
    const cmd = `ss -K state established '( sport = :22 )' 2>&1`;

    exec(cmd, (error, stdout, stderr) => {
      const output = stdout + stderr;

      if (error) {
        resolve({
          success: false,
          message: `Failed to kill connections: ${output || error.message}`,
          killed: 0
        });
      } else {
        resolve({
          success: true,
          message: `Killed ${connections.length} SSH connection(s)`,
          killed: connections.length
        });
      }
    });
  });
}

/**
 * Verify API key authentication
 */
function verifyAuth(req: IncomingMessage): boolean {
  const authHeader = req.headers["authorization"];
  return authHeader === `Bearer ${API_SECRET}`;
}

/**
 * CORS headers
 */
function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * Request handler
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method?.toUpperCase();

  setCorsHeaders(res);

  // Handle preflight
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Verify authentication for all endpoints
  if (!verifyAuth(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  console.log(`[${new Date().toISOString()}] ${method} ${path}`);

  try {
    // GET /api/ssh - Get SSH connections
    if (path === "/api/ssh" && method === "GET") {
      const connections = getSshConnections();
      sendJson(res, 200, {
        success: true,
        hostname: hostname(),
        timestamp: Date.now(),
        connections,
      });
      return;
    }

    // POST /api/ssh/kill - Kill specific SSH connection
    if (path === "/api/ssh/kill" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { remoteAddress, remotePort } = JSON.parse(body);

          if (!remoteAddress || !remotePort) {
            sendJson(res, 400, {
              success: false,
              message: "Missing remoteAddress or remotePort"
            });
            return;
          }

          const result = await killSshConnection(remoteAddress, remotePort);
          sendJson(res, result.success ? 200 : 400, result);
        } catch (error) {
          sendJson(res, 400, {
            success: false,
            message: "Invalid JSON body"
          });
        }
      });
      return;
    }

    // POST /api/ssh/kill-all - Kill all SSH connections
    if (path === "/api/ssh/kill-all" && method === "POST") {
      const result = await killAllSshConnections();
      sendJson(res, result.success ? 200 : 400, result);
      return;
    }

    // POST /api/suspend - Suspend system
    if (path === "/api/suspend" && method === "POST") {
      const result = await executeSuspend();
      sendJson(res, result.success ? 200 : 400, result);
      return;
    }

    // GET /health - Health check
    if (path === "/health" && method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        hostname: hostname(),
        timestamp: Date.now(),
      });
      return;
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    console.error("Request error:", error);
    sendJson(res, 500, { error: "Internal server error" });
  }
}

// Create and start HTTP server
const server = createServer(handleRequest);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent API listening on http://0.0.0.0:${PORT}`);
  console.log(`
Available endpoints:
  GET  /api/ssh           - Get SSH connection states
  POST /api/ssh/kill      - Kill specific SSH connection
  POST /api/ssh/kill-all  - Kill all SSH connections
  POST /api/suspend       - Suspend the system
  GET  /health            - Health check
`);
});
