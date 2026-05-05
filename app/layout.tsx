import type { Metadata, Viewport } from "next";
import PwaRegister from "./pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Familia Agassl",
  title: "Familia Agassl",
  description: "Control simple de ingresos, gastos, presupuesto y pendientes familiares.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Familia Agassl",
    statusBarStyle: "black-translucent"
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
