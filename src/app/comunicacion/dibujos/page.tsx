import React from "react";
import { Metadata, Viewport } from "next";
import { AreaHero, AreaPage } from '@/app/components/common/area-hero';
import { BackToArea, MediaGallery, MediaNotice, type MediaItem } from '@/app/components/common/media-gallery';

export const viewport: Viewport = {
  themeColor: "#622d0d",
};

export const metadata: Metadata = {
  title: "Dibujos",
  description: "Dibujos para tus encuentros",
  openGraph: {
    title: "Dibujos",
    description: "Dibujos para tus encuentros",
    url: "https://iamparana.com/comunicacion/dibujos.html",
    images: [
      {
        url: "https://iamparana.com/logoiam.jpg",
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/assets/resources/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dibujos",
  },
};

const DIBUJOS: MediaItem[] = [
  { src: '/assets/multimedia/Cris-camargo.webp', alt: 'Cris Camargo', href: 'https://drive.google.com/drive/folders/1yzOjbr51Xu--V3C3Vfj2F10n_8Y8mAu-', action: 'Ver Cris' },
  { src: '/assets/multimedia/fano.webp', alt: 'Fano', href: 'https://drive.google.com/drive/folders/1u-0qXHkreinOLw63rgi4jVaqeGGZ4mA2', action: 'Ver Fano' },
  { src: '/assets/multimedia/para colorear.webp', alt: 'Para colorear', href: 'https://drive.google.com/drive/folders/1p2etdR43EDnZqm_jkLefMc60jbANlgSG', action: 'Ver para colorear' },
];

export default function DibujosPage() {
  return (
    <AreaPage hero={<AreaHero area="comunicacion" title="Dibujos" crumbs={[]} />}>
      <MediaGallery items={DIBUJOS} />

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
