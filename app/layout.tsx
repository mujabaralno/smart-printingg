import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Printing System - Advanced Print Management Platform",
  description: "Professional print management system with modern UI/UX design for 2025-2026",
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
