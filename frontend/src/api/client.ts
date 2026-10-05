export const API_BASE_URL = 'http://pana.com.ro:8745';

export const adminApi = async (token: string, path: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Unable to load admin data');
  return body;
};