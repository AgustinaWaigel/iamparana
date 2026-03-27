export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  return 'http://localhost:3000'; // fallback
}

export async function fetchAPI<T>(endpoint: string): Promise<T[]> {
  try {
    const url = `${getBaseUrl()}${endpoint}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}
