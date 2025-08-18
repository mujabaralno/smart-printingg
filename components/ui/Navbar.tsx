"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Settings, 
  Shield, 
  UserCheck, 
  LogOut, 
  Camera,
  Info,
  AlertCircle,
  CheckCircle,
  Bell,
  X
} from "lucide-react";
import { getUser, clearUser, updatePassword, updateUserProfile, updateProfilePicture } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface NavbarProps {
  className?: string;
}

interface SystemStatus {
  status: 'operational' | 'maintenance' | 'degraded' | 'outage';
  message: string;
  lastUpdated: string;
  uptime: string;
  version: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const router = useRouter();
  const [user, setUserState] = useState(getUser());
  
  // Dialog states
  const [openAccountSettings, setOpenAccountSettings] = useState(false);
  const [openSystemStatus, setOpenSystemStatus] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  
  // Form states
  const [editUser, setEditUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'estimator'
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Mock system status data
  const systemStatus: SystemStatus = {
    status: 'operational',
    message: 'All systems are running normally',
    lastUpdated: new Date().toISOString(),
    uptime: '99.9%',
    version: 'v2.1.0'
  };

  // Additional system metrics
  const systemMetrics = {
    cpuUsage: '23%',
    memoryUsage: '45%',
    diskUsage: '67%',
    activeUsers: '12',
    totalQuotes: '1,247',
    pendingQuotes: '23',
    databaseConnections: '8/10'
  };

  useEffect(() => {
    setUserState(getUser());
  }, []);

  useEffect(() => {
    if (user) {
      setEditUser({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'estimator'
      });
      setProfilePicture(user.profilePicture || null);
    }
  }, [user]);

  const handleLogout = () => {
    clearUser();
    router.replace("/login");
  };

  const handleAccountSettings = () => {
    setOpenAccountSettings(true);
  };

  const handleSystemStatus = () => {
    setOpenSystemStatus(true);
  };

  const handleChangePassword = () => {
    setOpenChangePassword(true);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    // Validation
    if (!editUser.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        type: "error"
      });
      return;
    }
    
    if (!editUser.email.trim() || !editUser.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        type: "error"
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const updatedUser = updateUserProfile({
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        role: editUser.role as "admin" | "estimator"
      });
      
      if (updatedUser) {
        setUserState(updatedUser);
        setOpenAccountSettings(false);
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
          type: "success"
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        type: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    
    // In a real app, you'd verify current password with backend
    if (currentPassword !== user?.password) {
      setPasswordError('Current password is incorrect.');
      return;
    }
    
    try {
      updatePassword(newPassword);
      setOpenChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setPasswordError('');
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        type: "success"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update password. Please try again.",
        type: "error"
      });
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Profile picture must be less than 5MB.",
          type: "error"
        });
        return;
      }
      
      // File type validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          type: "error"
        });
        return;
      }
      
      setIsUploadingPicture(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const pictureData = e.target?.result as string;
        setProfilePicture(pictureData);
        
        // Persist profile picture to storage
        if (user) {
          try {
            updateProfilePicture(pictureData);
            toast({
              title: "Profile Picture Updated",
              description: "Your profile picture has been updated successfully.",
              type: "success"
            });
          } catch (error) {
            toast({
              title: "Update Failed",
              description: "Failed to update profile picture. Please try again.",
              type: "error"
            });
          }
        }
        setIsUploadingPicture(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          type: "error"
        });
        setIsUploadingPicture(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'maintenance':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'outage':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'degraded':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'outage':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      <nav className={cn("bg-white border-b border-gray-200 px-6 py-3", className)}>
        <div className="flex items-center justify-between">
          {/* Left Side - User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profilePicture || profilePicture ? (
                  <img 
                    src={user?.profilePicture || profilePicture || ''} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{user?.name ?? "User"}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role ?? "user"}</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              User ID: {user?.id ?? "EMP001"}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button 
              onClick={handleSystemStatus}
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
              title="System Status & Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {systemStatus.status !== 'operational' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="font-semibold">{user?.name ?? "User"}</span>
                    <span className="text-sm text-muted-foreground">{user?.email ?? "-"}</span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Role: <b className="capitalize">{user?.role}</b></span>
                      <span className="text-xs text-muted-foreground">ID: <b>{user?.id}</b></span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAccountSettings}>
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSystemStatus}>
                  <div className="flex items-center w-full">
                    <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>System Status</span>
                    <div className="ml-auto flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemStatus.status === 'operational' ? 'bg-green-500' : 
                        systemStatus.status === 'maintenance' ? 'bg-yellow-500' : 
                        systemStatus.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'
                      )} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {systemStatus.status}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChangePassword}>
                  <UserCheck className="w-4 h-4 mr-3 text-muted-foreground" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Account Settings Dialog */}
      <Dialog open={openAccountSettings} onOpenChange={setOpenAccountSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <span>Account Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profilePicture || profilePicture ? (
                    <img 
                      src={user?.profilePicture || profilePicture || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-3xl">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <label htmlFor="profile-picture" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploadingPicture ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    disabled={isUploadingPicture}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Click the camera icon to change profile picture</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as "admin" | "estimator" })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="estimator">Estimator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAccountSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Status Dialog */}
      <Dialog open={openSystemStatus} onOpenChange={setOpenSystemStatus}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>System Status</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Status Overview */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center space-x-3">
                {getStatusIcon(systemStatus.status)}
                <div>
                  <h3 className="font-semibold capitalize">{systemStatus.status}</h3>
                  <p className="text-sm text-muted-foreground">{systemStatus.message}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border",
                getStatusColor(systemStatus.status)
              )}>
                {systemStatus.status.toUpperCase()}
              </div>
            </div>

            {/* System Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-2">System Uptime</h4>
                <p className="text-2xl font-bold text-green-600">{systemStatus.uptime}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Current Version</h4>
                <p className="text-2xl font-bold text-blue-600">{systemStatus.version}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
                <span className="text-sm text-gray-600">
                  {new Date(systemStatus.lastUpdated).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Database Status</span>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">API Status</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
            </div>

            {/* System Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">System Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                    <span className="text-sm font-semibold text-blue-600">{systemMetrics.cpuUsage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: systemMetrics.cpuUsage }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                    <span className="text-sm font-semibold text-green-600">{systemMetrics.memoryUsage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: systemMetrics.memoryUsage }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                    <span className="text-sm font-semibold text-orange-600">{systemMetrics.diskUsage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: systemMetrics.diskUsage }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Users</span>
                    <span className="text-sm font-semibold text-purple-600">{systemMetrics.activeUsers}</span>
                  </div>
                  <div className="text-xs text-gray-500">Currently online</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Quotes</div>
                  <div className="text-2xl font-bold text-gray-900">{systemMetrics.totalQuotes}</div>
                  <div className="text-xs text-gray-500">All time</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Pending Quotes</div>
                  <div className="text-2xl font-bold text-yellow-600">{systemMetrics.pendingQuotes}</div>
                  <div className="text-xs text-gray-500">Awaiting approval</div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setOpenSystemStatus(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openChangePassword} onOpenChange={setOpenChangePassword}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Change Password</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenChangePassword(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
