import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, Truck } from 'lucide-react';
import { CartData } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartData: CartData | null;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onApplyCoupon: (code: string) => Promise<void>;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartData,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onProceedToCheckout,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const items = cartData?.items || [];
  const totals = cartData?.totals || {
    subtotal: 0,
    discount_amount: 0,
    shipping_fee: 0,
    tax_amount: 0,
    total_amount: 0,
    coupon: null,
    is_free_shipping: true
  };

  const freeShippingThreshold = 300;
  const currentSubtotal = totals.subtotal - totals.discount_amount;
  const diffToFreeShipping = Math.max(0, freeShippingThreshold - currentSubtotal);
  const freeShippingPercent = Math.min(100, Math.round((currentSubtotal / freeShippingThreshold) * 100));

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-stone-900" />
              <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-900">
                Shopping Bag <span className="text-sm font-sans font-normal text-stone-500 tabular-nums">({items.length})</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
              aria-label="Close Shopping Bag"
            >
              <X size={20} />
            </button>
          </div>

          {/* Complimentary Shipping Threshold Bar */}
          <div className="px-6 py-3 bg-stone-100 border-b border-stone-200/80 text-xs">
            {diffToFreeShipping > 0 ? (
              <div>
                <p className="text-stone-700 flex items-center gap-1.5 mb-1.5 font-light">
                  <Truck size={14} className="text-stone-900" />
                  <span>Add <strong className="font-semibold text-stone-900 tabular-nums">${diffToFreeShipping.toFixed(2)}</strong> more for complimentary white-glove shipping.</span>
                </p>
                <div className="w-full bg-stone-200 h-1 overflow-hidden">
                  <div
                    className="bg-stone-900 h-full transition-all duration-500"
                    style={{ width: `${freeShippingPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-emerald-800 font-medium flex items-center gap-1.5">
                <Check size={14} />
                <span>You have unlocked complimentary white-glove delivery.</span>
              </p>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-stone-200/70">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <ShoppingBag size={48} strokeWidth={1} className="text-stone-300 mb-4" />
                <h3 className="font-serif text-2xl font-bold text-stone-800 mb-2">Your Bag is Empty</h3>
                <p className="text-xs text-stone-500 tracking-wider uppercase mb-8 max-w-xs">
                  Explore our curated collections of noble cashmere, evening silk, and tailored garments.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 transition-colors"
                >
                  Discover Collections
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.item_id} className="pt-6 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-26 shrink-0 bg-stone-100 overflow-hidden border border-stone-200">
                    <img
                      src={item.image_url || '/src/assets/images/hero_luxury_editorial_1793861001211.jpg'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                          {item.product_name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.item_id)}
                          className="text-stone-400 hover:text-red-700 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                        <span>{item.color}</span>
                        <span>·</span>
                        <span>Size {item.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-300 bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.item_id, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-950"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-950"
                        >
                          +
                        </button>
                      </div>

                      {/* Price calculation */}
                      <span className="text-sm font-semibold text-stone-900 tabular-nums">
                        ${(item.unit_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Financial Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-stone-100/60 border-t border-stone-200 space-y-4">
              {/* Coupon Applicator */}
              <form onSubmit={handleApplyCouponSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE (e.g. LUXURY20)"
                    className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-white border border-stone-300 focus:outline-none focus:border-stone-900 tracking-wider font-mono placeholder:text-stone-400"
                  />
                  <Tag size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-stone-900 text-stone-100 text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>

              {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}

              {totals.coupon && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 border border-emerald-200">
                  <span>Code <strong>{totals.coupon.code}</strong> Applied</span>
                  <span className="font-mono">-${totals.coupon.discount_amount.toFixed(2)}</span>
                </div>
              )}

              {/* Price Calculations */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-stone-900 tabular-nums">${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Promotional Savings</span>
                    <span className="font-mono tabular-nums">-${totals.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>White-Glove Shipping</span>
                  <span className="font-mono tabular-nums">
                    {totals.shipping_fee === 0 ? 'COMPLIMENTARY' : `$${totals.shipping_fee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VAT / Sales Tax (8.5%)</span>
                  <span className="font-mono text-stone-900 tabular-nums">${totals.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Estimated Total</span>
                  <span className="font-mono tabular-nums">${totals.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-4 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
