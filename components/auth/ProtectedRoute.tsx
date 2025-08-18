"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, setUser } from "@/lib/auth";

const AdvancedLoader = () => (
  <div className="flex flex-col items-center space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
    </div>
    <div className="flex space-x-1">
      <span className="text-slate-600 animate-pulse">Checking session</span>
      <span className="text-blue-500 animate-bounce">.</span>
      <span className="text-purple-500 animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
      <span className="text-pink-500 animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
    </div>
  </div>
);

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      // For development, create a default admin user
      const defaultUser = {
        id: "EMP001",
        name: "John Admin",
        role: "admin" as const,
        email: "admin@example.com",
        password: "admin123"
      };
      setUser(defaultUser);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <AdvancedLoader />
      </div>
    );
  }

  return <>{children}</>;
}