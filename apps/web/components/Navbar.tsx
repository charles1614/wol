"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./Navbar.module.css";

interface NavbarProps {
  user?: {
    name?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "WOL Control", icon: "power" },
    { href: "/dashboard/monitoring", label: "Monitoring", icon: "chart" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/dashboard" className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#nav-logo-gradient)" />
              <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="nav-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#5C6BC0" />
                  <stop offset="1" stopColor="#7C4DFF" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>ASUS WOL</span>
          </Link>

          <div className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              >
                {item.icon === "power" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v10M18.36 6.64a9 9 0 1 1-12.73 0" />
                  </svg>
                )}
                {item.icon === "chart" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                )}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.user}>
            <span className={styles.userName}>{user?.name || "User"}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })} className={styles.signOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
