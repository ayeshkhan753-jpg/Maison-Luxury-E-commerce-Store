import React, { useState } from 'react';
import { X } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#171717] text-[#FAF8F5] text-xs py-2 px-4 relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="w-6" /> {/* spacer */}
        <div className="text-center font-normal tracking-wider flex-1 flex items-center justify-center gap-3">
          <span>Complimentary White-Glove Global Shipping on Orders Over $300</span>
          <span className="hidden md:inline text-stone-500">·</span>
          <span className="hidden md:inline text-amber-200/90">Use Code <strong className="font-semibold tracking-widest">LUXURY20</strong> for 20% Off Orders Over $1,000</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-stone-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss announcement"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
