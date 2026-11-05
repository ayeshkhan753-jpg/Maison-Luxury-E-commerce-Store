import React, { useState, useEffect, useCallback } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedCollections } from './components/FeaturedCollections';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AccountModal } from './components/AccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BrandStory } from './components/BrandStory';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';

import { Product, Category, CartData, WishlistItem, User, Order } from './types';
import { api } from './services/api';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export default function App() {
  // Core state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredData, setFeaturedData] = useState<{ featured: Product[]; new_arrivals: Product[]; bestsellers: Product[] }>({
    featured: [],
    new_arrivals: [],
    bestsellers: []
  });

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filter & Catalog controls
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [invoiceOrderNumber, setInvoiceOrderNumber] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // 1. Initial Load: Auth, Categories, Featured, Cart, Wishlist
  const initializeApp = useCallback(async () => {
    try {
      // Fetch current patron if token exists
      const token = localStorage.getItem('maison_token');
      if (token) {
        api.getMe()
          .then((res) => {
            if (res.user) setCurrentUser(res.user);
          })
          .catch(() => {
            localStorage.removeItem('maison_token');
          });
      }

      // Fetch Categories
      const catRes = await api.getCategories();
      if (catRes.categories) setCategories(catRes.categories);

      // Fetch Featured Showcase
      const featRes = await api.getFeatured();
      setFeaturedData(featRes);

      // Fetch Cart
      const cartRes = await api.getCart();
      setCartData(cartRes);

      // Fetch Wishlist
      const wishRes = await api.getWishlist();
      setWishlistItems(wishRes.items || []);
      setWishlistIds(new Set(wishRes.items.map((i) => i.product_id)));
    } catch (err: any) {
      console.error('App init error:', err);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // 2. Fetch Products with filtering and pagination
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        sort: sortBy,
        page: currentPage,
        limit: 12
      });

      setProducts(res.products);
      setTotalPages(res.total_pages);
      setTotalProductsCount(res.total);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedCategory, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Category select
  const handleSelectCategory = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cart Operations
  const handleAddToCart = async (productId: number, size: string, color: string, quantity: number) => {
    try {
      const res = await api.addToCart({
        product_id: productId,
        size,
        color,
        quantity,
        coupon_code: cartData?.totals?.coupon?.code
      });
      setCartData(res);
      setIsCartOpen(true);
      showToast('Piece added to your shopping bag.');
    } catch (err: any) {
      alert(err.message || 'Unable to add piece to shopping bag');
    }
  };

  const handleAddToCartDirect = (product: Product) => {
    const size = product.available_sizes?.[0] || 'One Size';
    const color = product.available_colors?.[0]?.color || 'Default';
    handleAddToCart(product.id, size, color, 1);
  };

  const handleUpdateCartQuantity = async (itemId: number, quantity: number) => {
    try {
      const res = await api.updateCartQuantity({
        item_id: itemId,
        quantity,
        coupon_code: cartData?.totals?.coupon?.code
      });
      setCartData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    try {
      const res = await api.removeFromCart({
        item_id: itemId,
        coupon_code: cartData?.totals?.coupon?.code
      });
      setCartData(res);
      showToast('Item removed from shopping bag.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const handleApplyCoupon = async (code: string) => {
    const res = await api.applyCoupon(code);
    setCartData(res);
    showToast(`Code ${code.toUpperCase()} verified and applied.`);
  };

  // Wishlist Operations
  const handleToggleWishlist = async (productId: number) => {
    try {
      const res = await api.toggleWishlist(productId);
      setWishlistItems(res.items);
      setWishlistIds(new Set(res.items.map((i) => i.product_id)));
      showToast(res.action === 'added' ? 'Saved to your luxury curations.' : 'Removed from saved curations.');
    } catch (err: any) {
      alert(err.message || 'Failed to update wishlist');
    }
  };

  const handleMoveWishlistToBag = (productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      handleAddToCartDirect(prod);
      handleToggleWishlist(productId);
    }
  };

  // Auth Callbacks
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    showToast(`Welcome to the Atelier, ${user.full_name}.`);
    // Refresh cart & wishlist for this user
    api.getCart().then(setCartData).catch(() => {});
    api.getWishlist().then((res) => {
      setWishlistItems(res.items || []);
      setWishlistIds(new Set((res.items || []).map((i) => i.product_id)));
    }).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem('maison_token');
    setCurrentUser(null);
    showToast('You have been signed out.');
  };

  // Checkout Success Callback
  const handleOrderSuccess = (order: Order) => {
    // Refresh cart
    api.getCart().then(setCartData).catch(() => {});
  };

  const cartItemsCount = cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-stone-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-100 text-xs py-3 px-5 shadow-2xl flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Check size={14} className="text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Header (Adhering to Top Bar Contract) */}
      <Header
        cartCount={cartItemsCount}
        wishlistCount={wishlistItems.length}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectCategory={handleSelectCategory}
        onToggleSearch={() => {
          setIsSearchOpen(!isSearchOpen);
          const catalogEl = document.getElementById('catalog-section');
          if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
        }}
        isSearchOpen={isSearchOpen}
      />

      {/* 3. Hero Section */}
      <Hero
        onExplore={() => handleSelectCategory('all')}
        onNewArrivals={() => {
          setSortBy('newest');
          handleSelectCategory('all');
        }}
      />

      {/* 4. Featured Collections Edit */}
      <FeaturedCollections onSelectCategory={handleSelectCategory} />

      {/* 5. Product Catalog & Filter Grid */}
      <ProductGrid
        products={products}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(s) => {
          setSortBy(s);
          setCurrentPage(1);
        }}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onQuickView={(p) => setSelectedProduct(p)}
        onAddToCartDirect={handleAddToCartDirect}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalProductsCount={totalProductsCount}
      />

      {/* 6. Brand Story & Craftsmanship Section */}
      <BrandStory />

      {/* 7. Newsletter Section */}
      <NewsletterSection />

      {/* 8. Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      {/* --- DRAWERS & MODALS --- */}

      {/* Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartData={cartData}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onApplyCoupon={handleApplyCoupon}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemoveItem={handleToggleWishlist}
        onMoveToBag={handleMoveWishlistToBag}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onSelectRelated={(p) => setSelectedProduct(p)}
      />

      {/* Multi-Step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartData={cartData}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        onViewInvoice={(ordNum) => setInvoiceOrderNumber(ordNum)}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        orderNumber={invoiceOrderNumber}
        onClose={() => setInvoiceOrderNumber(null)}
      />

      {/* Customer Account & Orders Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onViewInvoice={(ordNum) => setInvoiceOrderNumber(ordNum)}
      />

      {/* Admin Atelier Console */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        categories={categories}
        onProductCreated={fetchProducts}
      />
    </div>
  );
}
