"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  SquarePen,
  FileText,
  Building2,
  Package,
  Users,
  Settings,
  Shield,
  UserCheck,
  LogOut,
  Home,
  ChevronRight,
  Monitor,
  Activity,
  User,
  X
} from "lucide-react";
import { getSidebarItems } from "@/constants";
import { getCurrentUser, logoutUser, updateUserProfile, updateProfilePicture, updatePassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";



interface SideNavProps {
  className?: string;
}

export default function SideNav({ className = "" }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState<"admin" | "estimator">("estimator");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = React.useState<any>(null);

  // Modal states
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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



  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await getCurrentUser();
        if (u?.role === "admin" || u?.role === "estimator") {
          setRole(u.role);
        }
        setUser(u);
        if (u) {
          setProfileForm({
            name: u.name || "",
            email: u.email || "",
            role: u.role || ""
          });
          setProfilePicture(u.profilePicture || "");
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  const sideBarItems = getSidebarItems(role);

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
      LayoutDashboardIcon: LayoutDashboard,
      SquarePenIcon: SquarePen,
      FileTextIcon: FileText,
      Building2Icon: Building2,
      PackageIcon: Package,
      UsersIcon: Users,
    };
    return iconMap[iconName] || LayoutDashboard;
  };

  // Auto-expand on hover when collapsed
  const handleMouseEnter = () => {
    if (!isExpanded) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isExpanded) {
      setIsHovered(false);
    }
  };

  // Determine if sidebar should be expanded
  const shouldExpand = isExpanded || isHovered;

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  const handleProfileUpdate = () => {
    if (profileForm.name.trim()) {
      const updatedUser = updateUserProfile({
        name: profileForm.name,
        email: profileForm.email
      });
      if (updatedUser) {
        setUser(updatedUser);
        setShowAccountSettings(false);
      }
    }
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword === passwordForm.confirmPassword && 
        passwordForm.newPassword.length >= 6) {
      updatePassword(passwordForm.newPassword);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setShowChangePassword(false);
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        updateProfilePicture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const systemStatus = {
    status: "Operational",
    uptime: "99.9%",
    lastIncident: "None",
    services: [
      { name: "Database", status: "Healthy", uptime: "99.99%" },
      { name: "API Services", status: "Healthy", uptime: "99.95%" },
      { name: "File Storage", status: "Healthy", uptime: "99.98%" },
      { name: "Print Queue", status: "Healthy", uptime: "99.97%" }
    ]
  };

  return (
    <>
      <aside 
        className={cn(
          "sticky top-0 left-0 h-screen bg-white border-r border-border/50",
          "shadow-lg transition-all duration-300 ease-out z-40",
          "hover:shadow-xl",
          shouldExpand ? "w-72" : "w-16",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* User Capsule */}
        <div className="p-4 border-b border-border/50">
          <div className={cn(
            "flex items-center space-x-3 transition-all duration-300",
            shouldExpand ? "justify-start" : "justify-center"
          )}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || "J"}
                </span>
              )}
            </div>
            
            {shouldExpand && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <div className="text-foreground font-semibold truncate">{user?.name || "John Admin"}</div>
                <div className="text-muted-foreground text-sm">ID: {user?.id || "EMP001"}</div>
                <div className="text-accent text-xs capitalize font-medium">{user?.role || "Admin"}</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sideBarItems.map((link, index) => {
            const isActive = pathname === link.route;
            const IconComponent = getIconComponent(link.icons.name);
            
            // Different icons for each navigation item with proper sizing
            const uniqueIcons = [
              <LayoutDashboard key="dashboard" className="w-5 h-5" />,
              <SquarePen key="create" className="w-5 h-5" />,
              <FileText key="quotes" className="w-5 h-5" />,
              <Building2 key="clients" className="w-5 h-5" />,
              <Package key="suppliers" className="w-5 h-5" />,
              <Users key="users" className="w-5 h-5" />
            ];
            
            return (
              <Link 
                key={link.label} 
                href={link.route}
                className="block"
                aria-label={link.label}
              >
                <div
                  className={cn(
                    "flex items-center transition-all duration-300 group rounded-xl",
                    shouldExpand ? "p-3" : "p-2 justify-center",
                    isActive 
                      ? "bg-primary text-white" 
                      : "hover:bg-blue-50 hover:text-blue-700",
                    "hover:scale-105"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    shouldExpand 
                      ? "w-8 h-8 rounded-xl" 
                      : "w-6 h-6 rounded-xl",
                    isActive 
                      ? "text-white" 
                      : "text-slate-600"
                  )}>
                    {uniqueIcons[index] || <IconComponent size={shouldExpand ? 16 : 14} />}
                  </div>
                  {shouldExpand && (
                    <span className={cn(
                      "ml-3 font-medium transition-opacity duration-300",
                      shouldExpand ? "opacity-100" : "opacity-0",
                      isActive ? "text-white" : "text-slate-600"
                    )}>
                      {link.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Account Section */}
        <div className="p-4 border-t border-slate-200">
          {shouldExpand && (
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
              ACCOUNT
            </div>
          )}
          <div className="space-y-2">
            <button 
              onClick={() => setShowAccountSettings(true)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                "hover:bg-blue-50 hover:text-blue-700",
                "text-slate-600"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              {shouldExpand && (
                <span className="text-sm ml-3 transition-opacity duration-300">
                  Account Settings
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowSystemStatus(true)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                "hover:bg-blue-50 hover:text-blue-700",
                "text-slate-600"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              {shouldExpand && (
                <span className="text-sm ml-3 transition-opacity duration-300">
                  System Status
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowChangePassword(true)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                "hover:bg-blue-50 hover:text-blue-700",
                "text-slate-600"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              {shouldExpand && (
                <span className="text-sm ml-3 transition-opacity duration-300">
                  Change Password
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                "hover:bg-red-50 hover:text-red-700",
                "text-red-600"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              {shouldExpand && (
                <span className="text-sm ml-3 transition-opacity duration-300">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAccountSettings(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Account Settings
              </h2>
              <button
                onClick={() => setShowAccountSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Profile Picture</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Upload a new profile picture</p>
                  </div>
                </div>
              </div>
              
              {/* User Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                  <Input
                    id="role"
                    value={profileForm.role}
                    disabled
                    className="mt-1 bg-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowAccountSettings(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Status Modal */}
      {showSystemStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSystemStatus(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                System Status
              </h2>
              <button
                onClick={() => setShowSystemStatus(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Overall Status */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-semibold text-green-800">All Systems Operational</h3>
                    <p className="text-sm text-green-600">System uptime: {systemStatus.uptime}</p>
                  </div>
                </div>
              </div>
              
              {/* Service Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Service Status</h4>
                <div className="space-y-2">
                  {systemStatus.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {service.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{service.uptime} uptime</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Last Incident */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Last Incident</h4>
                <p className="text-sm text-blue-600">{systemStatus.lastIncident}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <Button
                onClick={() => setShowSystemStatus(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowChangePassword(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                Change Password
              </h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
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
