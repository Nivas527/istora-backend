import React from 'react';
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Check,
  RotateCcw,
  Tag,
  DollarSign,
  Palette,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export default function FacetedFilterBar({
  isOpen,
  onToggle,
  priceRange,
  setPriceRange,
  minPossiblePrice,
  maxPossiblePrice,
  selectedSizes,
  setSelectedSizes,
  availableSizes,
  recommendedSize,
  selectedColors,
  setSelectedColors,
  availableColors,
  getColorHex,
  selectedStyles,
  setSelectedStyles,
  availableStyles,
  inStockOnly,
  setInStockOnly,
  onResetFilters,
  activeFilterCount,
  currencySymbol = '$',
  isDark = false
}) {
  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleStyle = (style) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  return (
    <div className="w-full">
      {/* Top Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              isOpen
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Faceted Filters</span>
            {activeFilterCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isOpen ? 'bg-white text-emerald-800' : 'bg-emerald-500 text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Fit Check One-Click Filter */}
          {recommendedSize && (
            <button
              onClick={() => toggleSize(recommendedSize)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedSizes.includes(recommendedSize)
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
              title={`Filter directly to garments available in your calibrated size (${recommendedSize})`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>✨ Filter to My Fit ({recommendedSize})</span>
            </button>
          )}

          {/* Quick In-Stock Only Pill */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              inStockOnly
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-xs'
                : isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>In-Stock Only</span>
          </button>
        </div>

        {/* Clear All Reset Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips Row */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-2.5">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1">Active:</span>

          {priceRange[1] < maxPossiblePrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              <span>Up to {currencySymbol}{priceRange[1]}</span>
              <button
                onClick={() => setPriceRange([minPossiblePrice, maxPossiblePrice])}
                className="hover:text-red-500 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedSizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
            >
              <span>Size: {size} {size === recommendedSize ? '✨' : ''}</span>
              <button onClick={() => toggleSize(size)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedColors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: getColorHex(color) }}
              />
              <span>{color}</span>
              <button onClick={() => toggleColor(color)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedStyles.map((style) => (
            <span
              key={style}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
            >
              <span>#{style}</span>
              <button onClick={() => toggleStyle(style)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              <span>In-Stock Only</span>
              <button onClick={() => setInStockOnly(false)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Expanded Faceted Filter Panel */}
      {isOpen && (
        <div className={`mt-3 p-5 rounded-2xl border transition-all animate-fadeIn ${
          isDark
            ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* 1. Price Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Max Price</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{priceRange[1]}
                </span>
              </div>

              <input
                type="range"
                min={minPossiblePrice}
                max={maxPossiblePrice}
                step={5}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([minPossiblePrice, Number(e.target.value)])}
                className="w-full accent-emerald-600 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>{currencySymbol}{minPossiblePrice}</span>
                <span>{currencySymbol}{maxPossiblePrice}</span>
              </div>

              {/* Quick Price Brackets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50, 100, 150, maxPossiblePrice].map((bracket) => (
                  <button
                    key={bracket}
                    type="button"
                    onClick={() => setPriceRange([minPossiblePrice, bracket])}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      priceRange[1] === bracket
                        ? 'bg-emerald-500 text-white border-emerald-500 font-bold'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    ≤ {currencySymbol}{bracket}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Size Filter (Linked with Biometric Fit) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Size Filter
                </span>
                {recommendedSize && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Fit: {recommendedSize}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  const isRec = size === recommendedSize;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-105'
                          : isRec
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      <span>{size}</span>
                      {isRec && !isSelected && (
                        <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                          ✨
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400">
                Sizes marked with ✨ match your body scan measurements.
              </p>
            </div>

            {/* 3. Color Swatches */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-blue-500" />
                <span>Color Swatches</span>
              </span>

              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  const hex = getColorHex(color);

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`group relative flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="truncate max-w-[90px]">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Style & Aesthetics Tags */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-500" />
                <span>Style Tags</span>
              </span>

              <div className="flex flex-wrap gap-1.5">
                {availableStyles.map((style) => {
                  const isSelected = selectedStyles.includes(style);

                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      #{style}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
