import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Package, MapPin, LogOut, FileText, RotateCcw, AlertTriangle, Check, Plus } from 'lucide-react';
import { User, Order, Address } from '../types';
import { api } from '../services/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onViewInvoice: (orderNumber: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onViewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('United States');
  const [addrPhone, setAddrPhone] = useState('');

  useEffect(() => {
    if (currentUser && isOpen) {
      setOrdersLoading(true);
      api.getOrders()
        .then((res) => setOrders(res.orders || []))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.login({ email: authEmail, password: authPassword });
      localStorage.setItem('maison_token', res.token);
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.register({
        email: authEmail,
        password: authPassword,
        full_name: authFullName,
        phone: authPhone,
      });
      localStorage.setItem('maison_token', res.token);
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const quickFillClient = () => {
    setAuthEmail('client@maison.luxury');
    setAuthPassword('MaisonClient2026!');
    setIsRegisterMode(false);
  };

  const quickFillAdmin = () => {
    setAuthEmail('admin@maison.luxury');
    setAuthPassword('MaisonAdmin2026!');
    setIsRegisterMode(false);
  };

  const handleCancelOrder = async (orderNumber: string) => {
    if (!confirm(`Confirm cancellation of Atelier Order #${orderNumber}?`)) return;
    try {
      const res = await api.cancelOrder(orderNumber);
      setActionFeedback(res.message);
      const updated = await api.getOrders();
      setOrders(updated.orders);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const handleReturnOrder = async (orderNumber: string) => {
    const reason = prompt('Please specify the reason for return/exchange:', 'Size exchange');
    if (!reason) return;
    try {
      const res = await api.returnOrder(orderNumber, reason);
      setActionFeedback(res.message);
      const updated = await api.getOrders();
      setOrders(updated.orders);
    } catch (err: any) {
      alert(err.message || 'Failed to request return');
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addAddress({
        full_name: currentUser?.full_name || 'Client',
        phone: addrPhone || currentUser?.phone || '+1 555-0199',
        street: addrStreet,
        city: addrCity,
        postal_code: addrPostal,
        country: addrCountry,
        is_default: 1
      });
      setShowAddAddress(false);
      const meRes = await api.getMe();
      if (meRes.user) onLoginSuccess(meRes.user, localStorage.getItem('maison_token') || '');
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF8F5] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold block mb-0.5">
              Clientèle Relations
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              {currentUser ? `Welcome, ${currentUser.full_name}` : 'Patron Access & Registration'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="Close Account Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Guest View: Sign In / Register */}
        {!currentUser ? (
          <div className="p-8 sm:p-12 max-w-lg mx-auto w-full">
            {/* Demo Quick Fill Buttons */}
            <div className="mb-8 p-4 bg-stone-100 border border-stone-200/80">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-600 block mb-2">
                Quick Demo Profile Switcher:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={quickFillClient}
                  className="px-3 py-1.5 bg-white border border-stone-300 text-stone-900 text-xs font-medium hover:border-stone-800 transition-colors shadow-2xs"
                >
                  Fill Client (Genevieve Laurent)
                </button>
                <button
                  type="button"
                  onClick={quickFillAdmin}
                  className="px-3 py-1.5 bg-stone-900 text-stone-100 text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Fill Admin (Atelier Staff)
                </button>
              </div>
            </div>

            {authError && (
              <div className="mb-6 p-3 bg-red-50 text-red-800 text-xs border border-red-200">
                {authError}
              </div>
            )}

            <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g. Genevieve Laurent"
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Telephone Number</label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+1 (212) 555-0144"
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="patron@maison.luxury"
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-md"
              >
                {authLoading ? 'Verifying...' : isRegisterMode ? 'Create Atelier Account' : 'Sign In to MAISON'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-stone-500">
              {isRegisterMode ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setIsRegisterMode(false)} className="text-stone-900 font-semibold underline">
                    Sign in here
                  </button>
                </p>
              ) : (
                <p>
                  New to MAISON?{' '}
                  <button onClick={() => setIsRegisterMode(true)} className="text-stone-900 font-semibold underline">
                    Register for private access
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Logged In Patron Dashboard */
          <div className="flex-1 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-stone-100/70 p-6 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-between">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2.5 ${
                    activeTab === 'orders' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200/60'
                  }`}
                >
                  <Package size={15} />
                  <span>Orders & Shipments</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2.5 ${
                    activeTab === 'profile' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200/60'
                  }`}
                >
                  <UserIcon size={15} />
                  <span>Personal Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2.5 ${
                    activeTab === 'addresses' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200/60'
                  }`}
                >
                  <MapPin size={15} />
                  <span>Delivery Addresses</span>
                </button>
              </div>

              <div className="pt-6 border-t border-stone-200/80 mt-6">
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs uppercase tracking-wider font-medium text-stone-500 hover:text-red-700 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 sm:p-10">
              {actionFeedback && (
                <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  {actionFeedback}
                </div>
              )}

              {/* Tab 1: Orders */}
              {activeTab === 'orders' && (
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-6">
                    Historical Acquisitions & Active Shipments
                  </h3>

                  {ordersLoading ? (
                    <p className="text-xs text-stone-500">Retrieving order archives...</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-stone-200">
                      <Package size={36} strokeWidth={1} className="text-stone-300 mx-auto mb-3" />
                      <p className="font-serif text-lg text-stone-700">No Orders Placed Yet</p>
                      <p className="text-xs text-stone-400 mt-1">Explore our seasonal collections to acquire your first piece.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((ord) => (
                        <div key={ord.id} className="bg-white border border-stone-200 p-6 space-y-4 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-stone-400 block">Order Reference</span>
                              <span className="font-mono font-bold text-sm text-stone-900">{ord.order_number}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-stone-400">{ord.created_at.slice(0, 10)}</span>
                              <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                                {ord.order_status}
                              </span>
                            </div>
                          </div>

                          {/* Items in order */}
                          {ord.items && (
                            <div className="divide-y divide-stone-100">
                              {ord.items.map((it) => (
                                <div key={it.id} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-12 bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                                      <img src={it.image_url} alt={it.product_name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-stone-900">{it.product_name}</div>
                                      <div className="text-stone-400">{it.color} · Size {it.size} · Qty {it.quantity}</div>
                                    </div>
                                  </div>
                                  <span className="font-mono tabular-nums text-stone-800">
                                    ${Number(it.subtotal).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="text-stone-500">
                              Tracking: <span className="font-mono text-stone-900 font-semibold">{ord.tracking_number}</span>
                              <span className="mx-2">·</span>
                              Total: <strong className="font-mono text-stone-900">${Number(ord.total_amount).toFixed(2)}</strong>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onViewInvoice(ord.order_number)}
                                className="px-3 py-1.5 border border-stone-300 hover:border-stone-900 text-stone-800 text-[11px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1"
                              >
                                <FileText size={13} />
                                <span>Invoice</span>
                              </button>

                              {ord.order_status !== 'Cancelled' && ord.order_status !== 'Delivered' && (
                                <button
                                  onClick={() => handleCancelOrder(ord.order_number)}
                                  className="px-3 py-1.5 text-stone-500 hover:text-red-700 text-[11px] uppercase tracking-wider font-semibold transition-colors"
                                >
                                  Cancel Order
                                </button>
                              )}

                              {ord.order_status === 'Delivered' && (
                                <button
                                  onClick={() => handleReturnOrder(ord.order_number)}
                                  className="px-3 py-1.5 text-stone-500 hover:text-stone-900 text-[11px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1"
                                >
                                  <RotateCcw size={13} />
                                  <span>Return / Exchange</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Profile */}
              {activeTab === 'profile' && (
                <div className="max-w-md space-y-4">
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
                    Patron Profile Details
                  </h3>
                  <div className="bg-white p-6 border border-stone-200 space-y-3 text-xs">
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block">Full Name</span>
                      <span className="font-semibold text-stone-900 text-sm">{currentUser.full_name}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block">Email Address</span>
                      <span className="font-semibold text-stone-900">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block">Phone</span>
                      <span className="font-semibold text-stone-900">{currentUser.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block">Membership Tier</span>
                      <span className="font-semibold text-amber-900 uppercase tracking-widest">
                        {currentUser.role === 'admin' ? 'Atelier Administrator' : 'Private Salon Member'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      Saved Delivery Addresses
                    </h3>
                    <button
                      onClick={() => setShowAddAddress(!showAddAddress)}
                      className="px-3 py-1.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {showAddAddress && (
                    <form onSubmit={handleAddAddressSubmit} className="bg-white p-4 border border-stone-200 space-y-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Street Address</label>
                        <input
                          type="text"
                          required
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="e.g. 740 Park Avenue"
                          className="w-full p-2 text-xs bg-stone-50 border border-stone-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">City</label>
                          <input
                            type="text"
                            required
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="w-full p-2 text-xs bg-stone-50 border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1">Postal Code</label>
                          <input
                            type="text"
                            required
                            value={addrPostal}
                            onChange={(e) => setAddrPostal(e.target.value)}
                            className="w-full p-2 text-xs bg-stone-50 border border-stone-300"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="px-3 py-1 text-xs text-stone-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  )}

                  {currentUser.addresses && currentUser.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentUser.addresses.map((addr) => (
                        <div key={addr.id} className="bg-white p-4 border border-stone-200 text-xs space-y-1 relative">
                          {addr.is_default === 1 && (
                            <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5">
                              Default Destination
                            </span>
                          )}
                          <div className="font-semibold text-stone-900">{addr.full_name}</div>
                          <div className="text-stone-600">{addr.street}</div>
                          <div className="text-stone-600">{addr.city}, {addr.postal_code}</div>
                          <div className="text-stone-600">{addr.country}</div>
                          <div className="text-stone-400 mt-2">{addr.phone}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">No saved addresses on file.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
