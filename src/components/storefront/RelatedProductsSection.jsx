import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { apiClient } from '../../services/apiClient';
import { Sparkles, ShoppingBag, Eye, Check, Star } from 'lucide-react';

export default function RelatedProductsSection({ currentProduct, onSelectProduct }) {
  const { addToCart, activeStoreId } = useStore();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addedItemMap, setAddedItemMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadRelated() {
      if (!currentProduct?.id) return;
      setLoading(true);
      try {
        const data = await apiClient.getFrequentlyBoughtTogether({
          productId: currentProduct.id,
          storeId: activeStoreId
        });
        if (isMounted && data?.relatedProducts) {
          setRelatedProducts(data.relatedProducts);
        }
      } catch (err) {
        console.warn('Failed to load related products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRelated();
    return () => {
      isMounted = false;
    };
  }, [currentProduct?.id, activeStoreId]);

  const handleQuickAdd = (relItem) => {
    const prod = relItem.product;
    const variant = prod.variants?.[0] || {
      id: `${prod.id}_def`,
      title: 'Standard',
      price: prod.price
    };
    addToCart(prod, variant, 1);
    setAddedItemMap((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="my-6 pt-4 border-t border-zinc-200">
        <div className="h-5 bg-zinc-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-zinc-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="my-6 pt-5 border-t border-zinc-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 tracking-tight">
              Frequently Bought Together & Style Pairings
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Curated based on co-purchase history, color harmony & silhouette pairing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {relatedProducts.slice(0, 4).map((item) => {
          const prod = item.product;
          const imageUrl = prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
          const isAdded = Boolean(addedItemMap[prod.id]);

          return (
            <div
              key={prod.id}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-2.5 hover:border-emerald-500/50 hover:shadow-md transition-all"
            >
              <div>
                {/* AI Match Badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{item.matchScore}% Match</span>
                  </span>
                  <span className="text-[9px] font-semibold text-zinc-500 truncate" title={item.affinityType}>
                    {item.affinityBadge || 'Stylist Pick'}
                  </span>
                </div>

                {/* Product Thumbnail */}
                <div
                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                  className="aspect-square w-full rounded-lg bg-zinc-100 overflow-hidden mb-2 cursor-pointer relative"
                >
                  <img
                    src={imageUrl}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-zinc-800 rounded-md shadow-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      View
                    </span>
                  </div>
                </div>

                {/* Title & Price */}
                <h4
                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                  className="text-xs font-bold text-zinc-800 line-clamp-1 hover:text-emerald-700 cursor-pointer"
                  title={prod.title}
                >
                  {prod.title}
                </h4>
                <p className="text-xs font-extrabold text-zinc-900 mt-0.5">
                  {formatPrice(prod.price)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAdd(item)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

