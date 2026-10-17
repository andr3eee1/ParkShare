import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';
import { onUnauthorized } from '../api/client';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  walletBalance?: number;
  role: string;
  trustScore?: number;
  hostRating?: number;
  accountStatus?: 'ACTIVE' | 'WARNING' | 'SUSPENDED' | 'BANNED';
  suspendedUntil?: string | null;
  warningCount?: number;
  driverReviewsCount?: number;
  hostReviewsCount?: number;
  completedBookings?: number;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  updateUser: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Automatically log out when any API call returns 401 Unauthorized
    const unsubscribe = onUnauthorized(() => {
      console.warn('[AuthContext] Session expired, resetting user state.');
      setUser(null);
      setToken(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser === 'object') {
              // Fetch latest profile from server to validate session and sync state
              try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.user) {
                    setToken(storedToken);
                    setUser(data.user);
                    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                  } else {
                    setToken(storedToken);
                    setUser(parsedUser);
                  }
                } else if (response.status === 401 || response.status === 403 || response.status === 404) {
                  // Session is expired or invalid on the server! Invalidate immediately
                  console.warn('[AuthContext] Stored token is invalid or expired. Clearing session.');
                  await AsyncStorage.removeItem('userToken');
                  await AsyncStorage.removeItem('userData');
                  setUser(null);
                  setToken(null);
                } else {
                  // Other status (e.g. server down / offline): keep cached user for offline viewing
                  setToken(storedToken);
                  setUser(parsedUser);
                }
              } catch (networkError) {
                // Network error (offline): allow user to continue with cached session
                console.warn('Network offline, using cached session:', networkError);
                setToken(storedToken);
                setUser(parsedUser);
              }
            }
          } catch (parseError) {
            // Corrupted data, clear it
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setUser(null);
            setToken(null);
          }
        }
      } catch (e) {
        // Silently ignore storage access errors on first load
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const login = async (userData: User, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    await AsyncStorage.setItem('userToken', tokenData);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  const updateUser = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  const authContextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    updateUser,
    logout
  }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
