import React from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStore } from '../../context/StoreContext';
import { Gift, X, Sparkles, ArrowRight } from 'lucide-react';

export default function ReferralWelcomeBanner() {
  const { referralBanner, dismissReferralBanner } = useCustomerAuth();
  const { applyDiscount } = useStore();

  if (!referralBanner) return null;

  const handleClaim = () => {
    applyDiscount('GIVE200');
    const catalog = document.getElementById('catalog-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white px-4 py-2.5 shadow-md relative z-40 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Gift className="w-3.5 h-3.5 text-yellow-200" />
          </div>
          <div>
            <span className="font-extrabold tracking-wide">
              🎁 Welcome to Istora! You unlocked ₹200 OFF
            </span>
            <span className="hidden md:inline text-amber-100 ml-1.5">
              Invited via referral code <strong className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-white">{referralBanner.code}</strong>. Applied on orders above ₹999.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleClaim}
            className="px-3.5 py-1 bg-white hover:bg-amber-50 text-zinc-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Claim ₹200 Discount</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={dismissReferralBanner}
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
