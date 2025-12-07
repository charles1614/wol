"use client";

import { useState, useEffect, useCallback } from "react";
import type { SshConnection } from "@asus/shared";
import styles from "./ServerStatus.module.css";

interface SshApiResponse {
  success: boolean;
  hostname?: string;
  timestamp?: number;
  connections?: SshConnection[];
  error?: string;
  agentOffline?: boolean;
}

interface SuspendResponse {
  success: boolean;
  message: string;
  agentOffline?: boolean;
}

export default function ServerStatus() {
  const [sshData, setSshData] = useState<SshApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [suspendResult, setSuspendResult] = useState<SuspendResponse | null>(null);

  const fetchSshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/ssh");
      const data: SshApiResponse = await res.json();
      setSshData(data);
    } catch (error) {
      console.error("Failed to fetch SSH status:", error);
      setSshData({ success: false, error: "Network error", agentOffline: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSshStatus();
    const interval = setInterval(fetchSshStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchSshStatus]);

  async function handleSuspend() {
    if (suspending) return;

    setSuspending(true);
    setSuspendResult(null);

    try {
      const res = await fetch("/api/agent/suspend", { method: "POST" });
      const data: SuspendResponse = await res.json();
      setSuspendResult(data);
    } catch (error) {
      setSuspendResult({
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setSuspending(false);
    }
  }

  function formatTime(timestamp?: number): string {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleTimeString();
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading server status...</div>
      </div>
    );
  }

  const isConnected = sshData?.success && !sshData?.agentOffline;
  const connections = sshData?.connections || [];

  return (
    <div className={styles.container}>
      {/* Status Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Server Status</h2>
        <div className={`${styles.statusBadge} ${isConnected ? styles.connected : styles.disconnected}`}>
          <span className={styles.statusDot}></span>
          {isConnected ? "Agent Connected" : sshData?.agentOffline ? "Agent Offline" : "Disconnected"}
        </div>
      </div>

      {!isConnected ? (
        <div className={styles.placeholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <p>Agent not connected</p>
          <p className={styles.hint}>
            Start the agent on your server:<br />
            <code>pnpm agent</code>
          </p>
          {sshData?.error && (
            <p className={styles.errorText}>{sshData.error}</p>
          )}
        </div>
      ) : (
        <>
          {/* Server Info */}
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hostname</span>
              <span className={styles.infoValue}>{sshData?.hostname || "Unknown"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Last Update</span>
              <span className={styles.infoValue}>{formatTime(sshData?.timestamp)}</span>
            </div>
          </div>

          {/* SSH Connections */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              SSH Connections
              <span className={styles.count}>{connections.length}</span>
            </h3>

            {connections.length > 0 ? (
              <div className={styles.connectionList}>
                {connections.map((conn, index) => (
                  <div key={index} className={styles.connectionItem}>
                    <div className={styles.connectionIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                    </div>
                    <div className={styles.connectionInfo}>
                      <div className={styles.connectionRow}>
                        <span className={styles.connectionLabel}>Local:</span>
                        <span className={styles.connectionAddress}>
                          {conn.localAddress}:{conn.localPort}
                        </span>
                      </div>
                      <div className={styles.connectionRow}>
                        <span className={styles.connectionLabel}>Peer:</span>
                        <span className={styles.connectionAddress}>
                          {conn.remoteAddress}:{conn.remotePort}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noConnections}>
                No active SSH connections
              </div>
            )}
          </div>

          {/* Suspend Control */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Power Control</h3>

            <button
              className={`${styles.suspendButton} ${suspending ? styles.loading : ""}`}
              onClick={handleSuspend}
              disabled={suspending}
            >
              {suspending ? (
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="60" strokeDashoffset="45" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="10" y1="15" x2="10" y2="9" />
                  <line x1="14" y1="15" x2="14" y2="9" />
                </svg>
              )}
              {suspending ? "Suspending..." : "Suspend Server"}
            </button>

            {/* Suspend Result */}
            {suspendResult && (
              <div className={`${styles.suspendResult} ${suspendResult.success ? styles.success : styles.error}`}>
                <div className={styles.suspendResultHeader}>
                  {suspendResult.success ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  <span>{suspendResult.success ? "Success" : "Error"}</span>
                </div>
                <pre className={styles.suspendMessage}>{suspendResult.message}</pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
