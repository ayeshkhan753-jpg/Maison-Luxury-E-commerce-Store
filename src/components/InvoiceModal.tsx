import React, { useState, useEffect } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { api } from '../services/api';

interface InvoiceModalProps {
  orderNumber: string | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ orderNumber, onClose }) => {
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      setLoading(true);
      api.getInvoiceHtml(orderNumber)
        .then((html) => setInvoiceHtml(html))
        .catch((err) => setInvoiceHtml(`<div style="padding: 40px; text-align: center; color: red;">Failed to load invoice: ${err.message}</div>`))
        .finally(() => setLoading(false));
    }
  }, [orderNumber]);

  if (!orderNumber) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl h-[90vh] shadow-2xl border border-stone-200 flex flex-col">
        {/* Controls Bar */}
        <div className="p-4 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg tracking-widest uppercase font-bold">MAISON Official Invoice</span>
            <span className="font-mono text-xs text-stone-400">#{orderNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const iframe = document.getElementById('invoice-frame') as HTMLIFrameElement;
                iframe?.contentWindow?.print();
              }}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white transition-colors"
              aria-label="Close invoice"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Frame */}
        <div className="flex-1 bg-[#FAF8F5] overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs uppercase tracking-widest text-stone-500">
              Generating Atelier Invoice...
            </div>
          ) : (
            <iframe
              id="invoice-frame"
              srcDoc={invoiceHtml}
              title="Official Invoice"
              className="w-full h-full border-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};
