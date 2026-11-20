import { useState, useEffect } from 'react';

export interface UserSession {
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  token?: string;
  role?: string;
  loginTime?: string;
}

const AUTH_STORAGE_KEY = 'securitas_auth_session';

/**
 * Retrieve current user session from LocalStorage
 */
export const getStoredAuth = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Check synchronously if user is currently logged in
 */
export const isUserLoggedIn = (): boolean => {
  return getStoredAuth() !== null;
};

/**
 * Log in a user and persist session across tabs & reload
 */
export const loginUser = (user?: Partial<UserSession>): UserSession => {
  const fallbackName = user?.email
    ? user.email.split('@')[0].replace(/[._]/g, ' ')
    : user?.phone
    ? `User (${user.phone.slice(-4)})`
    : 'Aditya Raghav';

  const capitalizedName = fallbackName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const session: UserSession = {
    name: user?.name || capitalizedName,
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'rohan.sharma@example.com',
    avatar: (user?.name || capitalizedName)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    token: `sec_token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: user?.role || 'client',
    loginTime: new Date().toISOString(),
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('securitas_auth_change', { detail: session }));
  } catch (err) {
    console.error('Failed to store auth session:', err);
  }

  return session;
};

/**
 * Log out user and clear session
 */
export const logoutUser = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('securitas_auth_change', { detail: null }));
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
};

/**
 * React hook to subscribe to authentication state reactively
 */
export const useAuth = () => {
  const [user, setUser] = useState<UserSession | null>(getStoredAuth);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e && e.detail !== undefined) {
        setUser(e.detail);
      } else {
        setUser(getStoredAuth());
      }
    };

    window.addEventListener('securitas_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('securitas_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    login: loginUser,
    logout: logoutUser,
  };
};

export default useAuth;

