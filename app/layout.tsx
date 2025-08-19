import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartPrint Print Management System",
  description: "Professional print management system with modern UI/UX design for 2025-2026",
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: '/apple-icon.svg',
        type: 'image/svg+xml',
        sizes: '180x180',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <div className="w-full flex min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
