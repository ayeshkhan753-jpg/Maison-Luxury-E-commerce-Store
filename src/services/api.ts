import {
  Product,
  Category,
  CartData,
  WishlistItem,
  Order,
  User,
  Review,
  AdminDashboardData,
  Coupon
} from '../types';

function getSessionId(): string {
  let sid = localStorage.getItem('maison_session_id');
  if (!sid) {
    sid = 'msn_sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('maison_session_id', sid);
  }
  return sid;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('maison_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId()
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {})
  };

  const res = await fetch(path, { ...options, headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
    throw new Error(errorData.error || errorData.details || `Error ${res.status}`);
  }

  // Handle HTML responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    return res.text() as unknown as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (data: { full_name?: string; phone?: string }) =>
    request<{ message: string }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  addAddress: (data: any) =>
    request<{ message: string }>('/api/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Products
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getFeatured: () =>
    request<{ featured: Product[]; new_arrivals: Product[]; bestsellers: Product[] }>('/api/products/featured'),

  getProducts: (params: {
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    size?: string;
    color?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.min_price) query.set('min_price', String(params.min_price));
    if (params.max_price) query.set('max_price', String(params.max_price));
    if (params.size) query.set('size', params.size);
    if (params.color) query.set('color', params.color);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return request<{ products: Product[]; total: number; page: number; limit: number; total_pages: number }>(
      `/api/products?${query.toString()}`
    );
  },

  getProductDetail: (slugOrId: string | number) =>
    request<{ product: Product }>(`/api/products/${slugOrId}`),

  // Cart
  getCart: (coupon?: string) => {
    const q = coupon ? `?coupon=${encodeURIComponent(coupon)}` : '';
    return request<CartData>(`/api/cart${q}`);
  },

  addToCart: (data: { product_id: number; size: string; color: string; quantity: number; coupon_code?: string }) =>
    request<CartData>('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCartQuantity: (data: { item_id: number; quantity: number; coupon_code?: string }) =>
    request<CartData>('/api/cart/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  removeFromCart: (data: { item_id: number; coupon_code?: string }) =>
    request<CartData>('/api/cart/remove', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  applyCoupon: (code: string) =>
    request<CartData>('/api/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ code })
    }),

  // Wishlist
  getWishlist: () => request<{ items: WishlistItem[]; wishlist_id: number }>('/api/wishlist'),

  toggleWishlist: (product_id: number) =>
    request<{ items: WishlistItem[]; action: 'added' | 'removed' }>('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id })
    }),

  // Checkout
  placeOrder: (data: any) =>
    request<{ message: string; order: any }>('/api/checkout/place-order', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Orders
  getOrders: () => request<{ orders: Order[] }>('/api/orders'),

  getOrderDetail: (orderNumber: string) =>
    request<{ order: Order }>(`/api/orders/${orderNumber}`),

  cancelOrder: (orderNumber: string) =>
    request<{ message: string }>(`/api/orders/${orderNumber}/cancel`, {
      method: 'POST'
    }),

  returnOrder: (orderNumber: string, reason: string) =>
    request<{ message: string }>(`/api/orders/${orderNumber}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  getInvoiceHtml: (orderNumber: string) =>
    request<string>(`/api/orders/${orderNumber}/invoice`),

  // Reviews
  getReviews: (productId: number) =>
    request<{ reviews: Review[] }>(`/api/reviews/product/${productId}`),

  submitReview: (data: { product_id: number; author_name: string; rating: number; title: string; comment: string }) =>
    request<{ message: string; new_rating: number; review_count: number }>('/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    request<{ message: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  // Admin
  getAdminDashboard: () => request<AdminDashboardData>('/api/admin/dashboard'),

  getAdminOrders: () => request<{ orders: Order[] }>('/api/admin/orders'),

  updateAdminOrderStatus: (data: { order_id: number; order_status?: string; payment_status?: string }) =>
    request<{ message: string }>('/api/admin/orders/status', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  addAdminProduct: (data: any) =>
    request<{ message: string; product_id: number }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAdminInventory: (data: { variant_id: number; stock_quantity: number }) =>
    request<{ message: string }>('/api/admin/inventory', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAdminCoupons: () => request<{ coupons: Coupon[] }>('/api/admin/coupons'),

  createAdminCoupon: (data: any) =>
    request<{ message: string }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
