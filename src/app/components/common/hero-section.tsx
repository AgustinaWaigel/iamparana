import React from 'react';

interface HeroSectionProps {
  title: string;
  textureUrl: string;
  gradientClass: string; // e.g., "from-yellow-600 to-yellow-500"
  overlayColor: string; // e.g., "rgba(253, 224, 71, 0.7), rgba(250, 204, 21, 0.75)"
  description?: string;
  textColor?: string; // e.g., "text-brand-brown" or "text-white"
  template?: 'gold' | 'ocean' | 'blue' | 'earth';
}

export function HeroSection({
  title,
  textureUrl,
  gradientClass,
  overlayColor,
  description,
  textColor = 'text-brand-brown',
  template = 'gold',
}: HeroSectionProps) {
  return (
    <>
      {/* PORTADA - Hero Section */}
      <div
        className="relative flex min-h-[220px] items-center justify-center overflow-hidden px-4 py-12 shadow-inner sm:min-h-[280px] sm:px-6 sm:py-16 md:min-h-[380px] md:px-12 md:py-24"
        style={{
          backgroundImage: `linear-gradient(90deg, ${overlayColor}), url("${textureUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)]" />
        <h1 className={`relative m-0 w-full max-w-6xl text-center font-black ${textColor} uppercase tracking-tighter drop-shadow-sm`}>
          <span className="block break-words text-[clamp(2.25rem,12vw,4rem)] font-light leading-[0.95] sm:text-7xl md:text-8xl lg:text-9xl [overflow-wrap:anywhere]">{title}</span>
        </h1>
      </div>

      {/* Description Section */}
      {(description) && (
        <main className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 sm:pt-10 md:pt-14">
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10 md:mb-12">
            {description && (
              <p className="text-base font-medium leading-relaxed text-brown-700 sm:text-lg md:text-xl">
                {description}
              </p>
            )}
            
          </div>
        </main>
      )}
    </>
  );
}
