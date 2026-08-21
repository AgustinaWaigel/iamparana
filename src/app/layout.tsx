import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./clientlayout";
import AnalyticsProvider from '@/app/components/providers/analyticsprovider';
import { ServiceWorkerRegistration } from '@/app/components/common/service-worker-registration';
import { BackButton } from '@/app/components/common/back-button';
import { PushNotificationsProvider } from '@/app/components/providers/push-notifications-provider';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import { PresenceHeartbeat } from '@/app/components/common/presence-heartbeat';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Este layout envuelve toda la aplicación: carga fuentes globales, estilos base,
// métricas, y el service worker para que el sitio funcione como una PWA.

export const metadata: Metadata = {
  title: {
    default: "IAM Paraná",
    template: "%s | IAM Paraná",
  },
  description: "Sitio oficial de Infancia y Adolescencia Misionera de Paraná: noticias, formación, juegos, canciones, espiritualidad y recursos para animadores.",
  applicationName: "IAM Paraná",
  keywords: ["IAM Paraná", "Infancia y Adolescencia Misionera", "misiones", "animadores", "Arquidiócesis de Paraná"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IAM Paraná",
  },
  openGraph: {
    title: "IAM Paraná",
    description: "Noticias, formación y recursos para la Infancia y Adolescencia Misionera de Paraná.",
    url: "https://iamparana.com.ar",
    siteName: "IAM Paraná",
    images: [
      {
        url: "https://iamparana.com.ar/logoiam.jpg",
        width: 1200,
        height: 630,
        alt: "IAM Paraná",
      },
    ],
    type: "website",
  },
  metadataBase: new URL("https://iamparana.com.ar"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // El HTML raíz define el idioma del sitio y monta los proveedores globales.
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'IAM Paraná',
              alternateName: 'Infancia y Adolescencia Misionera de Paraná',
              url: 'https://iamparana.com.ar',
              logo: 'https://iamparana.com.ar/assets/header/logoiam.jpg',
            }).replace(/</g, '\\u003c'),
          }}
        />
        <BackButton />
        <ClientLayout>{children}</ClientLayout>
        <AnalyticsProvider />
        <ServiceWorkerRegistration />
        <PushNotificationsProvider />
        <PresenceHeartbeat />
      </body>
    </html>
  );
}
