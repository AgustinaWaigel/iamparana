import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { FormacionClient } from '@/components/formacion-client';

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

export default function FormacionPage() {
  const content = (
    <>
      <div id="header"></div>
      <h2 className="mt-16 py-8 px-5 text-3xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-400 text-black text-center">Formación</h2>
      <main className="px-4 py-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-16">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Aquí podrás acceder a todos los recursos de formación: presentaciones de talleres, temario del año, la carta del Papa y mucho más. Es muy importante que podamos seguir actualizándonos y formándonos como animadores. Misioneros... ¡A estudiar!
          </p>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Temario */}
          <a
            href="https://drive.google.com/file/d/1FGd15NAkaXvkfaeyuwLZUgljkntrPJqs/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-yellow-300 overflow-hidden group"
          >
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-36 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-6xl">📘</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-brand-brown mb-3">Temario 2025</h3>
              <p className="text-gray-600 mb-4">Accede al temario completo de este año para prepararte y profundizar en los temas de animación.</p>
              <button className="w-full px-6 py-2 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                Descargar →
              </button>
            </div>
          </a>

          {/* Card 2: Carta del Papa */}
          <a
            href="https://www.vatican.va/content/francesco/es/messages/missions/documents/20250125-giornata-missionaria.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-yellow-300 overflow-hidden group"
          >
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-36 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-6xl">✉️</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-brand-brown mb-3">Carta del Papa</h3>
              <p className="text-gray-600 mb-4">Palabras inspiradoras del Santo Padre para nuestro andar como misioneros y animadores.</p>
              <button className="w-full px-6 py-2 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                Leer Carta →
              </button>
            </div>
          </a>

          {/* Card 3: Formación de Animadores */}
          <Link
            href="/formacion/presentaciones"
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-yellow-300 overflow-hidden group no-underline"
          >
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-36 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-6xl">🎓</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-brand-brown mb-3">Formación de Animadores</h3>
              <p className="text-gray-600 mb-4">Presentaciones y materiales de capacitación para potenciar tus habilidades como animador.</p>
              <button className="w-full px-6 py-2 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                Ver Recursos →
              </button>
            </div>
          </Link>
        </div>

        {/* Benefits Section */}
        <section className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-2xl p-10 mb-16">
          <h3 className="text-3xl font-bold text-brand-brown mb-8 text-center">Por qué formarse</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h4 className="font-bold text-brand-brown mb-2">Crecimiento</h4>
              <p className="text-gray-700 text-sm">Desarrolla nuevas habilidades y competencias</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h4 className="font-bold text-brand-brown mb-2">Comunidad</h4>
              <p className="text-gray-700 text-sm">Conecta con otros animadores</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💪</div>
              <h4 className="font-bold text-brand-brown mb-2">Impacto</h4>
              <p className="text-gray-700 text-sm">Multiplica tu influencia positiva</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="font-bold text-brand-brown mb-2">Inspiración</h4>
              <p className="text-gray-700 text-sm">Renúevate en fe y misión</p>
            </div>
          </div>
        </section>

        {/* Inspirational Quote */}
        <section className="border-l-8 border-yellow-300 bg-gradient-to-r from-yellow-50 to-transparent p-8 rounded-lg">
          <p className="text-3xl font-bold text-brand-brown italic">
            &ldquo;Mi caminito es el camino de una infancia espiritual, el camino de la confianza y de la entrega absoluta.&rdquo;
          </p>
          <p className="text-xl text-gray-700 mt-4 font-semibold">– Santa Teresita</p>
        </section>
      </main>
      <div id="footer"></div>
    </>
  );

  return <FormacionClient>{content}</FormacionClient>;
}
