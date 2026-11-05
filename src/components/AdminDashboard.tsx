import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, DollarSign, ShoppingCart, Users, Layers, AlertCircle, Plus, Check, RefreshCw } from 'lucide-react';
import { AdminDashboardData, Order, Coupon, Category } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onProductCreated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  categories,
  onProductCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'inventory' | 'coupons' | 'add_product'>('metrics');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Add Product Form States
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.slug || 'womens-clothing');
  const [prodBasePrice, setProdBasePrice] = useState('890');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodMaterial, setProdMaterial] = useState('100% Cashmere & Mulberry Silk');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // New Coupon Form States
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponVal, setCouponVal] = useState('15');
  const [couponMinOrder, setCouponMinOrder] = useState('500');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [dash, ords, coups] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminOrders(),
        api.getAdminCoupons()
      ]);
      setData(dash);
      setOrders(ords.orders);
      setCoupons(coups.coupons);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to load admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateAdminOrderStatus({ order_id: orderId, order_status: newStatus });
      setFeedback(`Order #${orderId} status set to ${newStatus}`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleUpdateStock = async (variantId: number, currentStock: number) => {
    const input = prompt('Enter new stock quantity for variant:', String(currentStock));
    if (input === null) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty < 0) return;

    try {
      await api.updateAdminInventory({ variant_id: variantId, stock_quantity: qty });
      setFeedback(`Stock updated to ${qty} units.`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    setIsAddingProduct(true);
    try {
      await api.addAdminProduct({
        name: prodName.trim(),
        category_slug: prodCategory,
        base_price: parseFloat(prodBasePrice),
        discount_price: prodDiscountPrice ? parseFloat(prodDiscountPrice) : null,
        description: prodDescription.trim(),
        material: prodMaterial.trim(),
        image_url: '/src/assets/images/campaign_womens_couture_1793861001519.jpg'
      });
      setFeedback(`Product '${prodName}' added to MAISON catalog.`);
      setProdName('');
      setProdDescription('');
      onProductCreated();
      setActiveTab('metrics');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to add product');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      await api.createAdminCoupon({
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        discount_value: parseFloat(couponVal),
        min_order_value: parseFloat(couponMinOrder)
      });
      setFeedback(`Coupon '${couponCode.toUpperCase()}' generated.`);
      setCouponCode('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate coupon');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF8F5] w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-amber-300" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold block">
                Atelier Administration Console
              </span>
              <h2 className="font-serif text-2xl font-bold tracking-wide">
                MAISON Commercial Directorate
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAllAdminData}
              className="p-1.5 text-stone-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white transition-colors"
              aria-label="Close Admin Console"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-stone-100 border-b border-stone-200 px-6 flex items-center gap-6 overflow-x-auto text-xs uppercase tracking-wider font-semibold text-stone-600">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'metrics' ? 'border-stone-900 text-stone-950' : 'border-transparent hover:text-stone-900'
            }`}
          >
            Directorate KPIs
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'orders' ? 'border-stone-900 text-stone-950' : 'border-transparent hover:text-stone-900'
            }`}
          >
            Order Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'inventory' ? 'border-stone-900 text-stone-950' : 'border-transparent hover:text-stone-900'
            }`}
          >
            Stock Alerts
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'coupons' ? 'border-stone-900 text-stone-950' : 'border-transparent hover:text-stone-900'
            }`}
          >
            Promotions & Coupons
          </button>
          <button
            onClick={() => setActiveTab('add_product')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'add_product' ? 'border-stone-900 text-stone-950' : 'border-transparent hover:text-stone-900'
            }`}
          >
            + Add New Piece
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto">
          {feedback && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center justify-between">
              <span>{feedback}</span>
              <button onClick={() => setFeedback('')} className="text-emerald-600 hover:text-emerald-900">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Tab 1: Directorate KPIs */}
          {activeTab === 'metrics' && data && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-stone-200 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Gross Revenue
                  </span>
                  <div className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                    ${data.stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Paid Transactions</span>
                </div>

                <div className="bg-white p-5 border border-stone-200 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Total Orders
                  </span>
                  <div className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                    {data.stats.total_orders}
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Global Acquirers</span>
                </div>

                <div className="bg-white p-5 border border-stone-200 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Registered Patrons
                  </span>
                  <div className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                    {data.stats.total_customers}
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Active Accounts</span>
                </div>

                <div className="bg-white p-5 border border-stone-200 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Active Catalog
                  </span>
                  <div className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                    {data.stats.total_products}
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Live Luxury Silhouettes</span>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
                  Recent Atelier Acquisitions
                </h3>
                <div className="bg-white border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 font-semibold">Order</th>
                        <th className="p-3 font-semibold">Patron</th>
                        <th className="p-3 font-semibold">Destination</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {data.recent_orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-3 font-mono font-semibold text-stone-900">{ord.order_number}</td>
                          <td className="p-3 text-stone-800">{ord.customer_name}</td>
                          <td className="p-3 text-stone-500">{ord.shipping_city}, {ord.shipping_country}</td>
                          <td className="p-3 text-right font-mono font-semibold tabular-nums">
                            ${Number(ord.total_amount).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                              {ord.order_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders Fulfillment & Status Transitions */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Order Fulfillment Pipeline
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Transition order statuses to trigger client shipping telemetry and courier coordination.
              </p>

              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="bg-white p-5 border border-stone-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <span className="font-mono font-bold text-stone-900 text-sm">{ord.order_number}</span>
                        <span className="text-stone-400 text-xs ml-2">· {ord.created_at.slice(0, 16)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-500 font-mono">
                          Total: <strong className="text-stone-900">${Number(ord.total_amount).toFixed(2)}</strong>
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-800">
                          {ord.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p><strong>Customer:</strong> {ord.customer_name} ({ord.customer_email})</p>
                        <p><strong>Address:</strong> {ord.shipping_street}, {ord.shipping_city}, {ord.shipping_country}</p>
                        <p><strong>Tracking:</strong> {ord.tracking_number}</p>
                      </div>

                      {/* Status Transition Selector */}
                      <div className="flex items-center gap-3 md:justify-end">
                        <span className="text-stone-500 uppercase tracking-wider text-[11px] font-medium">Status:</span>
                        <select
                          value={ord.order_status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className="p-2 text-xs font-semibold uppercase tracking-wider bg-stone-50 border border-stone-300 focus:outline-none focus:border-stone-900 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Inventory Stock Alerts */}
          {activeTab === 'inventory' && data && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Inventory Stock & Low-Threshold Alerts
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Variants with fewer than 6 pieces remaining in the Paris/Biella ateliers. Click 'Edit Stock' to replenish.
              </p>

              <div className="bg-white border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 font-semibold">Silhouette Name</th>
                      <th className="p-3 font-semibold">SKU</th>
                      <th className="p-3 font-semibold">Size</th>
                      <th className="p-3 font-semibold">Color</th>
                      <th className="p-3 font-semibold text-center">Remaining Stock</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.low_stock_items.map((it) => (
                      <tr key={it.variant_id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-medium text-stone-900">{it.product_name}</td>
                        <td className="p-3 font-mono text-stone-500">{it.sku}</td>
                        <td className="p-3 text-stone-800">{it.size}</td>
                        <td className="p-3 text-stone-800">{it.color}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 text-[11px] font-mono font-bold ${
                            it.stock_quantity <= 2 ? 'text-red-700 bg-red-50' : 'text-amber-800 bg-amber-50'
                          }`}>
                            {it.stock_quantity} units
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleUpdateStock(it.variant_id, it.stock_quantity)}
                            className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border border-stone-300 hover:border-stone-900 transition-colors"
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Coupons Management */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Create Coupon */}
                <div className="w-full md:w-80 bg-white p-5 border border-stone-200 space-y-4">
                  <h4 className="font-serif text-lg font-bold text-stone-900">Issue Promotional Code</h4>
                  <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Code</label>
                      <input
                        type="text"
                        required
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="e.g. VIP25"
                        className="w-full p-2 bg-stone-50 border border-stone-300 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Type</label>
                      <select
                        value={couponType}
                        onChange={(e) => setCouponType(e.target.value as any)}
                        className="w-full p-2 bg-stone-50 border border-stone-300"
                      >
                        <option value="percent">Percentage Off (%)</option>
                        <option value="fixed">Fixed Deduction ($)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Value</label>
                        <input
                          type="number"
                          required
                          value={couponVal}
                          onChange={(e) => setCouponVal(e.target.value)}
                          className="w-full p-2 bg-stone-50 border border-stone-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Min Order ($)</label>
                        <input
                          type="number"
                          required
                          value={couponMinOrder}
                          onChange={(e) => setCouponMinOrder(e.target.value)}
                          className="w-full p-2 bg-stone-50 border border-stone-300 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800"
                    >
                      Publish Code
                    </button>
                  </form>
                </div>

                {/* Existing Coupons List */}
                <div className="flex-1 bg-white border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 font-semibold">Code</th>
                        <th className="p-3 font-semibold">Discount</th>
                        <th className="p-3 font-semibold">Min Order</th>
                        <th className="p-3 font-semibold text-center">Times Used</th>
                        <th className="p-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-stone-50">
                          <td className="p-3 font-mono font-bold text-stone-900">{c.code}</td>
                          <td className="p-3 font-mono">
                            {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value}`}
                          </td>
                          <td className="p-3 font-mono text-stone-500">${c.min_order_value}</td>
                          <td className="p-3 text-center font-mono">{c.times_used}</td>
                          <td className="p-3 text-right">
                            <span className="text-emerald-700 font-semibold uppercase text-[10px]">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Add New Piece */}
          {activeTab === 'add_product' && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Introduce a New Silhouette to MAISON
              </h3>
              <form onSubmit={handleAddProductSubmit} className="bg-white p-6 border border-stone-200 space-y-4 text-xs">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Italian Wool Double-Breasted Trench"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Category</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:outline-none focus:border-stone-900"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Base Price ($)</label>
                    <input
                      type="number"
                      required
                      value={prodBasePrice}
                      onChange={(e) => setProdBasePrice(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Discount Price (Optional $)</label>
                  <input
                    type="number"
                    value={prodDiscountPrice}
                    onChange={(e) => setProdDiscountPrice(e.target.value)}
                    placeholder="Leave empty if no discount"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Noble Material Composition</label>
                  <input
                    type="text"
                    required
                    value={prodMaterial}
                    onChange={(e) => setProdMaterial(e.target.value)}
                    placeholder="e.g. 100% Super 150s Merino Wool"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Architectural Editorial Description</label>
                  <textarea
                    rows={3}
                    required
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Describe tailoring, drop shoulder, drape, and tactile properties..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="w-full py-3 bg-stone-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 disabled:opacity-50"
                >
                  {isAddingProduct ? 'Adding Piece...' : 'Publish to MAISON Catalog'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
