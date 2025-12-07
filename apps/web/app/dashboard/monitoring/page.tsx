import GrafanaDashboard from "@/components/GrafanaDashboard";
import ServerStatus from "@/components/ServerStatus";
import styles from "./page.module.css";

export default function MonitoringPage() {
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_URL || "";

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.serverSection}>
          <ServerStatus />
        </div>
        <div className={styles.grafanaSection}>
          <GrafanaDashboard url={grafanaUrl} title="Node Monitoring" />
        </div>
      </div>
    </div>
  );
}
