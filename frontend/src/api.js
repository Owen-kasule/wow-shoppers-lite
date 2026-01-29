const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiGet(path, params) {
  const url = new URL(path, API_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString());
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return json;
}
