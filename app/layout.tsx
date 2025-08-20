import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartPrint Print Management System",
  description: "Professional print management system with modern UI/UX design for 2025-2026",
  icons: {
    icon: [
      {
        url: '/logo-smart-printing.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        url: '/logo-smart-printing.svg',
        type: 'image/svg+xml',
        sizes: '32x32',
      },
      {
        url: '/logo-smart-printing.svg',
        type: 'image/svg+xml',
        sizes: '16x16',
      },
    ],
    shortcut: '/logo-smart-printing.svg',
    apple: [
      {
        url: '/logo-smart-printing.svg',
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
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo-smart-printing.svg" />
        <link rel="icon" type="image/x-icon" href="/logo-smart-printing.svg" />
        <link rel="shortcut icon" href="/logo-smart-printing.svg" />
        <link rel="apple-touch-icon" href="/logo-smart-printing.svg" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <div className="w-full flex min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
