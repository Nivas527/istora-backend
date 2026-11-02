import { Eye, Plus, ShoppingBag, Sparkles, Heart, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useFit } from '../../context/FitContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function ProductCard({ product, onSelect }) {
  const { activeTheme } = useStore();
  const { profile, openScanModal } = useFit();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  const isWishlisted = isInWishlist(product.id);

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

      {/* Wishlist Heart Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
          isWishlisted
            ? 'bg-red-500 text-white scale-105 ring-2 ring-red-400'
            : 'bg-white/85 hover:bg-white text-zinc-600 hover:text-red-500 hover:scale-110'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Save for Later'}
      >
        <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
      </button>

      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>✨ Fit Check • Verify My Size</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className={`w-full ${themeStyles.buttonBg || 'bg-white/95 text-zinc-900'} font-semibold text-xs py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-transform active:scale-95 cursor-pointer`}
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

          {/* Customer Rating & Star Score */}
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {product.rating || '4.9'}
            </span>
            <span className="text-zinc-400 text-[10px]">
              ({product.reviewCount || 18})
            </span>
          </div>

          {/* Direct Biometric Fit & Volume Tier Badge */}
          <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>✨ Fit Check</span>
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
              ⚡ Buy 2+ Save 15%
            </span>
          </div>
        </div>

        {/* Price & Variants summary */}
        <div className={`mt-3 pt-3 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
              style={{ color: isDark && themeStyles.accentColor ? themeStyles.accentColor : undefined }}
            >
              {formatPrice(product?.price || 0)}
            </span>
            {hasDiscount && (
              <span className="text-xs opacity-50 line-through">
                {formatPrice(product?.compareAtPrice || 0)}
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
