import type { Metadata, Viewport } from "next";
import PwaRegister from "./pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control 30",
  description: "Dashboard de finanzas familiares para Maria y Gina",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Control 30",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/icons/control-30-icon.svg",
    apple: "/icons/control-30-icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
