import React, { useState, useEffect } from 'react';
import { useFit } from '../../context/FitContext';
import { useStore } from '../../context/StoreContext';
import {
  ShieldAlert,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function AntiBracketingBanner() {
  const { cart, removeFromCart } = useStore();
  const { checkAntiBracketing } = useFit();

  const [bracketAlerts, setBracketAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);

  useEffect(() => {
    let isMounted = true;
    async function evaluateCart() {
      if (!cartItems || cartItems.length < 2) {
        setBracketAlerts([]);
        return;
      }
      setLoading(true);
      const res = await checkAntiBracketing(cartItems);
      if (isMounted) {
        setBracketAlerts(res?.alerts || []);
        setLoading(false);
      }
    }
    evaluateCart();
    return () => { isMounted = false; };
  }, [cartItems, JSON.stringify(cartItems?.map(i => ({ id: i.variantId || i.id, q: i.quantity, s: i.selectedSize || i.variantTitle })))]);

  if (!bracketAlerts || bracketAlerts.length === 0) return null;

  const handleDropRedundantSizes = (alert) => {
    // Find cart items matching this product with redundant sizes and remove them
    const redundantSizeNames = (alert.redundantSizes || []).map(r => r.size.toLowerCase());
    const itemsToRemove = cartItems.filter((item) => {
      const matchProduct = (item.productId === alert.productId) || (item.id === alert.productId);
      const itemSize = (item.selectedSize || item.size || item.variantTitle?.split('/')?.[0]?.trim() || '').toLowerCase();
      return matchProduct && redundantSizeNames.includes(itemSize);
    });

    itemsToRemove.forEach((item) => {
      removeFromCart(item.variantId || item.id);
    });
  };

  return (
    <div className="space-y-2 p-3 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-xl my-2 animate-fadeIn">
      {bracketAlerts.map((alert, idx) => (
        <div key={idx} className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">
                  {alert.headline || 'Bracket-Buying Detected'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                  Zero Return Guarantee
                </span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                {alert.explanation}
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-zinc-700">
              <span className="font-semibold text-emerald-700">Guaranteed Fit: </span>
              <strong className="text-zinc-900">Size {alert.recommendedSize}</strong>
              <span className="text-zinc-400"> ({alert.recommendedScore}% metric confidence)</span>
            </div>

            <button
              type="button"
              onClick={() => handleDropRedundantSizes(alert)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Keep Size {alert.recommendedSize} & Drop Duplicate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
