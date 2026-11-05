export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  color_code: string;
  stock_quantity: number;
  sku: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
  alt_text?: string;
  display_order: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  category_slug: string;
  category_name?: string;
  base_price: number;
  discount_price: number | null;
  is_featured: number;
  is_new_arrival: number;
  is_bestseller: number;
  rating: number;
  review_count: number;
  material: string;
  specifications: string;
  care_instructions: string;
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  available_sizes?: string[];
  available_colors?: { color: string; color_code: string }[];
  reviews?: Review[];
  related_products?: Product[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  product_count: number;
}

export interface CartItem {
  item_id: number;
  product_id: number;
  variant_id: number | null;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_slug: string;
  image_url: string;
  stock_quantity?: number;
}

export interface CartTotals {
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  coupon: {
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
  } | null;
  is_free_shipping: boolean;
}

export interface CartData {
  cart_id: number;
  items: CartItem[];
  totals: CartTotals;
}

export interface WishlistItem {
  wishlist_item_id: number;
  product_id: number;
  created_at: string;
  name: string;
  slug: string;
  base_price: number;
  discount_price: number | null;
  category_slug: string;
  image_url: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_postal: string;
  shipping_country: string;
  delivery_instructions: string;
  subtotal: number;
  discount_amount: number;
  coupon_code: string;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_number: string;
  created_at: string;
  items?: OrderItem[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
  profile_image?: string;
  addresses?: Address[];
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  delivery_notes?: string;
  is_default: number;
}

export interface Review {
  id: number;
  product_id: number;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: number;
  created_at: string;
}

export interface Coupon {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  times_used: number;
  is_active: number;
}

export interface AdminDashboardData {
  stats: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
  };
  recent_orders: Order[];
  low_stock_items: {
    variant_id: number;
    size: string;
    color: string;
    stock_quantity: number;
    sku: string;
    product_name: string;
    product_id: number;
  }[];
}
