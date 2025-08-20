import { DatabaseService } from './database';

const STORAGE_KEY = 'smartPrintingUser';
const PROFILE_PICTURE_KEY = 'smartPrintingProfilePicture';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Client-side function - only uses localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
  }
  
  return null;
};

// Client-side function - only uses localStorage
export const getProfilePicture = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = getCurrentUser();
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    
    // Fallback to localStorage
    return localStorage.getItem(PROFILE_PICTURE_KEY);
  } catch (error) {
    console.error('Error getting profile picture:', error);
    return localStorage.getItem(PROFILE_PICTURE_KEY);
  }
};

// Client-side function - only uses localStorage
export const loginUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const user: User = {
    id: 'temp-id-' + Date.now(),
    ...userData
  };
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (user.profilePicture) {
      localStorage.setItem(PROFILE_PICTURE_KEY, user.profilePicture);
    }
  }
  
  return user;
};

// Validate user credentials against database
export const validateCredentials = async (identifier: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    const user = users.find((u: any) => {
      // Allow login with email or ID
      const idMatch = u.id === identifier;
      const emailMatch = u.email === identifier;
      const passwordMatch = u.password === password;
      
      return (idMatch || emailMatch) && passwordMatch;
    });
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
};

// Logout user
export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_PICTURE_KEY);
  }
};

// Legacy functions for backward compatibility
export const getUser = (): User | null => {
  return getCurrentUser();
};

export const clearUser = (): void => {
  logoutUser();
};

export const updateUserProfile = (updates: Partial<Omit<User, 'id'>>): User | null => {
  const user = getUser();
  if (!user) return null;
  
  const updatedUser = { ...user, ...updates };
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    if (updatedUser.profilePicture) {
      localStorage.setItem(PROFILE_PICTURE_KEY, updatedUser.profilePicture);
    }
  }
  
  return updatedUser;
};

export const updateProfilePicture = (profilePicture: string): User | null => {
  const user = getUser();
  if (!user) return null;
  
  const updatedUser = { ...user, profilePicture };
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(PROFILE_PICTURE_KEY, profilePicture);
  }
  
  return updatedUser;
};

export const updatePassword = (newPassword: string): void => {
  const user = getUser();
  if (!user) return;
  
  // Note: In a real app, this would update the password in the database
  // For now, we'll just log it for demonstration
  console.log('Password update requested for user:', user.email);
  
  // Store in localStorage for backward compatibility
  if (typeof window !== 'undefined') {
    const updatedUser = { ...user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }
};

// Server-side functions (these should only be called from API routes or server components)
export const getCurrentUserFromDatabase = async (): Promise<User | null> => {
  try {
    const users = await DatabaseService.getAllUsers();
    if (users.length > 0) {
      const dbUser = users[0];
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        profilePicture: dbUser.profilePicture || undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user from database:', error);
    return null;
  }
};

export const loginUserToDatabase = async (userData: Omit<User, 'id'>): Promise<User> => {
  try {
    // Create or get user from database
    let dbUser = await DatabaseService.getUserByEmail(userData.email);
    
    if (!dbUser) {
      dbUser = await DatabaseService.createUser(userData);
    }
    
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      profilePicture: dbUser.profilePicture || undefined
    };
    
    return user;
  } catch (error) {
    console.error('Error logging in user to database:', error);
    throw error;
  }
};
