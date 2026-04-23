import React from 'react';

interface HeroSectionProps {
  title: string;
  textureUrl: string;
  gradientClass: string; // e.g., "from-yellow-600 to-yellow-500"
  overlayColor: string; // e.g., "rgba(253, 224, 71, 0.7), rgba(250, 204, 21, 0.75)"
  description?: string;
  badges?: string[];
  textColor?: string; // e.g., "text-brand-brown" or "text-white"
  template?: 'gold' | 'ocean' | 'blue' | 'earth';
}

export function HeroSection({
  title,
  textureUrl,
  gradientClass,
  overlayColor,
  description,
  badges,
  textColor = 'text-brand-brown',
  template = 'gold',
}: HeroSectionProps) {
  return (
    <>
      {/* PORTADA - Hero Section */}
      <div
        className={`relative overflow-hidden px-6 py-20 md:px-12 md:py-32 shadow-inner`}
        style={{
          backgroundImage: `linear-gradient(90deg, ${overlayColor}), url("${textureUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)]" />
        <h1 className={`relative text-6xl md:text-9xl font-black ${textColor} text-center uppercase tracking-tighter drop-shadow-sm`}>
          <span className="font-light block">{title}</span>
        </h1>
      </div>

      {/* Description Section */}
      {(description || badges) && (
        <main className="md:pt-16 max-w-7xl mx-auto">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            {description && (
              <p className="text-xl text-brown-700 leading-relaxed font-medium">
                {description}
              </p>
            )}
            {badges && badges.length > 0 && (
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs sm:text-sm font-semibold text-brand-brown">
                {badges.map((badge, idx) => (
                  <span key={idx} className="rounded-full bg-white px-3 py-1 border border-gray-200">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}
