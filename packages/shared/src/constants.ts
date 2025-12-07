// Shared constants for the ASUS WOL monorepo

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  WOL: "/api/wol",
  SERVER_STATUS: "/api/server-status",
} as const;

/**
 * Default polling intervals (in milliseconds)
 */
export const INTERVALS = {
  SSH_CHECK: 5000, // Check SSH connections every 5 seconds
  STATUS_PUSH: 10000, // Push status to API every 10 seconds
  UI_REFRESH: 5000, // Refresh UI every 5 seconds
} as const;

/**
 * JDXB API configuration
 */
export const JDXB_API = {
  WAKEUP_URL: "https://jdis.ionewu.com/jdis/wakeup",
} as const;
