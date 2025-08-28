import AppHeader from "@/components/ui/AppHeader";
import SideNav from "@/components/ui/SideNav";
import { SonnerToaster } from "@/components/ui/Toast";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="w-full flex min-h-screen bg-background overflow-hidden">
        <SideNav />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      <SonnerToaster />
    </>
  );
}
