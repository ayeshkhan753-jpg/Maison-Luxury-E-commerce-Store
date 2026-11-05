import React, { useState } from 'react';
import { X, Check, Lock, ShieldCheck, CreditCard, Banknote, Building, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { CartData, User, Order } from '../types';
import { api } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartData: CartData | null;
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onViewInvoice: (orderNumber: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartData,
  currentUser,
  onOrderSuccess,
  onViewInvoice,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState(currentUser?.full_name || 'Genevieve Laurent');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'client@maison.luxury');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+1 (212) 555-0144');

  const defaultAddr = currentUser?.addresses?.find((a) => a.is_default) || currentUser?.addresses?.[0];
  const [shippingCountry, setShippingCountry] = useState(defaultAddr?.country || 'United States');
  const [shippingCity, setShippingCity] = useState(defaultAddr?.city || 'New York');
  const [shippingStreet, setShippingStreet] = useState(defaultAddr?.street || '740 Park Avenue, Penthouse B');
  const [shippingPostal, setShippingPostal] = useState(defaultAddr?.postal_code || '10021');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Deliver to building concierge in signature MAISON packaging.');

  const [paymentMethod, setPaymentMethod] = useState<'stripe_sandbox' | 'cod' | 'local_gateway'>('stripe_sandbox');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  if (!isOpen) return null;

  const totals = cartData?.totals || {
    subtotal: 0,
    discount_amount: 0,
    shipping_fee: 0,
    tax_amount: 0,
    total_amount: 0,
    coupon: null,
    is_free_shipping: true
  };
  const items = cartData?.items || [];

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_street: shippingStreet,
        shipping_city: shippingCity,
        shipping_postal: shippingPostal,
        shipping_country: shippingCountry,
        delivery_instructions: deliveryInstructions,
        payment_method: paymentMethod,
        coupon_code: totals.coupon?.code || ''
      };

      const res = await api.placeOrder(payload);
      setCompletedOrder(res.order);
      setStep(5);
      onOrderSuccess(res.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment or order authorization failed. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF8F5] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold block mb-0.5">
              Secure Checkout Atelier
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              {step === 5 ? 'Order Confirmation' : 'White-Glove Order Processing'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="Close Checkout"
          >
            <X size={20} />
          </button>
        </div>

        {/* Multi-step progress indicators */}
        {step < 5 && (
          <div className="bg-stone-100 border-b border-stone-200 px-6 py-3">
            <div className="flex items-center justify-between max-w-2xl mx-auto text-xs uppercase tracking-wider font-medium text-stone-500">
              <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-stone-900 font-semibold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-stone-900 text-white' : 'bg-stone-200'}`}>1</span>
                <span>Contact</span>
              </span>
              <span className="text-stone-300">———</span>
              <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-stone-900 font-semibold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-stone-900 text-white' : 'bg-stone-200'}`}>2</span>
                <span>Delivery</span>
              </span>
              <span className="text-stone-300">———</span>
              <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-stone-900 font-semibold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-stone-900 text-white' : 'bg-stone-200'}`}>3</span>
                <span>Review</span>
              </span>
              <span className="text-stone-300">———</span>
              <span className={`flex items-center gap-1.5 ${step >= 4 ? 'text-stone-900 font-semibold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-stone-900 text-white' : 'bg-stone-200'}`}>4</span>
                <span>Payment</span>
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-10 flex-1">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 text-xs border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Customer Contact */}
          {step === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">Step 1: Patron Contact Information</h3>
              <p className="text-xs text-stone-500 font-light">
                Order confirmation, dispatch telemetry, and tracking documentation will be sent to this email.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Mobile / Telephone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Destination */}
          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">Step 2: White-Glove Shipping Destination</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Country / Region</label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Italy">Italy</option>
                    <option value="Germany">Germany</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Japan">Japan</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                    placeholder="e.g. 740 Park Avenue, Penthouse B"
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={shippingPostal}
                      onChange={(e) => setShippingPostal(e.target.value)}
                      className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1">Delivery Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Concierge gate code, discreet packaging preferences..."
                    className="w-full p-3 text-sm bg-white border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-stone-600 hover:text-stone-950 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <span>Review Order</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Order Review */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">Step 3: Verification & Order Review</h3>

              {/* Items Breakdown */}
              <div className="bg-white border border-stone-200 p-4 divide-y divide-stone-100">
                {items.map((it) => (
                  <div key={it.item_id} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <img src={it.image_url} alt={it.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{it.product_name}</div>
                        <div className="text-stone-500">{it.color} · Size {it.size} · Qty {it.quantity}</div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">
                      ${(it.unit_price * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping & Financial Breakdown */}
              <div className="bg-stone-100 p-4 border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal</span>
                  <span className="font-mono font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Promotional Savings ({totals.coupon?.code})</span>
                    <span className="font-mono font-medium">-${totals.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">White-Glove Express Shipping</span>
                  <span className="font-mono font-medium">
                    {totals.shipping_fee === 0 ? 'COMPLIMENTARY' : `$${totals.shipping_fee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">VAT / Sales Tax (8.5%)</span>
                  <span className="font-mono font-medium">${totals.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Grand Total</span>
                  <span className="font-mono">${totals.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs text-stone-500 space-y-1">
                <p><strong>Shipping to:</strong> {customerName}, {shippingStreet}, {shippingCity}, {shippingPostal}, {shippingCountry}</p>
                <p><strong>Notifications:</strong> {customerEmail} · {customerPhone}</p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-stone-600 hover:text-stone-950 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-8 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <span>Select Payment</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Selection */}
          {step === 4 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-stone-900">Step 4: Payment Method</h3>
                <span className="text-[11px] font-mono uppercase bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5">
                  Sandbox Active
                </span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'stripe_sandbox'
                      ? 'border-stone-900 bg-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="stripe_sandbox"
                    checked={paymentMethod === 'stripe_sandbox'}
                    onChange={() => setPaymentMethod('stripe_sandbox')}
                    className="mt-1 accent-stone-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={15} />
                        <span>Stripe International Gateway (Sandbox)</span>
                      </span>
                      <span className="text-[10px] text-stone-400">Visa / Mastercard / Amex</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Instant authorized transaction using test mode credentials. No real charges incurred.
                    </p>

                    {paymentMethod === 'stripe_sandbox' && (
                      <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full p-2 text-xs bg-stone-50 border border-stone-300 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Expires</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full p-2 text-xs bg-stone-50 border border-stone-300 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">CVC</label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              className="w-full p-2 text-xs bg-stone-50 border border-stone-300 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-stone-900 bg-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-stone-900"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Banknote size={15} />
                      <span>Cash on Delivery (White-Glove Courier)</span>
                    </span>
                    <p className="text-xs text-stone-500 mt-1">
                      Settle payment directly with our authorized courier agent upon inspection of luxury garments.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'local_gateway'
                      ? 'border-stone-900 bg-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="local_gateway"
                    checked={paymentMethod === 'local_gateway'}
                    onChange={() => setPaymentMethod('local_gateway')}
                    className="mt-1 accent-stone-900"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building size={15} />
                      <span>Regional Payment Gateway (Pakistan & Middle East)</span>
                    </span>
                    <p className="text-xs text-stone-500 mt-1">
                      Direct sandbox integration for local bank transfer, PayFast, and digital wallet checkout.
                    </p>
                  </div>
                </label>
              </div>

              {/* Security Trust */}
              <div className="flex items-center gap-2 text-xs text-stone-500 pt-2">
                <Lock size={14} className="text-stone-700" />
                <span>256-Bit SSL Encrypted & Verified by Atelier Security.</span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-stone-600 hover:text-stone-950 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span>{isSubmitting ? 'Authorizing Atelier Order...' : `Authorize & Pay $${totals.total_amount.toFixed(2)}`}</span>
                  <ShieldCheck size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Order Confirmation */}
          {step === 5 && completedOrder && (
            <div className="max-w-xl mx-auto text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-stone-900 text-amber-200/90 rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-stone-500 font-semibold block mb-1">
                  Atelier Acquisition Complete
                </span>
                <h3 className="font-serif text-3xl font-bold text-stone-900">
                  Thank you, {completedOrder.customer_name || 'Valued Patron'}
                </h3>
              </div>

              <div className="bg-white border border-stone-200 p-6 text-xs text-stone-700 text-left space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                  <span className="text-stone-500">Order Number</span>
                  <span className="font-mono font-bold text-base text-stone-900">{completedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tracking Code</span>
                  <span className="font-mono font-semibold text-stone-900">{completedOrder.tracking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Status</span>
                  <span className="font-semibold text-emerald-800">{completedOrder.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Order Status</span>
                  <span className="font-semibold text-stone-900">{completedOrder.order_status}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 font-bold text-sm text-stone-900">
                  <span>Total Amount Paid</span>
                  <span className="font-mono">${Number(completedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed font-light">
                An official order confirmation has been dispatched to <strong>{completedOrder.customer_email}</strong>.
                Our master artisans in Biella and Paris are now preparing your pieces.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => onViewInvoice(completedOrder.order_number)}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-100 border border-stone-300 text-stone-900 text-xs uppercase tracking-widest font-semibold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={15} />
                  <span>View Official Invoice</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 transition-colors"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
