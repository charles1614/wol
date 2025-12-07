"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sendWolSignal, getDeviceInfo } from "@/lib/wol";
import styles from "./WolCard.module.css";

interface Activity {
  type: "success" | "error";
  message: string;
  time: Date;
}

export default function WolCard() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ mac: string; deviceName: string } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lastWake, setLastWake] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for flashlight effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  useEffect(() => {
    // Load device info
    getDeviceInfo().then((info) => {
      if (info) setDeviceInfo(info);
    });

    // Load from localStorage
    const savedLastWake = localStorage.getItem("lastWakeTime");
    if (savedLastWake) {
      setLastWake(formatRelativeTime(new Date(savedLastWake)));
    }

    const savedActivities = localStorage.getItem("wolActivities");
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        setActivities(parsed.map((a: Activity) => ({ ...a, time: new Date(a.time) })));
      } catch (e) {
        console.error("Failed to parse activities", e);
      }
    }
  }, []);

  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMac(mac: string): string {
    return mac.match(/.{2}/g)?.join(":").toUpperCase() || mac;
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addActivity(activity: Activity) {
    const newActivities = [activity, ...activities].slice(0, 10);
    setActivities(newActivities);
    localStorage.setItem("wolActivities", JSON.stringify(newActivities));
  }

  async function handleWake() {
    if (loading) return;

    setLoading(true);
    setSuccess(false);

    const result = await sendWolSignal();

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      const now = new Date();
      localStorage.setItem("lastWakeTime", now.toISOString());
      setLastWake("Just now");

      showToast(
        result.serverConfirmed
          ? "WOL signal confirmed by server!"
          : result.message || "Wake signal sent!",
        "success"
      );

      addActivity({
        type: "success",
        message: `Sent WOL signal to ${deviceInfo?.deviceName || "ASUS PC"}`,
        time: now,
      });
    } else {
      showToast(result.error || "Failed to send WOL signal", "error");

      addActivity({
        type: "error",
        message: `Failed: ${result.error}`,
        time: new Date(),
      });
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div
        ref={cardRef}
        className={styles.card}
        onMouseMove={handleMouseMove}
      >
        <div className={styles.deviceIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="12" y="10" width="24" height="16" rx="1" fill="currentColor" opacity="0.1" />
            <path d="M18 34H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 38H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="10" r="2" fill="#4CAF50" />
          </svg>
        </div>

        <div className={styles.deviceInfo}>
          <h2 className={styles.deviceName}>{deviceInfo?.deviceName || "ASUS PC"}</h2>
          <p className={styles.deviceMac}>
            MAC: {deviceInfo?.mac ? formatMac(deviceInfo.mac) : "Loading..."}
          </p>
          <div className={styles.deviceMeta}>
            <span className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              via JDXB
            </span>
            <span className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {lastWake || "Never"}
            </span>
          </div>
        </div>

        <button
          className={`${styles.wakeButton} ${loading ? styles.loading : ""} ${success ? styles.success : ""}`}
          onClick={handleWake}
          disabled={loading}
          aria-label="Wake ASUS PC"
        >
          <div className={styles.borderBeam}></div>
          <div className={styles.borderBeamInner}></div>
          <div className={styles.buttonGlow}></div>
          <div className={styles.buttonContent}>
            <svg className={styles.powerIcon} width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 3V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M18.364 5.636A9 9 0 1 1 5.636 5.636" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className={styles.buttonText}>Wake Up</span>
          </div>
          <div className={styles.buttonLoader}>
            <svg className={styles.spinner} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="60" strokeDashoffset="45" />
            </svg>
          </div>
        </button>
      </div>

      {/* Activity Log */}
      <div className={styles.activitySection}>
        <h3 className={styles.sectionTitle}>Activity</h3>
        <div className={styles.activityLog}>
          {activities.length === 0 ? (
            <div className={styles.activityEmpty}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>No activity yet</span>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                  {activity.type === "success" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityMessage}>{activity.message}</p>
                  <p className={styles.activityTime}>{formatRelativeTime(activity.time)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.toastIcon}>
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
