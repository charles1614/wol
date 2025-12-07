"use client";

import styles from "./GrafanaDashboard.module.css";

interface GrafanaDashboardProps {
  url: string;
  title?: string;
}

export default function GrafanaDashboard({ url, title = "System Monitoring" }: GrafanaDashboardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      {/* Grafana Cloud blocks iframe embedding with X-Frame-Options: deny */}
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          <h3 className={styles.placeholderTitle}>Grafana Dashboard</h3>
          <p className={styles.placeholderText}>
            Grafana Cloud doesn&apos;t allow iframe embedding due to security restrictions.
            <br />
            Click below to view your dashboard in a new tab.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.openButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Grafana Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
