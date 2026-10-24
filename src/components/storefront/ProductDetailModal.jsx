import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import ProductReviews from './ProductReviews';
import {
  X,
  ShoppingBag,
  Check,
  AlertCircle,
  Truck,
  RotateCcw,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useStore();

  // Selected image index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Selected options state: e.g. { "Size": "M", "Color": "Midnight Onyx" }
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('shipping'); // 'shipping' | 'arch' | 'materials'

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

  // Resolve matching variant using Shopify's combinatorial matching algorithm
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

  if (!product) return null;

  const currentPrice = currentVariant ? currentVariant.price : product.price;
  const compareAtPrice = currentVariant ? currentVariant.compareAtPrice : product.compareAtPrice;
  const stockAvailable = currentVariant ? currentVariant.inventoryQuantity : 0;
  const isSoldOut = stockAvailable <= 0;

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value
    }));
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!currentVariant || isSoldOut) return;
    addToCart(product, currentVariant, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Modal Dialog Container */}
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-zinc-900 text-white font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {product.images.length > 1 && (
              <div className="flex space-x-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#008060] ring-2 ring-[#008060]/20'
                        : 'border-zinc-200 hover:border-zinc-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-zinc-500">
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#008060] mb-1" />
                <span>Fast Shipping</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-[#008060] mb-1" />
                <span>30-Day Returns</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex flex-col items-center">
                <Shield className="w-4 h-4 text-[#008060] mb-1" />
                <span>2-Year Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Column: Variant Matrix, Pricing, & Add to Cart */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Vendor & Title */}
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                {product.vendor}
              </p>
              <h2 className="text-2xl font-bold text-zinc-900 leading-tight">
                {product.title}
              </h2>

              {/* Price & SKU */}
              <div className="mt-3 flex items-baseline justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-zinc-900">
                    ${(currentPrice || 0).toFixed(2)}
                  </span>
                  {compareAtPrice && compareAtPrice > currentPrice && (
                    <span className="text-base text-zinc-400 line-through">
                      ${(compareAtPrice || 0).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    SKU: {currentVariant ? currentVariant.sku : 'N/A'}
                  </span>
                  {stockAvailable > 0 ? (
                    <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {stockAvailable} in stock
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-500 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Out of stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
                {product.description}
              </p>

              {/* Options & Variants Selector (Shopify Variant Matrix) */}
              <div className="mt-6 space-y-4">
                {Array.isArray(product.options) && product.options.map((option) => (
                  <div key={option.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-800">
                        {option.name}:{' '}
                        <span className="text-zinc-500 font-normal">
                          {selectedOptions[option.name]}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => {
                        const isSelected = selectedOptions[option.name] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleOptionChange(option.name, val)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#008060] text-white shadow-sm ring-2 ring-[#008060]/30'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
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

              {/* Quantity Stepper & Add to Cart */}
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center border border-zinc-300 rounded-lg bg-zinc-50 overflow-hidden">
                  <button
                    disabled={quantity <= 1 || isSoldOut}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition-colors text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold text-zinc-800 min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity >= stockAvailable || isSoldOut}
                    onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
                    className="px-3 py-2.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  disabled={isSoldOut}
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isSoldOut
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#008060] hover:bg-[#006e52] text-white shadow-[#008060]/25'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : isSoldOut ? (
                    <span>Sold Out in this Combination</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart • ${((currentPrice || 0) * (quantity || 1)).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Educational / Architectural Accordion */}
            <div className="border-t border-zinc-200 pt-3 space-y-2">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'arch' ? null : 'arch')}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-zinc-800 hover:text-[#008060] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  REA Architectural Insight: Option-Variant Matrix
                </span>
                {openAccordion === 'arch' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {openAccordion === 'arch' && (
                <div className="p-3 bg-zinc-50 rounded-lg text-[11px] text-zinc-600 space-y-1.5 border border-zinc-200">
                  <p>
                    <strong>How Shopify handles this:</strong> Shopify stores up to 3 options axes (`option1`, `option2`, `option3`). Every unique Cartesian combination generates a distinct <code>ProductVariant</code> node with its own inventory item, SKU, and price.
                  </p>
                  <p className="font-mono text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded">
                    Selected ID: {currentVariant?.id} | SKU: {currentVariant?.sku} | Stock: {currentVariant?.inventoryQuantity}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Reviews & Star Ratings */}
            <ProductReviews productId={product.id} productTitle={product.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
