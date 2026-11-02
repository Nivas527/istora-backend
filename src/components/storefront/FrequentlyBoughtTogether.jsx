import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { apiClient } from '../../services/apiClient';
import { Sparkles, Check, Plus, Equal, ShoppingBag, ShieldCheck, Tag, ArrowRight } from 'lucide-react';

export default function FrequentlyBoughtTogether({ product, currentVariant }) {
  const { addBundleToCart, activeStoreId } = useStore();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [bundleData, setBundleData] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({}); // { [productId]: variant }
  const [checkedMap, setCheckedMap] = useState({}); // { [productId]: boolean }
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Fetch AI Bundle Recommendations
  useEffect(() => {
    let isMounted = true;
    async function loadBundle() {
      if (!product?.id) return;
      setLoading(true);
      try {
        const data = await apiClient.getFrequentlyBoughtTogether({
          productId: product.id,
          storeId: activeStoreId
        });

        if (isMounted && data) {
          setBundleData(data);

          // Initialize variant selections and checked states
          const initialVariants = {};
          const initialChecked = {};

          // Main product
          initialVariants[product.id] = currentVariant || (product.variants && product.variants[0]) || {
            id: `${product.id}_def`,
            title: 'Standard',
            price: product.price
          };
          initialChecked[product.id] = true;

          // Bundle items
          if (Array.isArray(data.bundleItems)) {
            data.bundleItems.forEach((bItem) => {
              if (bItem.product?.id) {
                const pId = bItem.product.id;
                initialVariants[pId] = bItem.selectedVariant || (bItem.product.variants && bItem.product.variants[0]) || {
                  id: `${pId}_def`,
                  title: 'Standard',
                  price: bItem.product.price
                };
                initialChecked[pId] = true;
              }
            });
          }

          setSelectedVariants(initialVariants);
          setCheckedMap(initialChecked);
        }
      } catch (err) {
        console.warn('Failed to load bundle recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBundle();
    return () => {
      isMounted = false;
    };
  }, [product?.id, activeStoreId, currentVariant]);

  // Keep main product variant synced when user changes it in parent modal
  useEffect(() => {
    if (product?.id && currentVariant) {
      setSelectedVariants((prev) => ({
        ...prev,
        [product.id]: currentVariant
      }));
    }
  }, [currentVariant, product?.id]);

  // All 3 items in the bundle (Main + Complementary 1 + Complementary 2)
  const bundleItems = useMemo(() => {
    if (!bundleData?.bundleItems) return [];
    const mainEntry = {
      product: product,
      selectedVariant: selectedVariants[product.id],
      availableVariants: product.variants?.length ? product.variants : [
        { id: `${product.id}_def`, name: 'Standard Fit', price: product.price }
      ],
      isRequired: true,
      matchReason: 'Anchor Product'
    };
    return [mainEntry, ...bundleData.bundleItems];
  }, [bundleData, product, selectedVariants]);

  // Handle checking/unchecking an item
  const toggleItemChecked = (productId) => {
    if (productId === product.id) return; // Main product is anchor
    setCheckedMap((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Handle variant selection change for any item
  const handleVariantChange = (productId, variantId, availableVariants) => {
    const chosen = availableVariants.find((v) => v.id === variantId);
    if (chosen) {
      setSelectedVariants((prev) => ({
        ...prev,
        [productId]: chosen
      }));
    }
  };

  // Dynamic calculations based on checked items
  const activeItems = useMemo(() => {
    return bundleItems.filter((item) => checkedMap[item.product.id]);
  }, [bundleItems, checkedMap]);

  const pricing = useMemo(() => {
    const originalSubtotal = activeItems.reduce((sum, item) => {
      const v = selectedVariants[item.product.id] || item.selectedVariant;
      const price = Number(v?.price ?? item.product.price ?? 0);
      return sum + price;
    }, 0);

    // Tiered bundle savings:
    // 3 items = Save ₹400
    // 2 items = Save ₹200
    // 1 item = Save ₹0
    let savings = 0;
    if (activeItems.length >= 3) {
      savings = bundleData?.bundleSavings || 400;
    } else if (activeItems.length === 2) {
      savings = Math.round((bundleData?.bundleSavings || 400) * 0.5);
    } else {
      savings = 0;
    }

    // Ensure savings doesn't exceed 40% of subtotal
    savings = Math.min(savings, Math.round(originalSubtotal * 0.4));
    const finalBundlePrice = Math.max(0, originalSubtotal - savings);
    const savingsPercent = originalSubtotal > 0 ? Math.round((savings / originalSubtotal) * 100) : 0;

    return {
      originalSubtotal,
      savings,
      finalBundlePrice,
      savingsPercent
    };
  }, [activeItems, selectedVariants, bundleData]);

  // 1-Click Add All to Cart
  const handleAddBundleToCart = () => {
    if (activeItems.length === 0) return;

    const payload = activeItems.map((item) => ({
      product: item.product,
      variant: selectedVariants[item.product.id] || item.selectedVariant || (item.product.variants && item.product.variants[0]) || {
        id: `${item.product.id}_def`,
        title: 'Standard',
        price: item.product.price
      },
      quantity: 1
    }));

    addBundleToCart(payload, 'BUNDLE400');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  if (loading) {
    return (
      <div className="my-6 p-6 border border-zinc-200/80 rounded-2xl bg-zinc-50/50 animate-pulse">
        <div className="h-5 bg-zinc-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-zinc-200 rounded-xl"></div>
          <div className="h-44 bg-zinc-200 rounded-xl"></div>
          <div className="h-44 bg-zinc-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!bundleData || !bundleItems || bundleItems.length < 2) {
    return null;
  }

  return (
    <section className="my-6 p-5 sm:p-6 border border-emerald-500/30 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-zinc-50 shadow-sm relative overflow-hidden">
      {/* Top Banner & Co-Purchase Stat */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 tracking-tight">
              Frequently Bought Together
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Bundle & Save
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{bundleData.coPurchaseStat || '88% of shoppers buy these items together'}</span>
          </p>
        </div>

        {pricing.savings > 0 && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 animate-pulse">
            <Tag className="w-3.5 h-3.5" />
            <span>Save {formatPrice(pricing.savings)} ({pricing.savingsPercent}% OFF)</span>
          </div>
        )}
      </div>

      {/* Bundle Products Display (Items with + separators) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* The Coordinated Product Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bundleItems.map((item, index) => {
            const isMain = index === 0;
            const isChecked = isMain ? true : Boolean(checkedMap[item.product.id]);
            const chosenVariant = selectedVariants[item.product.id] || item.selectedVariant;
            const currentItemPrice = Number(chosenVariant?.price ?? item.product.price ?? 0);
            const variants = item.availableVariants || item.product.variants || [];
            const imageUrl = item.product.images?.[0] || item.product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={item.product.id}
                className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                  isChecked
                    ? 'border-emerald-500/60 bg-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/70 opacity-60'
                }`}
              >
                {/* Header Checkbox & Reason */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isMain}
                      onChange={() => toggleItemChecked(item.product.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-zinc-700">
                      {isMain ? 'This Item' : `Item ${index + 1}`}
                    </span>
                  </label>

                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate max-w-[110px]" title={item.matchReason}>
                    {item.matchReason || 'Curated Style'}
                  </span>
                </div>

                {/* Thumbnail & Title */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-14 h-14 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                    <img
                      src={imageUrl}
                      alt={item.product.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug">
                      {item.product.title}
                    </h4>
                    <p className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                      {formatPrice(currentItemPrice)}
                    </p>
                  </div>
                </div>

                {/* Inline Variant / Size Selector */}
                {variants.length > 1 ? (
                  <div className="mt-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Select Variant
                    </label>
                    <select
                      value={chosenVariant?.id || variants[0]?.id}
                      onChange={(e) => handleVariantChange(item.product.id, e.target.value, variants)}
                      disabled={!isChecked}
                      className="w-full text-xs font-semibold py-1.5 px-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title || v.name} {v.price ? `(${formatPrice(v.price)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 font-medium py-1">
                    Standard Fit • In Stock
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 1-Click Bundle Add To Cart Summary Box */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-emerald-500/40 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">
              Bundle Summary ({activeItems.length} Items)
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Original Price:</span>
                <span className={pricing.savings > 0 ? 'line-through text-zinc-400' : 'font-semibold text-zinc-800'}>
                  {formatPrice(pricing.originalSubtotal)}
                </span>
              </div>

              {pricing.savings > 0 && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <span>Bundle Discount:</span>
                  <span>-{formatPrice(pricing.savings)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-zinc-900">Bundle Price:</span>
                <span className="text-lg font-black text-emerald-700">
                  {formatPrice(pricing.finalBundlePrice)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleAddBundleToCart}
              disabled={activeItems.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                addedSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added {activeItems.length} Items to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Add All {activeItems.length} to Cart
                    {pricing.savings > 0 && ` • Save ${formatPrice(pricing.savings)}`}
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-zinc-400 mt-2 font-medium">
              Bundle discount code <code className="font-mono text-emerald-700">BUNDLE400</code> applied automatically
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

