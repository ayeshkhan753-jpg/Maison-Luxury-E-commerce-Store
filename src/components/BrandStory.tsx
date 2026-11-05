import React from 'react';
import { Compass, Feather, Award } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section id="atelier-story" className="py-24 bg-[#F5F2EB] border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image with architectural frame */}
          <div className="relative aspect-[4/3] bg-stone-200 overflow-hidden shadow-lg">
            <img
              src="/src/assets/images/hero_luxury_editorial_1793861001211.jpg"
              alt="Maison Atelier Master Tailors"
              className="w-full h-full object-cover filter brightness-95"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-stone-900/10" />
            <div className="absolute bottom-6 left-6 bg-[#FAF8F5]/90 backdrop-blur-xs p-4 max-w-xs border border-stone-200">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">The Atelier Standard</span>
              <p className="font-serif text-sm font-bold text-stone-900 mt-1">
                "We do not design for seasons. We engineer garments for generations."
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Narrative */}
          <div className="flex flex-col justify-center">
            <span className="text-xs uppercase tracking-[0.25em] text-stone-500 font-semibold mb-3">
              Heritage & Craftsmanship
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight">
              Where Elegance Meets Everyday Luxury.
            </h2>
            <p className="text-stone-700 text-sm md:text-base font-light leading-relaxed mb-6">
              Founded on the belief that modern elegance should never be reserved solely for galas or state dinners, MAISON redefines everyday attire through an unwavering commitment to architectural tailoring and noble natural fibers.
            </p>
            <p className="text-stone-700 text-sm md:text-base font-light leading-relaxed mb-8">
              From our hand-combed Mongolian cashmere to pure mulberry silk woven along the historic riverbanks of Biella, Italy, every single garment represents hundreds of hours of precise tailoring, bias draping, and relentless inspection.
            </p>

            {/* Three Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-stone-300">
              <div>
                <Feather size={20} className="text-stone-900 mb-2" strokeWidth={1.5} />
                <h4 className="font-serif font-bold text-stone-900 text-base mb-1">Noble Fibers</h4>
                <p className="text-xs text-stone-600 leading-normal font-light">Zero synthetic fillers. 100% natural, ethically sourced fibers.</p>
              </div>
              <div>
                <Compass size={20} className="text-stone-900 mb-2" strokeWidth={1.5} />
                <h4 className="font-serif font-bold text-stone-900 text-base mb-1">Architectural Drape</h4>
                <p className="text-xs text-stone-600 leading-normal font-light">Proportions calculated to flatter natural form and fluid motion.</p>
              </div>
              <div>
                <Award size={20} className="text-stone-900 mb-2" strokeWidth={1.5} />
                <h4 className="font-serif font-bold text-stone-900 text-base mb-1">Lifetime Care</h4>
                <p className="text-xs text-stone-600 leading-normal font-light">Complimentary atelier repairs and maintenance for life.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
