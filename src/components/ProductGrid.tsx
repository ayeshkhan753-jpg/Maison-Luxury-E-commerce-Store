import React, { useState } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, Search, X } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  wishlistIds: Set<number>;
  onToggleWishlist: (productId: number) => void;
  onQuickView: (product: Product) => void;
  onAddToCartDirect: (product: Product) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalProductsCount: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  wishlistIds,
  onToggleWishlist,
  onQuickView,
  onAddToCartDirect,
  currentPage,
  totalPages,
  onPageChange,
  totalProductsCount,
}) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(3000);

  const availableSizes = ['all', 'XS', 'S', 'M', 'L', 'XL', 'EU 38', 'One Size'];
  const availableColors = ['all', 'Onyx Black', 'Ivory Cream', 'Camel Cashmere', 'Charcoal Slate'];

  // Filter client-side if needed for quick response or combined
  const filteredProducts = products.filter((prod) => {
    const price = prod.discount_price ?? prod.base_price;
    if (price > priceRange) return false;
    if (selectedSize !== 'all' && prod.available_sizes && !prod.available_sizes.includes(selectedSize)) {
      return false;
    }
    if (selectedColor !== 'all' && prod.available_colors && !prod.available_colors.some((c) => c.color.includes(selectedColor))) {
      return false;
    }
    return true;
  });

  return (
    <section id="catalog-section" className="py-16 px-6 max-w-7xl mx-auto">
      {/* Category Segmented Tabs (§1.A: Functional button elements) */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-stone-100'
                  : 'bg-transparent text-stone-600 hover:text-stone-950'
              }`}
            >
              All Pieces
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-4 py-2 text-xs uppercase tracking-[0.18em] font-medium transition-all whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-stone-900 text-stone-100'
                    : 'bg-transparent text-stone-600 hover:text-stone-950'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs uppercase tracking-wider font-medium border border-stone-300 text-stone-800 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </div>

        {/* Search bar & Sorting bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search fabrics, cashmere, blazers..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-100/70 border border-stone-200 focus:outline-none focus:border-stone-800 transition-colors placeholder:text-stone-400"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-stone-500 tracking-wider">
              Showing <span className="font-semibold text-stone-900 tabular-nums">{filteredProducts.length}</span> of {totalProductsCount} pieces
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent border border-stone-300 px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-900 cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="newest">Newest Arrivals</option>
                <option value="bestseller">Atelier Bestsellers</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {isFilterPanelOpen && (
          <div className="bg-stone-100/60 border border-stone-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all">
            {/* Price Filter */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium uppercase tracking-wider text-stone-700 mb-2">
                <span>Maximum Price</span>
                <span className="font-mono font-semibold tabular-nums">${priceRange}</span>
              </div>
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-400 mt-1 font-mono">
                <span>$200</span>
                <span>$3,000+</span>
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-stone-700 mb-2">
                Filter by Size
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-2.5 py-1 text-xs transition-colors ${
                      selectedSize === sz
                        ? 'bg-stone-900 text-stone-100'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {sz === 'all' ? 'All Sizes' : sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-stone-700 mb-2">
                Filter by Palette
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableColors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`px-2.5 py-1 text-xs transition-colors ${
                      selectedColor === col
                        ? 'bg-stone-900 text-stone-100'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {col === 'all' ? 'All Hues' : col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Product Cards (3-4 columns desktop) */}
      {filteredProducts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-stone-600 mb-2">No matching pieces found.</p>
          <p className="text-xs text-stone-400 tracking-wider uppercase mb-6">
            Try adjusting your search criteria or price thresholds.
          </p>
          <button
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
              setSelectedSize('all');
              setSelectedColor('all');
              setPriceRange(3000);
            }}
            className="px-6 py-2.5 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
              onAddToCartDirect={onAddToCartDirect}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-2 border-t border-stone-200 pt-8">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-xs uppercase tracking-wider text-stone-700 border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-9 h-9 text-xs font-semibold tabular-nums transition-colors ${
                  currentPage === pageNum
                    ? 'bg-stone-900 text-stone-100'
                    : 'bg-transparent text-stone-700 hover:bg-stone-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-xs uppercase tracking-wider text-stone-700 border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};
