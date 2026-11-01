import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useWishlist } from '../../context/WishlistContext';
import AntiBracketingBanner from '../fit/AntiBracketingBanner';
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
  Truck,
  Heart,
  Zap,
  Gift,
  Sparkles
} from 'lucide-react';

export default function CartDrawer({ onProceedToCheckout }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartItemsCount,
    cartSubtotal,
    cartDiscountAmount,
    volumeTierSavings,
    totalCartSavings,
    thresholdProgress,
    bogoDetails,
    availablePromotions,
    isAutoAppliedDiscount,
    cartTotal,
    amountToFreeShipping,
    isFreeShipping,
    settings,
    products,
    updateCartItemQty,
    removeFromCart,
    applyDiscount,
    removeDiscount,
    appliedDiscount
  } = useStore();

  const { addToWishlist, wishlistCount, openWishlistDrawer } = useWishlist();

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

        {/* Cart Value Threshold Milestone Meter */}
        {thresholdProgress && (
          <div className={`p-3 border-b text-xs transition-all ${
            thresholdProgress.isUnlocked
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <Zap className={`w-3.5 h-3.5 ${thresholdProgress.isUnlocked ? 'text-amber-600 fill-amber-500' : 'text-zinc-500'}`} />
                <span>{thresholdProgress.message}</span>
              </div>
              <span className="font-mono text-[11px] font-extrabold text-amber-700">
                {thresholdProgress.rewardText}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${thresholdProgress.percentComplete}%` }}
              />
            </div>
          </div>
        )}

        {/* BOGO Promotional Milestone Banner */}
        {bogoDetails && (
          <div className={`p-2.5 px-3 border-b text-xs flex items-center justify-between ${
            bogoDetails.eligible
              ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold'
              : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}>
            <div className="flex items-center gap-1.5">
              <Gift className={`w-3.5 h-3.5 ${bogoDetails.eligible ? 'text-blue-600' : 'text-zinc-400'}`} />
              <span>{bogoDetails.message}</span>
            </div>
            {bogoDetails.eligible && (
              <span className="font-mono font-bold text-blue-700 text-[11px]">
                Saved ₹{Math.round(bogoDetails.savings).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}

        {/* Anti-Bracketing Multi-Size Order Guard */}
        <div className="px-4 pt-2">
          <AntiBracketingBanner />
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

                  {/* Save for Later Action */}
                  <div className="flex items-center justify-start pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const prod = products.find(p => p.id === item.productId) || {
                          id: item.productId,
                          title: item.title,
                          price: item.price,
                          images: [item.image],
                          variants: [{ id: item.variantId, title: item.variantTitle, price: item.price, inventoryQuantity: item.maxStock || 10 }]
                        };
                        const v = prod.variants?.find(vx => vx.id === item.variantId);
                        addToWishlist(prod, v);
                        removeFromCart(item.variantId);
                      }}
                      className="text-[11px] text-zinc-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Heart className="w-3 h-3 text-red-400" />
                      <span>Save for later</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Saved for Later Banner */}
        {wishlistCount > 0 && (
          <div className="px-4 py-2 bg-red-50/50 border-t border-red-100 flex items-center justify-between text-xs">
            <span className="text-zinc-700 flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
              <span>{wishlistCount} saved for later</span>
            </span>
            <button
              onClick={() => {
                setIsCartOpen(false);
                openWishlistDrawer();
              }}
              className="text-emerald-700 hover:text-emerald-800 hover:underline font-semibold cursor-pointer"
            >
              View Wishlist →
            </button>
          </div>
        )}

        {/* Footer (Discount Code, Subtotal, Checkout Button) */}
        {cart.items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50/80 space-y-3">
            {/* Promo Code Input & Quick Apply Chips */}
            <div className="space-y-2">
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs text-emerald-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold">{appliedDiscount.code}</span>
                    {isAutoAppliedDiscount && (
                      <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                        Auto-Applied
                      </span>
                    )}
                    <span className="text-[11px] text-emerald-700">({appliedDiscount.description})</span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="text-zinc-400 hover:text-zinc-700 font-bold ml-2 text-sm cursor-pointer"
                    title="Remove discount"
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
                    placeholder="Discount code (e.g. WELCOME20, BOGO21, FLAT500)"
                    className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Quick-Apply Available Promotion Chips */}
              {availablePromotions && availablePromotions.length > 0 && !appliedDiscount && (
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Available Promotions (Tap to Apply):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePromotions.slice(0, 3).map((promo) => (
                      <button
                        key={promo.code}
                        type="button"
                        onClick={() => {
                          const res = applyDiscount(promo.code);
                          setPromoMessage(res);
                        }}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Tag className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{promo.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {promoMessage && !appliedDiscount && (
                <p className={`text-[11px] mt-1 ${promoMessage.success ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                  {promoMessage.message}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900">₹{Math.round(cartSubtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {volumeTierSavings > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Volume Tier Savings</span>
                  </span>
                  <span>-₹{Math.round(volumeTierSavings || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              {cartDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Discount ({appliedDiscount?.code})
                    {isAutoAppliedDiscount && <span className="ml-1 text-[10px] text-emerald-700 font-bold">(Auto)</span>}
                  </span>
                  <span>-₹{Math.round(cartDiscountAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Taxes & Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Estimated Total</span>
                <span className="text-base text-zinc-950 font-mono">
                  ₹{Math.round(cartTotal || Math.max(0, (cartSubtotal || 0) - (cartDiscountAmount || 0) - (volumeTierSavings || 0))).toLocaleString('en-IN')}
                </span>
              </div>

              {totalCartSavings > 0 && (
                <div className="bg-emerald-100/60 border border-emerald-200 rounded-lg p-2 text-center text-[11px] font-bold text-emerald-800">
                  🎉 Total Savings on this order: ₹{Math.round(totalCartSavings).toLocaleString('en-IN')}!
                </div>
              )}
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
