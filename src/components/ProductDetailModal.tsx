import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, ChevronRight, Check } from 'lucide-react';
import { Product, Review } from '../types';
import { api } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number, size: string, color: string, quantity: number) => void;
  onSelectRelated: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onSelectRelated,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'delivery' | 'reviews'>('details');

  // Review form states
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.primary_image || (product.images && product.images[0]?.image_url) || '');
      setSelectedSize(product.available_sizes?.[0] || 'One Size');
      setSelectedColor(product.available_colors?.[0]?.color || 'Default');
      setQuantity(1);
      setReviewsList(product.reviews || []);
      setReviewSuccess('');
      setIsWritingReview(false);

      // Fetch fresh reviews
      api.getReviews(product.id).then((res) => {
        if (res.reviews) setReviewsList(res.reviews);
      }).catch(() => {});
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = product.discount_price ?? product.base_price;
  const hasDiscount = product.discount_price !== null && product.discount_price < product.base_price;

  // Selected variant stock check
  const selectedVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const availableStock = selectedVariant?.stock_quantity ?? 10;
  const isOutOfStock = availableStock <= 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const res = await api.submitReview({
        product_id: product.id,
        author_name: reviewAuthor.trim() || 'Verified Patron',
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim()
      });

      setReviewSuccess(res.message);
      setReviewTitle('');
      setReviewComment('');
      setIsWritingReview(false);

      // Refresh reviews list
      const updated = await api.getReviews(product.id);
      setReviewsList(updated.reviews);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 transition-all">
      <div className="relative bg-[#FAF8F5] w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 bg-[#FAF8F5]/90 hover:bg-white text-stone-700 hover:text-stone-950 rounded-full transition-colors shadow-sm"
          aria-label="Close detail modal"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10">
          {/* Left Column: Visual Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 border border-stone-200/60">
              <img
                src={selectedImage || product.primary_image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-200 ${
                  isWishlisted
                    ? 'bg-stone-900 text-red-400 shadow-md'
                    : 'bg-[#FAF8F5]/85 text-stone-800 hover:bg-[#FAF8F5]'
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`relative w-20 aspect-[3/4] overflow-hidden border-2 transition-all ${
                      selectedImage === img.image_url
                        ? 'border-stone-900 scale-95'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category & Verified Badge */}
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">
                <span>{product.category_name || product.category_slug.replace('-', ' ')}</span>
                <span className="flex items-center gap-1 text-stone-800">
                  <ShieldCheck size={14} />
                  <span>Atelier Authenticated</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-3 leading-tight">
                {product.name}
              </h2>

              {/* Rating & Review Jump */}
              <div className="flex items-center gap-2 mb-4 text-xs text-stone-600">
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                    />
                  ))}
                </div>
                <span className="font-medium tabular-nums text-stone-900">{product.rating.toFixed(1)}</span>
                <span className="text-stone-400">·</span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="underline hover:text-stone-950 transition-colors"
                >
                  {reviewsList.length} Customer Reviews
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-stone-200">
                <span className="text-2xl font-semibold text-stone-900 tabular-nums">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <span className="text-base text-stone-400 line-through tabular-nums">
                    ${product.base_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs tracking-wider uppercase font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5">
                    Private Offer
                  </span>
                )}
              </div>

              {/* Color Selector */}
              {product.available_colors && product.available_colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs uppercase tracking-wider font-medium text-stone-700 mb-2.5">
                    <span>Palette: <strong className="text-stone-900 normal-case">{selectedColor}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.available_colors.map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setSelectedColor(c.color)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor === c.color ? 'border-stone-900 scale-110 shadow-sm' : 'border-stone-300 hover:border-stone-500'
                        }`}
                        title={c.color}
                        style={{ backgroundColor: c.color_code }}
                      >
                        {selectedColor === c.color && (
                          <div className={`w-2 h-2 rounded-full ${c.color.includes('Ivory') ? 'bg-stone-900' : 'bg-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.available_sizes && product.available_sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs uppercase tracking-wider font-medium text-stone-700 mb-2.5">
                    <span>Select Size</span>
                    <button
                      onClick={() => setActiveTab('specs')}
                      className="text-stone-500 underline hover:text-stone-900"
                    >
                      Size & Cut Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                          selectedSize === sz
                            ? 'bg-stone-900 text-stone-100 shadow-sm'
                            : 'bg-white text-stone-800 border border-stone-300 hover:border-stone-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Inventory Notice */}
              <div className="text-xs mb-6">
                {isOutOfStock ? (
                  <span className="text-red-700 font-medium">Currently unavailable in this variant.</span>
                ) : availableStock <= 5 ? (
                  <span className="text-amber-800 font-medium">
                    Atelier alert: Only {availableStock} pieces remaining in stock.
                  </span>
                ) : (
                  <span className="text-stone-500">In stock at our European Atelier. Ships within 24h.</span>
                )}
              </div>

              {/* Quantity Stepper & Add to Bag Primary CTA */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center border border-stone-300 bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3.5 py-2.5 text-stone-600 hover:text-stone-950 disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="px-3.5 py-2.5 text-stone-600 hover:text-stone-950 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product.id, selectedSize, selectedColor, quantity);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className="flex-1 py-3.5 px-6 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag size={16} />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
                </button>
              </div>

              {/* Trust Features Strip */}
              <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 pt-4 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-stone-800 shrink-0" />
                  <span>Complimentary Shipping Over $300</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={15} className="text-stone-800 shrink-0" />
                  <span>30-Day White-Glove Returns</span>
                </div>
              </div>
            </div>

            {/* Accordion / Info Tabs */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-6 border-b border-stone-200 text-xs uppercase tracking-wider font-medium text-stone-500 mb-4 pb-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-1 transition-colors ${activeTab === 'details' ? 'border-b-2 border-stone-900 text-stone-900' : 'hover:text-stone-800'}`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-1 transition-colors ${activeTab === 'specs' ? 'border-b-2 border-stone-900 text-stone-900' : 'hover:text-stone-800'}`}
                >
                  Materials & Fit
                </button>
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`pb-1 transition-colors ${activeTab === 'delivery' ? 'border-b-2 border-stone-900 text-stone-900' : 'hover:text-stone-800'}`}
                >
                  Delivery & Care
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-1 transition-colors ${activeTab === 'reviews' ? 'border-b-2 border-stone-900 text-stone-900' : 'hover:text-stone-800'}`}
                >
                  Reviews ({reviewsList.length})
                </button>
              </div>

              <div className="text-xs text-stone-700 leading-relaxed min-h-[100px]">
                {activeTab === 'details' && (
                  <p className="font-light text-stone-600 leading-relaxed text-sm">
                    {product.description}
                  </p>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-2">
                    <p><strong className="font-medium text-stone-900">Noble Composition:</strong> {product.material}</p>
                    <p><strong className="font-medium text-stone-900">Tailoring Specifications:</strong> {product.specifications || 'Hand-finished surgical seams, horn hardware, unlined Italian construction.'}</p>
                    <p><strong className="font-medium text-stone-900">Fit Advice:</strong> Designed for an intentional modern drape. Fits true to size; for a closer silhouette, consider one size down.</p>
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="space-y-2">
                    <p><strong className="font-medium text-stone-900">White-Glove Courier:</strong> Dispatched within 24 hours in signature MAISON archival packaging with cedar protective sachet.</p>
                    <p><strong className="font-medium text-stone-900">Garment Care:</strong> {product.care_instructions}</p>
                    <p><strong className="font-medium text-stone-900">Returns:</strong> We accept returns and exchanges on pristine items within 30 days of delivery.</p>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviewSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                        {reviewSuccess}
                      </div>
                    )}

                    {!isWritingReview ? (
                      <button
                        onClick={() => setIsWritingReview(true)}
                        className="py-2 px-4 border border-stone-900 text-stone-900 text-xs uppercase tracking-wider font-semibold hover:bg-stone-900 hover:text-white transition-colors"
                      >
                        Write a Patron Review
                      </button>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="bg-stone-100 p-4 border border-stone-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-stone-900">Share Your Experience</span>
                          <button
                            type="button"
                            onClick={() => setIsWritingReview(false)}
                            className="text-stone-400 hover:text-stone-700"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Your Name</label>
                          <input
                            type="text"
                            value={reviewAuthor}
                            onChange={(e) => setReviewAuthor(e.target.value)}
                            placeholder="e.g. Genevieve Laurent"
                            className="w-full p-2 text-xs bg-white border border-stone-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="text-amber-500 p-1"
                              >
                                <Star size={16} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Headline</label>
                          <input
                            type="text"
                            required
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="e.g. Exceptional weight and drape"
                            className="w-full p-2 text-xs bg-white border border-stone-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Review</label>
                          <textarea
                            required
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Describe the fabric feel, tailoring, and fit..."
                            className="w-full p-2 text-xs bg-white border border-stone-300"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full py-2 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 disabled:opacity-50"
                        >
                          {isSubmittingReview ? 'Publishing...' : 'Submit Review'}
                        </button>
                      </form>
                    )}

                    {reviewsList.length === 0 ? (
                      <p className="text-stone-400 italic">No reviews yet for this piece. Be the first to review.</p>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {reviewsList.map((rev) => (
                          <div key={rev.id} className="border-b border-stone-200 pb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-stone-900 text-xs">{rev.author_name}</span>
                              <span className="text-[11px] text-stone-400">{rev.created_at.slice(0, 10)}</span>
                            </div>
                            <div className="flex text-amber-500 mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  fill={i < rev.rating ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                />
                              ))}
                            </div>
                            <div className="font-medium text-stone-900 text-xs mb-1">{rev.title}</div>
                            <p className="text-stone-600 text-xs leading-relaxed">{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {product.related_products && product.related_products.length > 0 && (
          <div className="bg-stone-100/70 p-6 sm:p-10 border-t border-stone-200">
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">
              Complete the Atelier Silhouette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.related_products.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="group cursor-pointer bg-white p-3 border border-stone-200 hover:shadow-md transition-all"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-stone-100 mb-2">
                    <img
                      src={rel.primary_image || '/src/assets/images/hero_luxury_editorial_1793861001211.jpg'}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-stone-900 truncate">
                    {rel.name}
                  </h4>
                  <p className="text-xs text-stone-600 tabular-nums font-semibold mt-1">
                    ${(rel.discount_price ?? rel.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
