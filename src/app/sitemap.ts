import type { MetadataRoute } from 'next';
import { getAllNoticiasSlugs } from '@/server/content/noticias';

const baseUrl = 'https://iamparana.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ['', '/noticias', '/animacion', '/animacion/juegos', '/animacion/canciones', '/formacion', '/comunicacion', '/espiritualidad', '/logistica', '/institucional'];
  const newsSlugs = await getAllNoticiasSlugs().catch(() => []);

  return [
    ...routes.map((route, index) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: index < 2 ? 'daily' as const : 'weekly' as const,
      priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.8,
    })),
    ...newsSlugs.map((slug) => ({
      url: `${baseUrl}/noticias/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
