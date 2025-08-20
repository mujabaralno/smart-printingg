"use client";

import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className = "" }: AppHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
  };

  return (
    <header className={cn(
      "flex items-center justify-between p-4 bg-white border-b border-gray-200",
      className
    )}>
      {/* Left Section - Enhanced Logo and Title */}
      <div className="flex items-center space-x-4">
        {/* Modern Logo Design */}
        <div className="relative group">
          {/* Main logo container with gradient and shadow */}
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-xl 
                         shadow-lg shadow-purple-500/25 flex items-center justify-center
                         transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-purple-500/30">
            {/* Printer icon with enhanced styling */}
            <Printer className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent rounded-xl blur-sm opacity-0 
                         group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Decorative accent */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 
                         rounded-full shadow-sm opacity-80"></div>
        </div>
        
        {/* Enhanced Title with Typography */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 
                         bg-clip-text text-transparent leading-tight">
            Smart Printing System
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
            Professional Print Management
          </p>
        </div>
      </div>

      {/* Right Section - Global Search and Timestamp */}
      <div className="flex items-center space-x-6">
        {/* Global Search Component */}
        <GlobalSearch />

        {/* Timestamp with Vertical Separator */}
        <div className="flex items-center space-x-3 text-gray-600">
          {/* Date on the left */}
          <div className="text-sm font-medium">
            {formatDate(currentTime)}
          </div>
          
          {/* Vertical separator line */}
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Time and Local Time label on the right */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                Local Time
              </div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
