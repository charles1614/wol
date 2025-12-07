import WolCard from "@/components/WolCard";
import ServerStatus from "@/components/ServerStatus";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>WOL Control</h1>
        <p className={styles.subtitle}>Wake your ASUS PC remotely</p>
      </header>
      <div className={styles.grid}>
        <div className={styles.statusSection}>
          <ServerStatus />
        </div>
        <div className={styles.wolSection}>
          <WolCard />
        </div>
      </div>
    </div>
  );
}
