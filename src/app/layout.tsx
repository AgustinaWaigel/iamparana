import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientlayout"; 
import AnalyticsProvider from './components/analyticsprovider';

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
      </body>
    </html>
  );
}
