import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useFit } from '../../context/FitContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';
import Navigation from '../Navigation';
import ProductReviews from './ProductReviews';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import RelatedProductsSection from './RelatedProductsSection';
import FitVerificationWidget from '../fit/FitVerificationWidget';
import { getProductTierPricing, DEFAULT_VOLUME_TIERS } from '../../utils/promotionEngine';
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  AlertCircle,
  Truck,
  RotateCcw,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Heart,
  Zap,
  Tag,
  Share2,
  CheckCircle2
} from 'lucide-react';

export default function ProductDetailPage({
  product: initialProduct,
  onBack,
  onSelectProduct,
  onBuyNow
}) {
  const [product, setProduct] = useState(initialProduct);

  useEffect(() => {
    setProduct(initialProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialProduct]);

  const { addToCart, activeTheme, settings, isDedicatedStore, setActiveMode, setIsCartOpen } = useStore();
  const { profile, openScanModal } = useFit();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('shipping');

  const themeStyles = activeTheme?.styles || {};

  // Initialize selected options to the first variant's values
  useEffect(() => {
    if (product && product.options && product.options.length > 0) {
      const initial = {};
      const firstVariant = product.variants[0];
      if (firstVariant) {
        if (product.options[0]) initial[product.options[0].name] = firstVariant.option1;
        if (product.options[1]) initial[product.options[1].name] = firstVariant.option2;
        if (product.options[2]) initial[product.options[2].name] = firstVariant.option3;
      }
      setSelectedOptions(initial);
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [product]);

  // Resolve matching variant using Shopify combinatorial matching algorithm
  const currentVariant = useMemo(() => {
    if (!product || !product.variants) return null;

    return product.variants.find((v) => {
      let matches = true;
      if (product.options[0]) {
        matches = matches && v.option1 === selectedOptions[product.options[0].name];
      }
      if (product.options[1]) {
        matches = matches && v.option2 === selectedOptions[product.options[1].name];
      }
      if (product.options[2]) {
        matches = matches && v.option3 === selectedOptions[product.options[2].name];
      }
      return matches;
    }) || product.variants[0];
  }, [product, selectedOptions]);

  const currentPrice = currentVariant ? currentVariant.price : product?.price;
  const compareAtPrice = currentVariant ? currentVariant.compareAtPrice : product?.compareAtPrice;
  const stockAvailable = currentVariant ? currentVariant.inventoryQuantity : 0;
  const isSoldOut = stockAvailable <= 0;

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value
    }));
  };

  // Calculate dynamic volume tier savings
  const tierPricing = useMemo(() => {
    return getProductTierPricing(currentPrice || 0, quantity);
  }, [currentPrice, quantity]);

  const isWishlisted = isInWishlist(product?.id);

  const handleAddToCart = () => {
    if (!product || isSoldOut) return;
    addToCart(product, currentVariant, {
      ...selectedOptions,
      fitProfile: profile
    }, quantity);
    setAddedSuccess(true);
    setIsCartOpen(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (!product || isSoldOut) return;
    addToCart(product, currentVariant, {
      ...selectedOptions,
      fitProfile: profile
    }, quantity);
    if (onBuyNow) {
      onBuyNow();
    } else {
      setIsCartOpen(true);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSwitchProduct = (newProd) => {
    setProduct(newProd);
    setActiveImageIndex(0);
    setQuantity(1);
    if (onSelectProduct) onSelectProduct(newProd);
  };

  if (!product) return null;

  return (
    <div className={`min-h-screen flex flex-col ${(themeStyles.pageBg) || 'bg-[#f6f6f7] text-zinc-900'}`}>
      {/* Top Store Navigation */}
      <Navigation
        onSearchClick={() => {
          onBack();
        }}
        onTrackClick={() => {
          onBack();
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation Bar */}
        <nav className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 mb-6 pb-4 border-b border-zinc-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-bold text-zinc-800 hover:text-emerald-600 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs hover:border-emerald-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>
            <span className="text-zinc-300">/</span>
            <span className="hover:text-zinc-800 cursor-pointer" onClick={onBack}>
              {product.category || 'Apparel'}
            </span>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
              {product.title}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-all"
            title="Share Product"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </nav>

        {/* Primary Product Showcase Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden p-6 sm:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left Column: Image Gallery (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Main Stage Image */}
              <div className="relative aspect-4/3 sm:aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner group">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />

                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                  {compareAtPrice && compareAtPrice > currentPrice && (
                    <span className="bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                      Save {Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)}%
                    </span>
                  )}
                  {isSoldOut ? (
                    <span className="bg-zinc-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase">
                      Sold Out
                    </span>
                  ) : stockAvailable < 10 ? (
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                      Only {stockAvailable} Left
                    </span>
                  ) : null}
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product, currentVariant)}
                  className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500 border border-red-200 ring-2 ring-red-400/20 scale-105'
                      : 'bg-white/90 hover:bg-white text-zinc-600 hover:text-red-500 hover:scale-110'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save for Later'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                </button>
              </div>

              {/* Thumbnail Selector Strip */}
              {product.images.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 ring-4 ring-emerald-500/20 scale-105'
                          : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees & Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 text-center text-xs text-zinc-600">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center">
                  <Truck className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-bold text-zinc-900">Express Delivery</span>
                  <span className="text-[11px] text-zinc-500">2-4 Business Days</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center">
                  <RotateCcw className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-bold text-zinc-900">30-Day Easy Returns</span>
                  <span className="text-[11px] text-zinc-500">Zero Hassle Pickup</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center">
                  <Shield className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-bold text-zinc-900">Verified Quality</span>
                  <span className="text-[11px] text-zinc-500">100% Authentic</span>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Options, Sizing & Add to Cart (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                {/* Brand / Vendor & Title */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {product.vendor || settings.storeName}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    SKU: {currentVariant ? currentVariant.sku : 'N/A'}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                  {product.title}
                </h1>

                {/* Price Block */}
                <div className="mt-4 flex items-baseline justify-between border-b border-zinc-100 pb-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-zinc-900 tracking-tight">
                      {formatPrice(currentPrice || 0)}
                    </span>
                    {compareAtPrice && compareAtPrice > currentPrice && (
                      <span className="text-lg text-zinc-400 line-through">
                        {formatPrice(compareAtPrice || 0)}
                      </span>
                    )}
                  </div>

                  <div>
                    {stockAvailable > 0 ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {stockAvailable} In Stock
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Shopify Options & Variant Selector */}
                <div className="mt-6 space-y-4">
                  {Array.isArray(product.options) && product.options.map((option) => (
                    <div key={option.name} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-900">
                          {option.name}:{' '}
                          <span className="text-zinc-600 font-normal">
                            {selectedOptions[option.name]}
                          </span>
                        </span>

                        {option.name.toLowerCase().includes('size') && (
                          <button
                            type="button"
                            onClick={openScanModal}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>Size Check ({profile.chestCm}cm / {profile.waistCm}cm)</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {option.values.map((val) => {
                          const isSelected = selectedOptions[option.name] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleOptionChange(option.name, val)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-zinc-900 text-white shadow-md ring-2 ring-zinc-900/20 scale-102'
                                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metric Sizing & Zero-Return Fit Widget */}
                <div className="mt-6">
                  <FitVerificationWidget
                    product={product}
                    selectedSize={
                      selectedOptions['Size'] ||
                      selectedOptions['size'] ||
                      (Array.isArray(product.options) && selectedOptions[product.options.find(o => o?.name?.toLowerCase()?.includes('size'))?.name]) ||
                      Object.values(selectedOptions)[0] ||
                      'M'
                    }
                    onSelectSize={(newSize) => {
                      const sizeKey = Object.keys(selectedOptions).find(k => k.toLowerCase().includes('size')) || 'Size';
                      handleOptionChange(sizeKey, newSize);
                    }}
                  />
                </div>

                {/* Volume Tier Pricing */}
                <div className="mt-6 pt-5 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Volume Tier Discounts</span>
                    </div>
                    {tierPricing.discountPercent > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                        Saving {tierPricing.discountPercent}% ({formatPrice(tierPricing.totalSavings)} off)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {DEFAULT_VOLUME_TIERS.map((tier) => {
                      const isSelected = (tier.minQty === 1 && quantity === 1) ||
                        (tier.minQty === 2 && quantity === 2) ||
                        (tier.minQty === 3 && quantity >= 3);
                      const tierUnitDiscount = ((currentPrice || 0) * tier.discountPercent) / 100;
                      const tierUnitPrice = Math.max(0, (currentPrice || 0) - tierUnitDiscount);

                      return (
                        <button
                          key={tier.minQty}
                          type="button"
                          onClick={() => setQuantity(tier.minQty)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-600/20'
                              : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                          }`}
                        >
                          {tier.badge && (
                            <span className={`absolute -top-2 right-2 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                              tier.minQty === 3
                                ? 'bg-amber-500 text-white'
                                : tier.minQty === 2
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {tier.badge}
                            </span>
                          )}
                          <div className="text-xs font-bold text-zinc-900">
                            {tier.minQty === 1 ? '1 Unit' : tier.minQty === 2 ? 'Buy 2' : 'Buy 3+'}
                          </div>
                          <div className="font-mono text-xs font-extrabold text-zinc-900 mt-1">
                            {formatPrice(tierUnitPrice)}
                            <span className="text-[10px] text-zinc-400 font-normal">/ea</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            {tier.discountPercent > 0 ? `Save ${tier.discountPercent}%` : 'Standard'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Controls & Dual Action Buttons */}
                <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-zinc-300 rounded-xl bg-zinc-50 overflow-hidden shadow-xs">
                      <button
                        disabled={quantity <= 1 || isSoldOut}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3.5 py-3 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 transition-colors text-sm font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-4 text-xs font-bold text-zinc-900 min-w-[32px] text-center">
                        {quantity}
                      </span>
                      <button
                        disabled={quantity >= stockAvailable || isSoldOut}
                        onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
                        className="px-3.5 py-3 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 transition-colors text-sm font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      disabled={isSoldOut}
                      onClick={handleAddToCart}
                      className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
                        isSoldOut
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          : addedSuccess
                          ? 'bg-emerald-600 text-white scale-102'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-98'
                      }`}
                    >
                      {addedSuccess ? (
                        <>
                          <Check className="w-5 h-5 animate-scaleIn" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>
                            {isSoldOut ? 'Sold Out' : `Add to Cart • ${formatPrice(tierPricing.finalPrice)}`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Buy Now Express Button */}
                  {!isSoldOut && (
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-zinc-900 hover:bg-black text-white transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Buy Now with 1-Click</span>
                    </button>
                  )}
                </div>

                {/* Collapsible Accordion Sections */}
                <div className="mt-6 border-t border-zinc-200 divide-y divide-zinc-200 text-xs">
                  <div className="py-3">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === 'shipping' ? '' : 'shipping')}
                      className="flex justify-between items-center w-full font-bold text-zinc-800 text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-zinc-500" />
                        <span>Shipping & Delivery</span>
                      </span>
                      {openAccordion === 'shipping' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openAccordion === 'shipping' && (
                      <div className="mt-2 text-zinc-600 space-y-1 pl-6 leading-relaxed">
                        <p>Orders dispatched within 24 hours. Free standard shipping on orders over {formatPrice(settings.freeShippingThreshold || 75)}.</p>
                        <p>Track your package in real-time with automated SMS & WhatsApp notifications.</p>
                      </div>
                    )}
                  </div>

                  <div className="py-3">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === 'returns' ? '' : 'returns')}
                      className="flex justify-between items-center w-full font-bold text-zinc-800 text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-zinc-500" />
                        <span>Returns & Exchanges</span>
                      </span>
                      {openAccordion === 'returns' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {openAccordion === 'returns' && (
                      <div className="mt-2 text-zinc-600 space-y-1 pl-6 leading-relaxed">
                        <p>Hassle-free 30-day doorstep return and instant replacement window.</p>
                        <p>Our Size Check engine minimizes fit returns to under 1.8%.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Frequently Bought Together Bundle Builder */}
        <div className="mb-12">
          <FrequentlyBoughtTogether currentProduct={product} product={product} currentVariant={currentVariant} />
        </div>

        {/* Customer Reviews & Social Proof */}
        <div className="mb-12">
          <ProductReviews product={product} />
        </div>

        {/* Related Products Carousel */}
        <div className="mb-12">
          <RelatedProductsSection
            currentProduct={product}
            onSelectProduct={handleSwitchProduct}
          />
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 border-t border-zinc-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-200 font-bold">{settings.storeName}</span>
            <span>• {settings.customDomain || settings.storeDomain}</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <button
              onClick={onBack}
              className="hover:text-emerald-400 underline cursor-pointer"
            >
              Back to Catalog
            </button>
            <span className="text-zinc-600">•</span>
            <span>Support: {settings.contactEmail}</span>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setActiveMode('admin')}
              className="hover:text-zinc-200 text-zinc-600 cursor-pointer text-[10px]"
            >
              Merchant Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
