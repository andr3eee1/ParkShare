import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';

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
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser === 'object') {
              setToken(storedToken);
              setUser(parsedUser);

              // Fetch the latest user profile to sync wallet balance and other data
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
                    setUser(data.user);
                    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                  }
                } else if (response.status === 404) {
                  // Fallback: If /auth/me is not deployed yet, use PUT /profile with empty body
                  const fallbackResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${storedToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}),
                  });
                  if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.user) {
                      setUser(fallbackData.user);
                      await AsyncStorage.setItem('userData', JSON.stringify(fallbackData.user));
                    }
                  }
                }
              } catch (networkError) {
                console.warn('Could not sync user profile from server:', networkError);
              }
            }
          } catch (parseError) {
            // Corrupted data, clear it
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
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
