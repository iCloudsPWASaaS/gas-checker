import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gas Checker - Certificates, invoices & scheduling for gas engineers",
    template: "%s | Gas Checker",
  },
  description:
    "Gas Checker is the all-in-one app for gas engineers: safety certificates, quotes, invoices, payments, scheduling, reminders and gas rate calculations.",
  applicationName: "Gas Checker",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
  keywords: ["gas engineer", "gas safety certificate", "landlord certificate", "gas rate", "invoicing"],
};

export const viewport: Viewport = {
  themeColor: "#0d9159",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
