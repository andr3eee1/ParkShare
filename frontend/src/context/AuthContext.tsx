import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe cross-platform storage wrapper
const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return await Storage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
    } else {
      await Storage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
    } else {
      await Storage.removeItem(key);
    }
  }
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  walletBalance?: number;
  role: string;
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
        const storedToken = await Storage.getItem('userToken');
        const storedUser = await Storage.getItem('userData');
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser === 'object') {
              setToken(storedToken);
              setUser(parsedUser);
            }
          } catch (parseError) {
            // Corrupted data, clear it
            await Storage.removeItem('userToken');
            await Storage.removeItem('userData');
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
    await Storage.setItem('userToken', tokenData);
    await Storage.setItem('userData', JSON.stringify(userData));
  };

  const updateUser = async (userData: User) => {
    setUser(userData);
    await Storage.setItem('userData', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await Storage.removeItem('userToken');
    await Storage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
