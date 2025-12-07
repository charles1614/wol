import GrafanaDashboard from "@/components/GrafanaDashboard";
import styles from "./page.module.css";

export default function MonitoringPage() {
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_URL || "";

  return (
    <div className={styles.container}>
      <GrafanaDashboard url={grafanaUrl} title="Node Monitoring" />
    </div>
  );
}
