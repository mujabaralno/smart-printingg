// AppHeader.tsx - Updated to work with SideNav
"use client";

import React, { useState, useEffect } from "react";
import { Settings, Shield, UserCheck, LogOut, User, X, Activity, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import { getCurrentUser, updateUserProfile, updateProfilePicture, updatePassword, convertToEmpFormat } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {ThemeToggle} from "../shared/ThemeToggle";

interface AppHeaderProps {
  className?: string;
  isNavbarExpanded?: boolean;
  onNavbarHover?: (isHovering: boolean) => void;
  onNavbarToggle?: () => void;
  isNavbarOpen?: boolean;
}

export default function AppHeader({ className = "", onNavbarHover, onNavbarToggle, isNavbarOpen }: AppHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Modal states
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    status: "Loading...",
    uptime: "Loading...",
    lastIncident: "Loading...",
    services: [
      { name: "Database", status: "Loading...", uptime: "Loading..." },
      { name: "API Services", status: "Loading...", uptime: "Loading..." },
      { name: "File Storage", status: "Loading...", uptime: "Loading..." },
      { name: "Print Queue", status: "Loading...", uptime: "Loading..." }
    ]
  });
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    // Load user data
    const loadUser = async () => {
      try {
        console.log('Loading user data...');
        const u = getCurrentUser();
        console.log('User data loaded:', u);
        if (u) {
          setUser(u);
          setProfileForm({
            name: u.name || "",
            email: u.email || "",
            role: u.role || ""
          });
          setProfilePicture(u.profilePicture || "");
        } else {
          console.log('No user data found, setting default user');
          // Set a default user for testing
          const defaultUser = {
            id: "1",
            name: "John Admin",
            email: "admin@smartprinting.com",
            role: "admin"
          };
          setUser(defaultUser);
          setProfileForm({
            name: defaultUser.name,
            email: defaultUser.email,
            role: defaultUser.role
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  // Mobile scroll detection for header hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only apply scroll behavior on mobile
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down and past initial 100px - hide header
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show header
          setIsHeaderVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Mobile scroll detection for header hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only apply scroll behavior on mobile
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down and past initial 100px - hide header
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show header
          setIsHeaderVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Separate useEffect for the timer to prevent infinite loops
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAccountDropdown && !target.closest('.account-dropdown-container') && !target.closest('.account-dropdown')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      setIsLoadingSystemStatus(true);
      const response = await fetch('/api/system-metrics');
      if (response.ok) {
        const data = await response.json();
        
        const transformedStatus = {
          status: data.status === 'healthy' ? 'Operational' : 'Issues Detected',
          uptime: data.database.responseTime,
          lastIncident: data.errorSummary?.lastError || 'None',
          services: [
            { 
              name: "Database", 
              status: data.database.status, 
              uptime: data.database.responseTime 
            },
            { 
              name: "API Services", 
              status: data.performance.averageQueryTime, 
              uptime: data.performance.averageQueryTime 
            },
            { 
              name: "File Storage", 
              status: data.storage.projectSize, 
              uptime: data.storage.projectSize 
            },
            { 
              name: "Print Queue", 
              status: data.metrics.quotes.pending > 0 ? 'Active' : 'Idle', 
              uptime: `${data.metrics.quotes.pending} pending` 
            }
          ]
        };
        
        setSystemStatus(transformedStatus);
      } else {
        console.error('Failed to fetch system metrics');
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setIsLoadingSystemStatus(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (profileForm.name.trim()) {
      try {
        const updatedUser = await updateUserProfile({
          name: profileForm.name,
          email: profileForm.email
        });
        
        if (profilePicture && profilePicture !== user?.profilePicture) {
          await updateProfilePicture(profilePicture);
        }
        
        if (updatedUser) {
          setUser(updatedUser);
          console.log('Profile updated successfully');
          setShowAccountSettings(false);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      console.error('Please enter a valid name');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword === passwordForm.confirmPassword && 
        passwordForm.newPassword.length >= 6) {
      try {
        const success = await updatePassword(passwordForm.newPassword);
        if (success) {
          console.log('Password updated successfully');
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
          setShowChangePassword(false);
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        } else {
          console.error('Failed to update password');
        }
      } catch (error) {
        console.error('Error updating password:', error);
      }
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      console.error('New passwords do not match');
    } else if (passwordForm.newPassword.length < 6) {
      console.error('Password must be at least 6 characters long');
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        console.error('Profile picture must be less than 2MB. Please choose a smaller image.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        console.error('Please select an image file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        if (result.length > 500000) {
          try {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              const maxSize = 200;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              ctx?.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              
              setProfilePicture(compressedDataUrl);
            };
            img.src = result;
          } catch (error) {
            console.error('Error compressing image:', error);
            setProfilePicture(result);
          }
        } else {
          setProfilePicture(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <header 
        className={cn(
          "bg-white border-b border-gray-200 overflow-visible w-full transition-all duration-300 ease-in-out hover:border-gray-300 hover:bg-gray-50/50",
          // Mobile: fixed positioning with scroll behavior, Desktop: relative positioning
          "lg:relative lg:z-40 fixed top-0 left-0 right-0 z-50 shadow-sm",
          // Mobile scroll behavior
          "lg:transform-none",
          isHeaderVisible ? "transform-none" : "-translate-y-full",
          className
        )}
        // Desktop hover detection for navbar auto-expand
        onMouseEnter={() => onNavbarHover?.(true)}
        onMouseLeave={() => onNavbarHover?.(false)}
      >
        {/* Mobile Layout - Hidden as SideNav handles mobile */}
        <div className="lg:hidden transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-sm border-b border-gray-100">
          {/* Top Row - Navbar Button and Search Bar */}
          <div className="px-4 py-3 transition-all duration-300 ease-in-out">
            <div className="flex items-center space-x-2 w-full min-w-0 transition-all duration-300 ease-in-out">
              {/* Mobile Navbar Toggle Button */}
              <button
                onClick={onNavbarToggle}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                aria-label="Toggle navigation menu"
              >
                <div className="relative w-5 h-5 transition-all duration-300 ease-in-out">
                  {isNavbarOpen ? (
                    <ChevronLeft className="w-5 h-5 text-gray-600 transition-all duration-300 ease-in-out transform rotate-180" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 transition-all duration-300 ease-in-out transform rotate-0" />
                  )}
                </div>
              </button>
              
              {/* Search Bar */}
              <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
                <GlobalSearch />
              </div>
            </div>
          </div>

          {/* Bottom Row - User Info and Time */}
          <div className="px-4 pb-3 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between min-w-0 transition-all duration-300 ease-in-out">
              {/* Time Display */}
              {mounted && currentTime && (
                <div className="text-left min-w-0 flex-shrink-0 transition-all duration-300 ease-in-out">
                  <div className="text-sm font-medium text-gray-600 truncate transition-all duration-300 ease-in-out">{formatDate(currentTime)}</div>
                  <div className="text-xs text-gray-500 truncate transition-all duration-300 ease-in-out">{formatTime(currentTime)}</div>
                </div>
              )}

              {/* User Info and Profile Picture */}
              <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end transition-all duration-300 ease-in-out">
                <div className="text-right min-w-0 flex-shrink-0 transition-all duration-300 ease-in-out">
                  <div className="text-sm font-medium text-gray-900 truncate transition-all duration-300 ease-in-out">{user?.name || "John Admin"}</div>
                  <div className="text-xs text-gray-500 truncate transition-all duration-300 ease-in-out">ID: {convertToEmpFormat(user?.id || "1")}</div>
                </div>

                <div className="relative account-dropdown-container flex-shrink-0">
                  <button 
                    onClick={() => {
                      console.log('Profile picture clicked, current state:', showAccountDropdown);
                      setShowAccountDropdown(!showAccountDropdown);
                    }}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 ease-in-out transform",
                      showAccountDropdown 
                        ? "bg-purple-50 scale-105 shadow-md" 
                        : "hover:bg-gray-50 hover:scale-105 active:scale-95"
                    )}
                    aria-label="Account menu"
                  >
                    <div className={cn(
                      "w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out",
                      showAccountDropdown && "ring-2 ring-purple-300 ring-offset-2"
                    )}>
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover transition-all duration-300 ease-in-out"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs transition-all duration-300 ease-in-out">
                          {user?.name?.charAt(0)?.toUpperCase() || "J"}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between py-4 lg:ml-16">
          {/* Left Section - Search Bar */}
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-96 min-w-0">
              <GlobalSearch />
            </div>
          </div>

          {/* Right Section - Timestamp and Account */}
          <div className="flex items-center space-x-6 min-w-0 mr-20">
            {/* Timestamp with Vertical Separator */}
            {mounted && currentTime && (
              <div className="flex items-center space-x-3 text-gray-600 min-w-0">
                <div className="text-sm font-medium truncate">
                  {formatDate(currentTime)}
                </div>
                
                <div className="w-px h-6 bg-gray-300 flex-shrink-0"></div>
                
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="text-right min-w-0">
                    <div className="text-lg font-bold text-gray-800 truncate">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Local Time
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Section */}
            <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
              <div className="text-right min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user?.name || "John Admin"}</div>
                <div className="text-xs text-gray-500 truncate">ID: {convertToEmpFormat(user?.id || "1")}</div>
              </div>

              <div className="relative account-dropdown-container">
                <button 
                  onClick={() => {
                    console.log('Profile picture clicked, current state:', showAccountDropdown);
                    setShowAccountDropdown(!showAccountDropdown);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || "J"}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Account Dropdown - Single responsive dropdown */}
      {showAccountDropdown && (
        <div 
          className="fixed inset-0 z-40 account-dropdown"
          style={{ pointerEvents: 'none' }}
        >
          {/* Single responsive dropdown */}
          <div 
            className={cn(
              "absolute bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]",
              "right-4 top-[120px] lg:right-8 lg:top-[80px]"
            )}
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={() => {
                console.log('=== System Health Check Button Clicked ===');
                console.log('1. Current showSystemStatus:', showSystemStatus);
                console.log('2. Setting showAccountDropdown to false');
                setShowAccountDropdown(false);
                console.log('3. Setting showSystemStatus to true');
                setShowSystemStatus(true);
                console.log('4. Calling fetchSystemMetrics');
                fetchSystemMetrics();
                console.log('5. Button click handler completed');
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <Shield className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">System Health Check</span>
            </button>
            
            <button
              onClick={() => {
                console.log('=== Change Password Button Clicked ===');
                console.log('1. Current showChangePassword:', showChangePassword);
                console.log('2. Setting showAccountDropdown to false');
                setShowAccountDropdown(false);
                console.log('3. Setting showChangePassword to true');
                setShowChangePassword(true);
                console.log('4. Button click handler completed');
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
            >
              <UserCheck className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">Change Password</span>
            </button>
            
            <hr className="my-2 border-gray-200" />
            
            <button
              onClick={() => {
                console.log('=== Account Settings Button Clicked ===');
                console.log('1. Current showAccountSettings:', showAccountSettings);
                console.log('2. Setting showAccountDropdown to false');
                setShowAccountDropdown(false);
                console.log('3. Setting showAccountSettings to true');
                setShowAccountSettings(true);
                console.log('4. Button click handler completed');
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors text-left"
            >
              <Settings className="w-5 h-5 mr-3 text-gray-600 flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">Account Settings</span>
            </button>
            
            <hr className="my-2 border-gray-200" />
            
            <button
              onClick={() => {
                console.log('=== Logout Button Clicked ===');
                setShowAccountDropdown(false);
                handleLogout();
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 mr-3 text-red-600 flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Changes saved successfully!
        </div>
      )}

      {/* Modals remain the same... */}
      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowAccountSettings(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-blue-600" />
                Account Settings
              </h2>
              <button
                onClick={() => setShowAccountSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Profile Picture</Label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    placeholder="Enter your email"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-xs font-medium text-gray-700">Role</Label>
                  <Input
                    id="role"
                    value={profileForm.role}
                    disabled
                    className="mt-1 h-8 text-xs bg-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowAccountSettings(false)}
                className="px-3 py-1.5 h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileUpdate}
                className="px-3 py-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Health Check Modal */}
      {showSystemStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowSystemStatus(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-600" />
                Database Health Check
              </h2>
              <button
                onClick={() => setShowSystemStatus(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {isLoadingSystemStatus ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading database metrics...</span>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-800 text-sm leading-tight">
                          {systemStatus.status === 'Operational' ? 'Database Operational' : 'Database Issues Detected'}
                        </h3>
                        <p className="text-xs text-blue-600 leading-tight">Response Time: {systemStatus.uptime}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Database Services</h4>
                    <div className="space-y-2">
                      {systemStatus.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              service.status === 'Excellent' || service.status === 'Good' ? 'bg-green-500' : 
                              service.status === 'Fair' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium text-gray-700 text-sm">{service.name}</span>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${
                              service.status === 'Excellent' || service.status === 'Good' ? 'bg-green-100 text-green-700 border-green-200' :
                              service.status === 'Fair' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {service.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{service.uptime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-2">
              {!isLoadingSystemStatus && (
                <Button
                  onClick={fetchSystemMetrics}
                  disabled={isLoadingSystemStatus}
                  variant="outline"
                  className="px-3 py-1.5 h-7 text-xs"
                >
                  Refresh
                </Button>
              )}
              <Button
                onClick={() => setShowSystemStatus(false)}
                className="px-3 py-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowChangePassword(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                Change Password
              </h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <Label htmlFor="currentPassword" className="text-xs font-medium text-gray-700">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="text-xs font-medium text-gray-700">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="mt-1 h-8 text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(false)}
                className="px-3 py-1.5 h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="px-3 py-1.5 h-7 text-xs bg-green-600 hover:bg-green-700"
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}