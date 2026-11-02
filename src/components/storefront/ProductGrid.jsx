import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import FacetedFilterBar from './FacetedFilterBar';
import { useStore } from '../../context/StoreContext';
import { useFit } from '../../context/FitContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Filter, ArrowUpDown, Search, PackageX, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function ProductGrid({ onSelectProduct, searchQuery, setSearchQuery }) {
  const { products, collections, activeTheme, settings, activeStore } = useStore();
  const { profile } = useFit();
  const { currencySymbol, convertPrice, currentCurrency } = useCurrency();
  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Faceted Filter States
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Dynamically compute min and max price across catalog in active currency
  const { minPossiblePrice, maxPossiblePrice } = useMemo(() => {
    if (!products || products.length === 0) return { minPossiblePrice: 0, maxPossiblePrice: 500 };
    let min = Infinity;
    let max = -Infinity;
    products.forEach((p) => {
      const pPrice = convertPrice(Number(p.price) || 0);
      if (pPrice < min) min = pPrice;
      if (pPrice > max) max = pPrice;
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          const vPrice = convertPrice(Number(v.price) || 0);
          if (vPrice < min) min = vPrice;
          if (vPrice > max) max = vPrice;
        });
      }
    });
    return {
      minPossiblePrice: Math.floor(min === Infinity ? 0 : min),
      maxPossiblePrice: Math.ceil(max === -Infinity ? 500 : max)
    };
  }, [products, convertPrice, currentCurrency]);

  const [priceRange, setPriceRange] = useState([minPossiblePrice, maxPossiblePrice]);

  // Sync price range if catalog changes
  React.useEffect(() => {
    setPriceRange([minPossiblePrice, maxPossiblePrice]);
  }, [minPossiblePrice, maxPossiblePrice]);

  // Shopper's calibrated fit size
  const recommendedSize = useMemo(() => {
    const chest = profile?.chestCm || 99;
    if (chest <= 92) return 'XS';
    if (chest <= 98) return 'S';
    if (chest <= 104) return 'M';
    if (chest <= 110) return 'L';
    if (chest <= 116) return 'XL';
    return 'XXL';
  }, [profile?.chestCm]);

  // Dynamically extract all available sizes
  const availableSizes = useMemo(() => {
    const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const catalogSizes = new Set();
    products.forEach((p) => {
      const sizeOpt = p.options?.find((o) => o?.name?.toLowerCase() === 'size');
      if (sizeOpt && Array.isArray(sizeOpt.values)) {
        sizeOpt.values.forEach((v) => catalogSizes.add(v.toUpperCase()));
      }
    });
    const found = standardSizes.filter((s) => catalogSizes.has(s));
    return found.length > 0 ? found : standardSizes.slice(1, 5); // Fallback: S, M, L, XL
  }, [products]);

  // Dynamically extract all available colors
  const availableColors = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const colorOpt = p.options?.find(
        (o) => o?.name?.toLowerCase() === 'color' || o?.name?.toLowerCase() === 'finish'
      );
      if (colorOpt && Array.isArray(colorOpt.values)) {
        colorOpt.values.forEach((v) => set.add(v));
      }
    });
    return Array.from(set);
  }, [products]);

  // Color hex helper for swatches
  const getColorHex = (colorName) => {
    const c = (colorName || '').toLowerCase();
    if (c.includes('black') || c.includes('stealth') || c.includes('obsidian')) return '#18181b';
    if (c.includes('white') || c.includes('frost')) return '#f8fafc';
    if (c.includes('grey') || c.includes('gray') || c.includes('charcoal') || c.includes('slate') || c.includes('concrete')) return '#64748b';
    if (c.includes('red') || c.includes('crimson')) return '#ef4444';
    if (c.includes('sand') || c.includes('terracotta') || c.includes('desert') || c.includes('tan')) return '#d97706';
    if (c.includes('blue') || c.includes('navy')) return '#3b82f6';
    if (c.includes('green') || c.includes('olive') || c.includes('emerald')) return '#10b981';
    return '#94a3b8';
  };

  // Dynamically extract unique style tags
  const availableStyles = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t.toLowerCase()));
      }
    });
    return Array.from(set).slice(0, 8);
  }, [products]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceRange[1] < maxPossiblePrice) count++;
    if (selectedSizes.length > 0) count += selectedSizes.length;
    if (selectedColors.length > 0) count += selectedColors.length;
    if (selectedStyles.length > 0) count += selectedStyles.length;
    if (inStockOnly) count++;
    return count;
  }, [priceRange, maxPossiblePrice, selectedSizes, selectedColors, selectedStyles, inStockOnly]);

  const handleResetFilters = () => {
    setPriceRange([minPossiblePrice, maxPossiblePrice]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedStyles([]);
    setInStockOnly(false);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // 1. Collection filter
        const matchesCollection =
          selectedCollection === 'all' || product.collectionId === selectedCollection;
        if (!matchesCollection) return false;

        // 2. Search query filter
        const q = (searchQuery || '').trim().toLowerCase();
        if (q) {
          const titleMatch = (product.title || '').toLowerCase().includes(q);
          const descMatch = (product.description || '').toLowerCase().includes(q);
          const vendorMatch = (product.vendor || '').toLowerCase().includes(q);
          const tagMatch = product.tags && product.tags.some((t) => t.toLowerCase().includes(q));
          const optionMatch = product.options && product.options.some((o) =>
            o.values?.some((v) => v.toLowerCase().includes(q))
          );
          if (!titleMatch && !descMatch && !vendorMatch && !tagMatch && !optionMatch) return false;
        }

        // 3. Price Range filter (in active currency)
        const pPrice = convertPrice(Number(product.price) || 0);
        if (pPrice > priceRange[1]) return false;

        // 4. In-Stock Only filter
        const totalStock = (product.variants || []).reduce(
          (sum, v) => sum + (v.inventoryQuantity || 0),
          0
        );
        if (inStockOnly && totalStock <= 0) return false;

        // 5. Size Filter
        if (selectedSizes.length > 0) {
          const productSizes = new Set();
          const sizeOption = product.options?.find((o) => o?.name?.toLowerCase() === 'size');
          if (sizeOption && Array.isArray(sizeOption.values)) {
            sizeOption.values.forEach((v) => productSizes.add(v.toUpperCase()));
          }
          if (Array.isArray(product.variants)) {
            product.variants.forEach((v) => {
              if (v.option1) productSizes.add(v.option1.toUpperCase());
              if (v.option2) productSizes.add(v.option2.toUpperCase());
            });
          }
          const hasMatchingSize = selectedSizes.some((s) => productSizes.has(s.toUpperCase()));
          if (!hasMatchingSize) return false;
        }

        // 6. Color Filter
        if (selectedColors.length > 0) {
          const productColors = new Set();
          const colorOption = product.options?.find(
            (o) => o?.name?.toLowerCase() === 'color' || o?.name?.toLowerCase() === 'finish'
          );
          if (colorOption && Array.isArray(colorOption.values)) {
            colorOption.values.forEach((v) => productColors.add(v.toLowerCase()));
          }
          if (Array.isArray(product.variants)) {
            product.variants.forEach((v) => {
              if (v.option1) productColors.add(v.option1.toLowerCase());
              if (v.option2) productColors.add(v.option2.toLowerCase());
            });
          }
          const hasMatchingColor = selectedColors.some((c) =>
            productColors.has(c.toLowerCase())
          );
          if (!hasMatchingColor) return false;
        }

        // 7. Style Tags Filter
        if (selectedStyles.length > 0) {
          const tags = (product.tags || []).map((t) => t.toLowerCase());
          const hasMatchingStyle = selectedStyles.some((s) => tags.includes(s.toLowerCase()));
          if (!hasMatchingStyle) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // High-precision sorting options
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'newest') {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        if (sortBy === 'rating') {
          const ratingA = a.rating ?? 4.8;
          const ratingB = b.rating ?? 4.8;
          return ratingB - ratingA;
        }
        if (sortBy === 'best-sellers') {
          const stockA = (a.variants || []).reduce((s, v) => s + (v.inventoryQuantity || 0), 0);
          const stockB = (b.variants || []).reduce((s, v) => s + (v.inventoryQuantity || 0), 0);
          return stockA - stockB;
        }
        if (sortBy === 'variants-desc') {
          return (b.variants?.length || 0) - (a.variants?.length || 0);
        }
        return 0; // featured / default
      });
  }, [
    products,
    selectedCollection,
    searchQuery,
    sortBy,
    priceRange,
    selectedSizes,
    selectedColors,
    selectedStyles,
    inStockOnly
  ]);

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Tabs & Quick Search/Sort Controls */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        {/* Collection Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCollection === col.id
                  ? themeStyles.filterTabActive || 'bg-zinc-900 text-white shadow-sm'
                  : themeStyles.filterTabInactive ||
                    'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Keyword Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword or tag..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs transition-all border ${
                isDark
                  ? 'bg-zinc-900/90 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* High-Precision Sorting Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-[#008060] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
              <option value="rating">Customer Rating</option>
              <option value="best-sellers">Best Sellers</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Advanced Faceted Filter Bar Component */}
      <FacetedFilterBar
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        minPossiblePrice={minPossiblePrice}
        maxPossiblePrice={maxPossiblePrice}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        availableSizes={availableSizes}
        recommendedSize={recommendedSize}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        availableColors={availableColors}
        getColorHex={getColorHex}
        selectedStyles={selectedStyles}
        setSelectedStyles={setSelectedStyles}
        availableStyles={availableStyles}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
        currencySymbol={currencySymbol}
        isDark={isDark}
      />

      {/* Results Header */}
      <div className="mt-4 mb-6 flex items-center justify-between text-xs text-zinc-500">
        <p>
          Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredProducts.length}</span> products
          {selectedCollection !== 'all' && (
            <span> in <span className="text-[#008060] font-semibold">{collections.find((c) => c.id === selectedCollection)?.title}</span></span>
          )}
          {searchQuery && <span> matching "<span className="text-zinc-800 dark:text-zinc-200 font-semibold">{searchQuery}</span>"</span>}
        </p>

        {activeFilterCount > 0 && (
          <span className="text-[11px] text-emerald-600 font-medium">
            Faceted filters active
          </span>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <PackageX className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            No matching products found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Try adjusting your price slider, clearing selected size or color filters, or switching categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCollection('all');
              handleResetFilters();
            }}
            className="mt-4 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Reset All Filters & Search
          </button>
        </div>
      )}
    </section>
  );
}
