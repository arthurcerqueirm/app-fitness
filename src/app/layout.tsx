import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEAST MODE — Workout Tracker",
  description: "Track your workouts like a beast. Premium fitness app.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BEAST MODE",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0F",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-full">
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#1A1A2E", color: "#FAFAFA", border: "1px solid rgba(255,255,255,0.1)" },
          success: { iconTheme: { primary: "#BEFF00", secondary: "#0A0A0F" } },
          error: { iconTheme: { primary: "#FF4757", secondary: "#0A0A0F" } },
        }}
      />
    </body>
    </html>
  );
}
