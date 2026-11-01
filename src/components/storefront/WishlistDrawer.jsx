import React, { useState } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  Bell,
  BellOff,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function WishlistDrawer({ onSelectProduct }) {
  const {
    wishlist,
    wishlistCount,
    isWishlistOpen,
    closeWishlistDrawer,
    removeFromWishlist,
    moveToCart,
    moveAllToCart,
    clearWishlist,
    togglePriceDropAlert,
    toggleRestockAlert,
    activeAlerts
  } = useWishlist();

  const { activeTheme, products } = useStore();
  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  const [movingId, setMovingId] = useState(null);

  if (!isWishlistOpen) return null;

  const totalValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
  const inStockCount = wishlist.filter(item => item.inStock).length;

  const handleMoveToCart = async (item) => {
    setMovingId(item.id);
    moveToCart(item);
    setTimeout(() => {
      setMovingId(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeWishlistDrawer} />

      {/* Drawer Panel */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200 dark:border-zinc-800 z-10 animate-slideLeft text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Saved for Later
              </h2>
              <span className="text-xs text-zinc-500">
                {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved
              </span>
            </div>
          </div>

          <button
            onClick={closeWishlistDrawer}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Stock & Price Drop Alerts Bar */}
        {activeAlerts.length > 0 && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500 text-white shrink-0">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <div className="flex-1 truncate">
              <strong className="font-bold">Deal Alert: </strong>
              <span>{activeAlerts[0].message}</span>
            </div>
          </div>
        )}

        {/* Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 text-red-400 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-6">
                Explore our catalog and click the heart icon on any product to save items and track price drops.
              </p>
              <button
                onClick={closeWishlistDrawer}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            wishlist.map((item) => {
              const hasCompare = item.compareAtPrice && item.compareAtPrice > item.price;
              const savings = hasCompare ? item.compareAtPrice - item.price : 0;
              const isMoving = movingId === item.id;

              return (
                <div key={item.id} className="pt-4 first:pt-0 flex space-x-3.5">
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      if (onSelectProduct) {
                        const originalProduct = products.find(p => p.id === item.productId);
                        if (originalProduct) {
                          closeWishlistDrawer();
                          onSelectProduct(originalProduct);
                        }
                      }
                    }}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 cursor-pointer group"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 
                            onClick={() => {
                              if (onSelectProduct) {
                                const originalProduct = products.find(p => p.id === item.productId);
                                if (originalProduct) {
                                  closeWishlistDrawer();
                                  onSelectProduct(originalProduct);
                                }
                              }
                            }}
                            className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 hover:underline cursor-pointer"
                          >
                            {item.title}
                          </h4>
                          {item.variantTitle && item.variantTitle !== 'Default Title' && (
                            <span className="text-[11px] text-zinc-400 block font-mono">
                              Variant: {item.variantTitle}
                            </span>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromWishlist(item.productId, item.variantId)}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stock & Dynamic Alerts Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {item.isPriceDropped ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                            <TrendingDown className="w-3 h-3" />
                            <span>Price Dropped! -${item.priceDropSavings.toFixed(2)}</span>
                          </span>
                        ) : null}

                        {item.isRestocked ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <Sparkles className="w-3 h-3" />
                            <span>Back in Stock!</span>
                          </span>
                        ) : null}

                        {item.inStock ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ In Stock ({item.stockQuantity} left)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-red-500">
                            ✕ Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Action Row */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold font-mono text-zinc-900 dark:text-white">
                          ${(item.price || 0).toFixed(2)}
                        </span>
                        {hasCompare && (
                          <span className="text-xs text-zinc-400 line-through">
                            ${(item.compareAtPrice || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Move to Cart 1-Click Action */}
                      <button
                        disabled={!item.inStock || isMoving}
                        onClick={() => handleMoveToCart(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          item.inStock
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {isMoving ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Moving...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Move to Cart</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Notification Alert Toggles */}
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-zinc-400">
                      <button
                        onClick={() => togglePriceDropAlert(item.id)}
                        className={`flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer ${
                          item.notifyPriceDrop ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
                        }`}
                        title="Alert me when this item's price drops"
                      >
                        {item.notifyPriceDrop ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        <span>Price drop alert</span>
                      </button>

                      <button
                        onClick={() => toggleRestockAlert(item.id)}
                        className={`flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer ${
                          item.notifyRestock ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
                        }`}
                        title="Alert me when this item restocks"
                      >
                        {item.notifyRestock ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        <span>Restock alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {wishlist.length > 0 && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/70 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Wishlist Value:</span>
              <span className="font-mono text-base font-extrabold text-zinc-900 dark:text-white">
                ${totalValue.toFixed(2)}
              </span>
            </div>

            {/* 1-Click Move All In-Stock to Cart */}
            <button
              onClick={moveAllToCart}
              disabled={inStockCount === 0}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Move All to Cart ({inStockCount} In Stock)</span>
            </button>

            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
              <button
                onClick={clearWishlist}
                className="hover:text-red-500 hover:underline cursor-pointer"
              >
                Clear Wishlist
              </button>
              <button
                onClick={closeWishlistDrawer}
                className="hover:underline cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

