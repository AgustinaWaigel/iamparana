import React from 'react';
import { Metadata, Viewport } from 'next';
import { AreaHero, AreaPage } from '@/app/components/common/area-hero';
import { BackToArea, MediaGallery, MediaNotice, type MediaItem } from '@/app/components/common/media-gallery';

export const viewport: Viewport = {
  themeColor: '#622d0d',
};

export const metadata: Metadata = {
  title: 'Logos',
  description: 'Logos para tus encuentros',
  openGraph: {
    title: 'Logos',
    description: 'Logos para tus encuentros',
    url: 'https://iamparana.com.ar/comunicacion/logos',
    images: [
      {
        url: 'https://iamparana.com.ar/logoiam.jpg',
        alt: 'Logo IAM Paraná',
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/assets/resources/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Logos',
  },
};

const LOGOS: MediaItem[] = [
  { src: '/assets/multimedia/logo año jubilar.png', alt: 'Logo Año Jubilar', href: '/assets/multimedia/logo año jubilar.png', action: 'Descargar', download: true },
  { src: '/assets/multimedia/logo-iam-arq-parana.png', alt: 'Logo IAM Paraná', href: '/assets/multimedia/logo-iam-arq-parana.png', action: 'Descargar', download: true },
  { src: '/assets/multimedia/logo iam nuevo redondo.png', alt: 'Logo IAM Redondo', href: '/assets/multimedia/logo iam nuevo redondo.png', action: 'Descargar', download: true },
  { src: '/assets/multimedia/logo año diocesano.png', alt: 'Logo Año Diocesano', href: '/assets/multimedia/logo año diocesano.png', action: 'Descargar', download: true },
];

export default function LogosPage() {
  return (
    <AreaPage hero={<AreaHero area="comunicacion" title="Logos" crumbs={[]} />}>
      <MediaGallery items={LOGOS} />

      <MediaNotice>
        © IAM Paraná. Todos los derechos reservados. Las imágenes, logotipos y
        dibujos expuestos en esta página son propiedad intelectual de sus
        respectivos autores. Como animadores podemos utilizarlos para realizar
        actividades en los encuentros, invitaciones o subirlos a redes
        sociales, pero no sería bueno que los utilicemos de manera comercial,
        o con fines de lucro. A Diosito no le gusta que robes.
      </MediaNotice>

      <BackToArea area="comunicacion" />
    </AreaPage>
  );
}
