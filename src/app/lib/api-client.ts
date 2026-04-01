export function getBaseUrl() {
  // Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Siempre usar localhost:3000 (válido tanto en cliente como en servidor)
  return 'http://localhost:3000';
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
