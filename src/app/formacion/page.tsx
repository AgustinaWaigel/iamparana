import React from 'react';
import { Metadata } from 'next';
import { FormacionClient } from '@/app/formacion/components/formacion-client';
import { FormacionCardsGrid } from './components/formacion-cards-grid';
import { HeroSection } from '@/app/components/common/hero-section';
import { getDocumentsBySections, getLinksBySection } from '@/server/db/admin-repository';
import { listResourcePages } from '@/server/db/resource-pages-repository';
import { Rocket, Users, Heart, Sparkles, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Formación',
  description: 'Página del área de formación',
  openGraph: {
    title: 'Formación',
    description: 'Página del área de formación',
    url: 'https://iamparana.com.ar/formacion',
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
};

type UploadedDocument = {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  file_type: string | null;
};

type UploadedLink = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
};

type ResourcePageCard = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  template: string;
};

export default async function FormacionPage() {
  // La página de formación reúne documentos, enlaces y páginas de recursos.
  // Antes de renderizar, normaliza lo que viene de base de datos para evitar problemas de serialización.
  const [uploadedDocumentsRaw, uploadedLinksRaw, resourcePagesRaw] = await Promise.all([
    getDocumentsBySections(['formacion', 'temario', 'carta', 'otro']),
    getLinksBySection('formacion'),
    listResourcePages(),
  ]);

  // Turso puede devolver objetos con prototipo/metodos; los convertimos a POJO.
  const uploadedDocumentsRows = JSON.parse(JSON.stringify(uploadedDocumentsRaw)) as Array<Record<string, unknown>>;
  const uploadedLinksRows = JSON.parse(JSON.stringify(uploadedLinksRaw)) as Array<Record<string, unknown>>;
  const resourcePagesRows = JSON.parse(JSON.stringify(resourcePagesRaw)) as Array<Record<string, unknown>>;

  const uploadedDocuments = uploadedDocumentsRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      google_drive_url: item.google_drive_url ? String(item.google_drive_url) : null,
      file_type: item.file_type ? String(item.file_type) : null,
    }))
    .filter((item) => Boolean(item.google_drive_url));

  const uploadedLinks = uploadedLinksRows.map((item) => ({
    id: Number(item.id),
    title: String(item.title || ''),
    description: item.description ? String(item.description) : null,
    url: String(item.url || ''),
    icon: item.icon ? String(item.icon) : null,
  }));

  const resourcePages = resourcePagesRows
    .map((item) => ({
      id: Number(item.id),
      slug: String(item.slug || ''),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      template: String(item.template || 'gold'),
    }))
    .filter((item) => item.template === 'gold');

  const heroTextureUrl = '/assets/textures/formacion.webp';

  return (
    <FormacionClient>
      <div id="header"></div>
      
      {/* Encabezado principal del área de formación. */}
      <HeroSection
        title="Formación"
        textureUrl={heroTextureUrl}
        overlayColor="rgba(253, 224, 71, 0.7), rgba(250, 204, 21, 0.75)"
        gradientClass="from-yellow-600 to-yellow-500"
        description="Aquí podrás acceder a todos los recursos: presentaciones de talleres, el temario del año, la carta del Papa y mucho más."
        badges={["Documentos", "Presentaciones", "Enlaces", "Material actualizado"]}
        textColor="text-brand-brown"
      />

      <main className="px-4 py-12 md:py-16 max-w-7xl mx-auto">
        {/* Grilla principal de materiales y accesos rápidos. */}
        <FormacionCardsGrid uploadedDocuments={uploadedDocuments} uploadedLinks={uploadedLinks} resourcePages={resourcePages} />

        <section className="mb-20 rounded-3xl border border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 p-6 md:p-8">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Cada documento y enlace nuevo que subas desde el panel admin aparece en esta misma grilla de cards,
            junto a los recursos principales de Formacion.
          </p>
        </section>

        {/* Benefits Section */}
        <section className="bg-gradient-to-br from-[#fffcf8] to-[#fff5e6] border border-yellow-200 rounded-3xl p-10 md:p-14 mb-20 shadow-sm">
          <h3 className="text-3xl font-black text-brand-brown mb-10 text-center uppercase tracking-wide">
            ¿Por qué formarse?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <Rocket className="text-yellow-500" size={32} />
              </div>
              <h4 className="font-bold text-brand-brown text-lg mb-2">Crecimiento</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Desarrolla nuevas habilidades y competencias.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <Users className="text-yellow-500" size={32} />
              </div>
              <h4 className="font-bold text-brand-brown text-lg mb-2">Comunidad</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Conecta y aprende junto a otros animadores.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <Heart className="text-yellow-500" size={32} />
              </div>
              <h4 className="font-bold text-brand-brown text-lg mb-2">Impacto</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Multiplica tu influencia positiva en los grupos.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <Sparkles className="text-yellow-500" size={32} />
              </div>
              <h4 className="font-bold text-brand-brown text-lg mb-2">Inspiración</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Renuévate constantemente en la fe y la misión.</p>
            </div>
          </div>
        </section>

        {/* Inspirational Quote */}
        <section className="relative overflow-hidden bg-brand-brown p-10 md:p-14 rounded-3xl shadow-lg text-center">
          <Quote size={120} className="absolute text-white/5 -top-4 -left-4 -rotate-12" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-2xl md:text-4xl font-bold text-yellow-300 leading-snug italic mb-6">
              &ldquo;Mi caminito es el camino de una infancia espiritual, el camino de la confianza y de la entrega absoluta.&rdquo;
            </p>
            <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4 rounded-full"></div>
            <p className="text-lg md:text-xl text-white font-semibold uppercase tracking-widest">
              Santa Teresita
            </p>
          </div>
        </section>
        
      </main>
      <div id="footer"></div>
    </FormacionClient>
  );
}