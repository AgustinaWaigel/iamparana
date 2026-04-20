export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }

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
    const res = await fetch(
      url,
      typeof window === 'undefined'
        ? { next: { revalidate: 60 } }
        : { cache: 'no-store' }
    );
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    // Durante build, Next puede emitir errores esperados de uso dinámico.
    if (!(error && typeof error === 'object' && 'digest' in error && (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE')) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
    return [];
  }
}
