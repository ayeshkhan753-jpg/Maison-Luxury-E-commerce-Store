import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    try {
      const res = await api.subscribeNewsletter(email);
      setStatus('success');
      setMessage(res.message);
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Subscription failed. Please try again.');
    }
  };

  return (
    <section className="py-20 bg-stone-900 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-amber-200/90 font-medium block mb-3">
          Private Access
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Join the MAISON Gazette
        </h2>
        <p className="text-stone-300 text-sm md:text-base font-light max-w-xl mx-auto mb-8 text-balance">
          Receive private runway invitations, private salon previews, and notifications of limited atelier editions.
        </p>

        {status === 'success' ? (
          <div className="p-4 bg-white/10 border border-white/20 max-w-md mx-auto text-xs text-amber-200 flex items-center justify-center gap-2">
            <Check size={16} />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-4 py-3 bg-stone-800 border border-stone-700 text-stone-100 text-xs tracking-wider placeholder:text-stone-500 focus:outline-none focus:border-stone-400"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-[#FAF8F5] text-stone-900 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>{status === 'loading' ? 'Subscribing...' : 'Subscribe'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-xs text-red-400 mt-3">{message}</p>
        )}

        <p className="text-[11px] text-stone-500 mt-6 tracking-wider">
          We honor your privacy. Unsubscribe at any moment with a single click.
        </p>
      </div>
    </section>
  );
};
