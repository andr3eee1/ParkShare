const DEFAULT_API_URL = 'http://pana.com.ro:8745';
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
export const API_URL_SOURCE = configuredApiUrl ? 'environment' : 'fallback';

if (!configuredApiUrl) {
  console.warn(
    `[ParkShare] EXPO_PUBLIC_API_URL is not set. Using the deployed API at ${API_BASE_URL}. ` +
      'Set EXPO_PUBLIC_API_URL=http://localhost:8745 when running the backend locally.',
  );
}

export const getApiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;