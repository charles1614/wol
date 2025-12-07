// Shared types for the ASUS WOL monorepo

/**
 * SSH Connection data from `ss` command
 */
export interface SshConnection {
  state: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
}

/**
 * Server status data pushed from agent
 */
export interface ServerStatus {
  hostname: string;
  timestamp: number;
  uptime?: number;
  sshConnections: SshConnection[];
}

/**
 * API response for agent data push
 */
export interface AgentPushResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * WOL request payload
 */
export interface WolPayload {
  uid: string;
  owcode: string;
  peerid: string;
  macstr: string;
  product: number;
}

/**
 * WOL response from JDXB API
 */
export interface WolResponse {
  rtn: number;
  msg?: string;
}
