import React from 'react';
import { Search, Heart, ShoppingBag, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  currentUser: User | null;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (categorySlug: string) => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  onOpenAdmin,
  onSelectCategory,
  onToggleSearch,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-serif text-3xl font-bold tracking-[0.25em] text-stone-900 uppercase whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          MAISON
        </a>

        {/* Zone 2: Clean 4–5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-[0.18em] uppercase font-medium text-stone-700">
          <button
            onClick={() => onSelectCategory('all')}
            className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
          >
            Collections
          </button>
          <button
            onClick={() => onSelectCategory('womens-clothing')}
            className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
          >
            Women
          </button>
          <button
            onClick={() => onSelectCategory('mens-clothing')}
            className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
          >
            Men
          </button>
          <button
            onClick={() => onSelectCategory('accessories')}
            className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
          >
            Accessories
          </button>
          <a
            href="#atelier-story"
            className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
          >
            Atelier
          </a>
        </nav>

        {/* Zone 3: Interactive Affordances & Primary Action */}
        <div className="flex items-center gap-4 text-stone-800 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onToggleSearch}
            className="p-2 text-stone-700 hover:text-stone-950 transition-colors rounded-full hover:bg-stone-100"
            aria-label="Search Catalog"
            title="Search Catalog"
          >
            <Search size={18} strokeWidth={1.75} />
          </button>

          {/* Wishlist Trigger */}
          <button
            onClick={onOpenWishlist}
            className="p-2 text-stone-700 hover:text-stone-950 transition-colors rounded-full hover:bg-stone-100 relative"
            aria-label="View Saved Wishlist"
            title="Wishlist"
          >
            <Heart size={18} strokeWidth={1.75} />
            {wishlistCount > 0 && (
              <span className="absolute 1 top-1 right-1 w-4 h-4 bg-stone-900 text-stone-100 text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Account / User Trigger */}
          <button
            onClick={onOpenAccount}
            className="flex items-center gap-2 p-2 text-stone-700 hover:text-stone-950 transition-colors rounded-full hover:bg-stone-100"
            aria-label="Account Settings"
            title={currentUser ? currentUser.full_name : 'Sign In'}
          >
            <UserIcon size={18} strokeWidth={1.75} />
            {currentUser && (
              <span className="hidden xl:inline text-xs font-medium tracking-wider uppercase text-stone-800 truncate max-w-[120px]">
                {currentUser.full_name.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Admin Atelier Switcher if Admin or quick toggle */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 text-xs font-semibold tracking-widest uppercase bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Atelier Admin Console"
            >
              <ShieldCheck size={14} />
              <span>Atelier</span>
            </button>
          )}

          {/* Shopping Bag CTA */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2.5 px-4 py-2 bg-stone-900 text-[#FAF8F5] text-xs font-medium tracking-widest uppercase hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
            aria-label="Shopping Bag"
          >
            <ShoppingBag size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Bag</span>
            <span className="tabular-nums font-semibold">({cartCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
