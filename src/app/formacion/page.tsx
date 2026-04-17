import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { FormacionClient } from '@/app/components/formacion-client';
import { BookOpen, Mail, GraduationCap, Rocket, Users, Heart, Sparkles, Quote } from 'lucide-react';

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
      
      {/* Título Principal */}
      <div className="mt-16 bg-gradient-to-r from-yellow-300 to-yellow-400 py-10 px-5 shadow-inner">
        <h2 className="text-4xl md:text-5xl font-black text-brand-brown text-center uppercase tracking-tight">
          Formación
        </h2>
      </div>

      <main className="px-4 py-12 md:py-16 max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <p className="text-xl text-gray-700 leading-relaxed font-medium">
            Aquí podrás acceder a todos los recursos: presentaciones de talleres, el temario del año, la carta del Papa y mucho más. 
          </p>
          <p className="text-lg text-brand-brown/80 font-bold mt-4 uppercase tracking-wider">
            Misioneros... ¡A estudiar!
          </p>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          {/* Card 1: Temario */}
          <a
            href="https://drive.google.com/file/d/1FGd15NAkaXvkfaeyuwLZUgljkntrPJqs/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-yellow-200 to-yellow-400 h-40 flex items-center justify-center relative overflow-hidden">
              <BookOpen size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-2xl font-bold text-brand-brown mb-2">Temario 2025</h3>
              <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                Accede al temario completo de este año para prepararte y profundizar en los temas de animación.
              </p>
              <span className="block w-full text-center px-6 py-3 bg-yellow-300 text-brand-brown font-bold rounded-xl group-hover:bg-yellow-400 transition-colors">
                Descargar →
              </span>
            </div>
          </a>

          {/* Card 2: Carta del Papa */}
          <a
            href="https://www.vatican.va/content/francesco/es/messages/missions/documents/20250125-giornata-missionaria.html"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-yellow-200 to-yellow-400 h-40 flex items-center justify-center relative overflow-hidden">
              <Mail size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-2xl font-bold text-brand-brown mb-2">Carta del Papa</h3>
              <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                Palabras inspiradoras del Santo Padre para nuestro andar como misioneros y animadores.
              </p>
              <span className="block w-full text-center px-6 py-3 bg-yellow-300 text-brand-brown font-bold rounded-xl group-hover:bg-yellow-400 transition-colors">
                Leer Carta →
              </span>
            </div>
          </a>

          {/* Card 3: Formación de Animadores */}
          <Link
            href="/formacion/presentaciones"
            className="group flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden no-underline"
          >
            <div className="bg-gradient-to-br from-yellow-200 to-yellow-400 h-40 flex items-center justify-center relative overflow-hidden">
              <GraduationCap size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-2xl font-bold text-brand-brown mb-2">Presentaciones</h3>
              <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                Materiales de capacitación y diapositivas para potenciar tus habilidades como animador.
              </p>
              <span className="block w-full text-center px-6 py-3 bg-yellow-300 text-brand-brown font-bold rounded-xl group-hover:bg-yellow-400 transition-colors">
                Ver Recursos →
              </span>
            </div>
          </Link>
        </div>

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
    </>
  );

  return <FormacionClient>{content}</FormacionClient>;
}