import React from 'react';
import { Eye, Plus, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function ProductCard({ product, onSelect }) {
  const { activeTheme } = useStore();
  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  const primaryImage = product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
  const secondaryImage = product.images[1] || primaryImage;

  const totalStock = product.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0);
  const isSoldOut = totalStock <= 0;

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Check color options if available
  const colorOption = Array.isArray(product.options)
    ? product.options.find((opt) => opt?.name && (opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'finish'))
    : null;

  return (
    <div
      onClick={() => onSelect(product)}
      className={`group ${themeStyles.cardBg || 'bg-white border-zinc-200 text-zinc-900'} rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative`}
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {hasDiscount && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Save {discountPercent}%
          </span>
        )}
        {isSoldOut ? (
          <span className="bg-zinc-800 text-zinc-200 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Sold Out
          </span>
        ) : totalStock < 10 ? (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
            Only {totalStock} Left
          </span>
        ) : null}
      </div>

      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className={`w-full ${themeStyles.buttonBg || 'bg-white/95 text-zinc-900'} font-semibold text-xs py-2.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-1.5 backdrop-blur-sm transition-transform active:scale-95`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Select Options & View Details</span>
          </button>
        </div>
      </div>

      {/* Product Meta */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center justify-between text-xs mb-1 opacity-70">
            <span className="uppercase tracking-wider font-semibold text-[10px]">
              {product.vendor || 'Apex'}
            </span>
            {colorOption && (
              <span className="text-[11px] font-medium">
                {colorOption.values.length} {colorOption.values.length === 1 ? 'color' : 'colors'}
              </span>
            )}
          </div>

          <h3 className={`font-semibold text-sm transition-colors line-clamp-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {product.title}
          </h3>
        </div>

        {/* Price & Variants summary */}
        <div className={`mt-3 pt-3 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
              style={{ color: isDark && themeStyles.accentColor ? themeStyles.accentColor : undefined }}
            >
              ${(product?.price || 0).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs opacity-50 line-through">
                ${(product?.compareAtPrice || 0).toFixed(2)}
              </span>
            )}
          </div>

          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
            {product?.variants?.length || 0} {(product?.variants?.length || 0) === 1 ? 'variant' : 'variants'}
          </span>
        </div>
      </div>
    </div>
  );
}
