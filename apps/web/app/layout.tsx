import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ASUS WOL Dashboard",
  description: "Remote Wake-on-LAN and monitoring dashboard for ASUS PC",
  manifest: "/manifest.json",
  themeColor: "#5C6BC0",
  openGraph: {
    title: "ASUS WOL Dashboard",
    description: "Remote Wake-on-LAN and monitoring dashboard for ASUS PC",
    type: "website",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "ASUS WOL Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ASUS WOL Dashboard",
    description: "Remote Wake-on-LAN and monitoring dashboard",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASUS WOL",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <SessionProvider>
          {/* Ambient Background */}
          <div className="ambient-bg">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
