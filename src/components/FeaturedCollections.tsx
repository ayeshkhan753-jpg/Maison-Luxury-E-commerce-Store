import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FeaturedCollectionsProps {
  onSelectCategory: (categorySlug: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ onSelectCategory }) => {
  const collections = [
    {
      slug: 'womens-clothing',
      title: "Women's Collection",
      subtitle: "Sculptural Draping & Fluid Silhouettes",
      image: '/src/assets/images/campaign_womens_couture_1793861001519.jpg',
      aspect: 'aspect-[3/4]',
    },
    {
      slug: 'mens-clothing',
      title: "Men's Sartorial Tailoring",
      subtitle: "Italian Biella Flannel & Unstructured Blazers",
      image: '/src/assets/images/campaign_mens_tailoring_1793861002197.jpg',
      aspect: 'aspect-[3/4]',
    },
    {
      slug: 'accessories',
      title: 'Handbags & Accessories',
      subtitle: 'Artisanal Box Calfskin & 24k Gold Accents',
      image: '/src/assets/images/campaign_luxury_accessories_1793861003226.jpg',
      aspect: 'aspect-[3/4]',
    },
  ];

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-stone-500 font-medium">
            Curated Edit
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mt-2">
            The Autumn / Winter Portfolios
          </h2>
        </div>
        <p className="text-stone-600 text-sm max-w-md mt-4 md:mt-0 font-light leading-relaxed">
          Each silhouette is cut with singular focus on proportion, tactile noble fibers, and longevity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {collections.map((col) => (
          <div
            key={col.slug}
            onClick={() => onSelectCategory(col.slug)}
            className="group cursor-pointer flex flex-col"
          >
            <div className="relative overflow-hidden bg-stone-100 aspect-[3/4] mb-5">
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/30 transition-colors" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-amber-200/90 block mb-1">
                  Discover Portfolio
                </span>
                <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
                  {col.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-600 tracking-wider">
                {col.subtitle}
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-stone-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
