import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';

export default function CartDrawer({ onProceedToCheckout }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartItemsCount,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
    amountToFreeShipping,
    isFreeShipping,
    settings,
    updateCartItemQty,
    removeFromCart,
    applyDiscount,
    removeDiscount,
    appliedDiscount
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = applyDiscount(promoInput);
    setPromoMessage(res);
    if (res.success) {
      setPromoInput('');
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round(((settings.freeShippingThreshold - amountToFreeShipping) / settings.freeShippingThreshold) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200 animate-slideLeft">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#008060]" />
            <h2 className="text-base font-bold text-zinc-900">Your Cart</h2>
            <span className="bg-zinc-200 text-zinc-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {cartItemsCount}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-3.5 text-xs">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-900 font-medium">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            {isFreeShipping ? (
              <span className="font-semibold text-emerald-700">
                🎉 Congratulations! You have unlocked Free Shipping!
              </span>
            ) : (
              <span>
                Add <strong className="text-emerald-700">${(amountToFreeShipping || 0).toFixed(2)}</strong> more for <strong>Free Shipping</strong>
              </span>
            )}
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#008060] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Line Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-zinc-100">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-12 h-12 text-zinc-300 mb-3" />
              <p className="text-sm font-semibold text-zinc-700">Your cart is empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Explore our catalog and choose your favorite technical pieces.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.variantId} className="pt-4 first:pt-0 flex gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {item.variantTitle}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {item.sku}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50">
                      <button
                        onClick={() => updateCartItemQty(item.variantId, item.quantity - 1)}
                        className="px-2 py-1 text-zinc-500 hover:text-zinc-900 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold text-zinc-800">
                        {item.quantity}
                      </span>
                      <button
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => updateCartItemQty(item.variantId, item.quantity + 1)}
                        className="px-2 py-1 text-zinc-500 hover:text-zinc-900 text-xs font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-zinc-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer (Discount Code, Subtotal, Checkout Button) */}
        {cart.items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50/80 space-y-3">
            {/* Promo Code Input */}
            <div>
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold">{appliedDiscount.code}</span>
                    <span className="text-[11px] text-emerald-600">({appliedDiscount.description})</span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="text-zinc-400 hover:text-zinc-700 font-bold ml-2"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Discount code (e.g. WELCOME20)"
                    className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Apply
                  </button>
                </form>
              )}

              {promoMessage && !appliedDiscount && (
                <p className={`text-[11px] mt-1 ${promoMessage.success ? 'text-emerald-600' : 'text-red-500'}`}>
                  {promoMessage.message}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900">${(cartSubtotal || 0).toFixed(2)}</span>
              </div>

              {cartDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-${(cartDiscountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Taxes & Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Estimated Total</span>
                <span className="text-base text-zinc-950">
                  ${Math.max(0, (cartSubtotal || 0) - (cartDiscountAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-4 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl font-bold text-sm shadow-md shadow-[#008060]/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
