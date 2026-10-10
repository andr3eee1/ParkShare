import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getApiUrl } from './config';

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
  const response = await fetch(getApiUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiRequestError(body.error || 'Unable to load admin data', response.status);
  return body;
};

export const adminPost = async (token: string, path: string, payload: any = {}): Promise<any> => {
  const response = await fetch(getApiUrl(path), {
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
    throw new ApiRequestError(message, response.status);
  }
  return body;
};

export type BackendHealth = {
  status?: 'ok' | 'degraded';
  database?: 'connected' | 'unavailable';
  time?: string;
};

export const checkBackendHealth = async (): Promise<BackendHealth> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(getApiUrl('/health'), { signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (body.status === 'degraded') return body;
      throw new ApiRequestError(body.error || 'Backend health check failed', response.status);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
};
