import React from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  onQuickView: (product: Product) => void;
  onAddToCartDirect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onAddToCartDirect,
}) => {
  const currentPrice = product.discount_price ?? product.base_price;
  const hasDiscount = product.discount_price !== null && product.discount_price < product.base_price;

  return (
    <div className="group relative flex flex-col bg-transparent transition-all duration-300">
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2EFE9] mb-4">
        <img
          src={product.primary_image || '/src/assets/images/hero_luxury_editorial_1793861001211.jpg'}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Minimal Unboxed Editorial Tag (Zero-Pill Compliance) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.is_new_arrival === 1 && (
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-900 bg-[#FAF8F5]/90 px-2.5 py-1 backdrop-blur-xs">
              New Arrival
            </span>
          )}
          {product.is_bestseller === 1 && !product.is_new_arrival && (
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-900 bg-[#FAF8F5]/90 px-2.5 py-1 backdrop-blur-xs">
              Atelier Icon
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 z-10 ${
            isWishlisted
              ? 'bg-stone-900 text-red-400 shadow-md'
              : 'bg-[#FAF8F5]/85 text-stone-800 hover:text-stone-950 hover:bg-[#FAF8F5]'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.75} />
        </button>

        {/* Quick View Floating Overlay on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-stone-950/70 via-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <button
            onClick={() => onQuickView(product)}
            className="flex-1 py-2.5 px-4 bg-[#FAF8F5] text-stone-900 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-white transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <Eye size={14} />
            <span>Quick View</span>
          </button>
          {onAddToCartDirect && (
            <button
              onClick={() => onAddToCartDirect(product)}
              className="p-2.5 bg-stone-900 text-[#FAF8F5] hover:bg-stone-800 transition-colors shadow-md"
              title="Add to Bag"
              aria-label="Add to Bag"
            >
              <ShoppingBag size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Metadata & Pricing */}
      <div className="flex flex-col flex-1">
        {/* Category & Rating separator (No Pills) */}
        <div className="flex items-center justify-between text-[11px] tracking-wider uppercase text-stone-500 mb-1">
          <span>{product.category_name || product.category_slug.replace('-', ' ')}</span>
          {product.rating > 0 && (
            <span className="tabular-nums font-normal">
              ★ {product.rating.toFixed(1)} <span className="text-stone-400">({product.review_count})</span>
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onQuickView(product)}
          className="font-serif text-lg font-bold text-stone-900 hover:text-stone-700 cursor-pointer transition-colors line-clamp-1 mb-1.5"
        >
          {product.name}
        </h3>

        {/* Price Baseline */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm font-semibold text-stone-900 tabular-nums">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {hasDiscount && (
            <span className="text-xs text-stone-400 line-through tabular-nums">
              ${product.base_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Available Sizes preview */}
        {product.available_sizes && product.available_sizes.length > 0 && (
          <div className="text-[11px] text-stone-500 tracking-wider flex items-center gap-1">
            <span className="text-stone-400">Sizes:</span>
            <span>{product.available_sizes.join(' · ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
