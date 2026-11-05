import React from 'react';

interface FooterProps {
  onSelectCategory: (categorySlug: string) => void;
  onOpenAccount: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAccount }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-20 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-stone-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif text-3xl font-bold tracking-[0.25em] text-white uppercase">
              MAISON
            </h2>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200/90 font-medium">
              Where Elegance Meets Everyday Luxury.
            </p>
            <p className="text-stone-400 text-xs font-light leading-relaxed max-w-sm pt-2">
              An international luxury fashion house dedicated to pure noble fibers, master Italian tailoring, and architectural silhouettes designed to transcend seasons.
            </p>
            <div className="pt-2 text-xs text-stone-500 tracking-wider">
              <span>Atelier Paris</span> · <span>New York</span> · <span>Milan</span> · <span>London</span> · <span>Tokyo</span>
            </div>
          </div>

          {/* Column: Collections */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-4">
              Atelier Collections
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onSelectCategory('womens-clothing')}
                  className="hover:text-white transition-colors"
                >
                  Women's Couture
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('mens-clothing')}
                  className="hover:text-white transition-colors"
                >
                  Men's Sartorial Tailoring
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('outerwear')}
                  className="hover:text-white transition-colors"
                >
                  Cashmere Outerwear
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('accessories')}
                  className="hover:text-white transition-colors"
                >
                  Artisanal Handbags
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('shoes')}
                  className="hover:text-white transition-colors"
                >
                  Footwear Atelier
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Patron Services */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-4">
              Clientèle Care
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button onClick={onOpenAccount} className="hover:text-white transition-colors">
                  Patron Portal & Orders
                </button>
              </li>
              <li>
                <a href="#atelier-story" className="hover:text-white transition-colors">
                  Garment Care & Storage
                </a>
              </li>
              <li>
                <span className="text-stone-500">White-Glove Courier Policy</span>
              </li>
              <li>
                <span className="text-stone-500">30-Day Atelier Returns</span>
              </li>
              <li>
                <span className="text-stone-500">Lifetime Craftsmanship Warranty</span>
              </li>
            </ul>
          </div>

          {/* Column: Global Flagships */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-4">
              Private Salons
            </h3>
            <div className="space-y-3 text-xs text-stone-400 font-light">
              <div>
                <strong className="text-stone-200 block font-normal">Paris Atelier</strong>
                <span>18 Rue du Faubourg Saint-Honoré</span>
              </div>
              <div>
                <strong className="text-stone-200 block font-normal">New York Flagship</strong>
                <span>740 Madison Avenue, Manhattan</span>
              </div>
              <div>
                <strong className="text-stone-200 block font-normal">Milan Showroom</strong>
                <span>Via Monte Napoleone 8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© 2026 MAISON Atelier & Co. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>Code of Noble Materials</span>
            <span>·</span>
            <span>Python 3.10 Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
