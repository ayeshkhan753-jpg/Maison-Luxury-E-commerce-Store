import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
  onNewArrivals: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onNewArrivals }) => {
  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-stone-950">
      {/* Background Campaign Editorial Image */}
      <img
        src="/src/assets/images/hero_luxury_editorial_1793861001211.jpg"
        alt="MAISON Autumn/Winter Luxury Editorial Campaign"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95"
        referrerPolicy="no-referrer"
      />

      {/* Measured Scrim for WCAG AA Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white pt-12 pb-16">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] font-medium text-amber-200/90 mb-6 drop-shadow-sm">
          Autumn / Winter 2026 Collection
        </p>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl mx-auto text-balance drop-shadow-md mb-6">
          Elegance Is an Everyday Statement.
        </h1>

        <p className="text-stone-200 text-base md:text-lg lg:text-xl font-light tracking-wide max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
          Discover thoughtfully curated fashion pieces designed for timeless style and modern living.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#FAF8F5] text-stone-900 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-200 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Explore Collection
          </button>
          <button
            onClick={onNewArrivals}
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-white/60 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-white/10 hover:border-white transition-all duration-200 backdrop-blur-xs"
          >
            Discover New Arrivals
          </button>
        </div>

        {/* Hallmarks Trust Strip */}
        <div className="mt-16 pt-8 border-t border-white/15 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-stone-300 font-light tracking-wider uppercase">
          <div className="flex items-center justify-center gap-2">
            <span>Atelier Paris & Biella</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>Mongolian Cashmere & Silk</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>Complimentary Global Delivery</span>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <button
        onClick={onExplore}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors p-2"
        aria-label="Scroll to Catalog"
      >
        <ArrowDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
};
