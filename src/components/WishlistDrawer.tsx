import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { WishlistItem } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onRemoveItem: (productId: number) => void;
  onMoveToBag: (productId: number) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onMoveToBag,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-stone-900" fill="currentColor" />
              <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-900">
                Saved Curations <span className="text-sm font-sans font-normal text-stone-500 tabular-nums">({items.length})</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
              aria-label="Close Wishlist"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-stone-200/70">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <Heart size={48} strokeWidth={1} className="text-stone-300 mb-4" />
                <h3 className="font-serif text-2xl font-bold text-stone-800 mb-2">No Saved Pieces</h3>
                <p className="text-xs text-stone-500 tracking-wider uppercase mb-8 max-w-xs">
                  Click the heart icon on any piece to save it to your personal luxury curation.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => {
                const price = item.discount_price ?? item.base_price;
                return (
                  <div key={item.wishlist_item_id} className="pt-6 first:pt-0 flex gap-4">
                    <div className="w-20 h-26 shrink-0 bg-stone-100 overflow-hidden border border-stone-200">
                      <img
                        src={item.image_url || '/src/assets/images/hero_luxury_editorial_1793861001211.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.product_id)}
                            className="text-stone-400 hover:text-red-700 transition-colors p-1"
                            title="Remove from wishlist"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="text-xs text-stone-500 uppercase tracking-wider block mt-1">
                          {item.category_slug.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold text-stone-900 tabular-nums">
                          ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>

                        <button
                          onClick={() => {
                            onMoveToBag(item.product_id);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-stone-900 text-stone-100 text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingBag size={13} />
                          <span>Move to Bag</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
