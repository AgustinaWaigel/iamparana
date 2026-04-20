import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientlayout"; 
import AnalyticsProvider from '@/app/components/providers/analyticsprovider';
import { ServiceWorkerRegistration } from '@/app/components/common/service-worker-registration';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "IAM Paraná",
    template: "%s | IAM Paraná",
  },
  description: "Infancia y Adolescencia Misionera en Paraná.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IAM Paraná",
  },
  openGraph: {
    title: "IAM Paraná",
    description: "Infancia y Adolescencia Misionera en Paraná.",
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
    <html lang="es">
      <body
      
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
        <AnalyticsProvider />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
