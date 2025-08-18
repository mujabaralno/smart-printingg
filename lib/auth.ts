// lib/auth.ts
export type Role = "admin" | "estimator" | "user";

export interface LoggedInUser {
  id: string;          // contoh: EMP001
  name: string;        // contoh: Admin User
  role: Role;          // "admin" | "estimator"
  email: string;       // untuk login dummy
  password: string;    // untuk login dummy
  profilePicture?: string; // base64 encoded profile picture
}

const STORAGE_KEY = "demo_user";
const PROFILE_PICTURE_KEY = "demo_user_profile_picture";

export function getUser(): LoggedInUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const user = raw ? (JSON.parse(raw) as LoggedInUser) : null;
    
    // Load profile picture if exists
    if (user) {
      const profilePicture = localStorage.getItem(PROFILE_PICTURE_KEY);
      if (profilePicture) {
        user.profilePicture = profilePicture;
      }
    }
    
    return user;
  } catch {
    return null;
  }
}

export function setUser(user: LoggedInUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  
  // Store profile picture separately if exists
  if (user.profilePicture) {
    localStorage.setItem(PROFILE_PICTURE_KEY, user.profilePicture);
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_PICTURE_KEY);
}

export function updatePassword(newPassword: string) {
  const u = getUser();
  if (!u) return;
  setUser({ ...u, password: newPassword });
}

export function updateUserProfile(updates: Partial<Omit<LoggedInUser, 'id' | 'password'>>) {
  const u = getUser();
  if (!u) return;
  const updatedUser = { ...u, ...updates };
  setUser(updatedUser);
  return updatedUser;
}

export function updateProfilePicture(profilePicture: string) {
  const u = getUser();
  if (!u) return;
  const updatedUser = { ...u, profilePicture };
  setUser(updatedUser);
  return updatedUser;
}
