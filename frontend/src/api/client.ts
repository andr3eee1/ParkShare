import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8745',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Ignore storage errors
  }
  return config;
});

export const adminApi = async (token: string, path: string): Promise<any> => {
  const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8745';
  const response = await fetch(`${baseURL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Unable to load admin data');
  return body;
};

export const adminPost = async (token: string, path: string, payload: any = {}): Promise<any> => {
  const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8745';
  const response = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'Unable to apply admin action';
    throw new Error(message);
  }
  return body;
};
