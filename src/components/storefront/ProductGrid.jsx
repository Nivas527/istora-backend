import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useStore } from '../../context/StoreContext';
import { Filter, ArrowUpDown, Search, PackageX } from 'lucide-react';

export default function ProductGrid({ onSelectProduct, searchQuery, setSearchQuery }) {
  const { products, collections, activeTheme } = useStore();
  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Collection filter
      const matchesCollection =
        selectedCollection === 'all' || product.collectionId === selectedCollection;

      // 2. Search query filter
      const q = (searchQuery || '').trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.tags && product.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCollection && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'variants-desc') return b.variants.length - a.variants.length;
      return 0; // featured / default
    });
  }, [products, selectedCollection, searchQuery, sortBy]);

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters & Sorting Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        {/* Collection Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCollection === col.id
                  ? (themeStyles.filterTabActive || 'bg-zinc-900 text-white shadow-sm')
                  : (themeStyles.filterTabInactive || 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200')
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Inline search bar */}
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

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-[#008060] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="variants-desc">Most Variants</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mt-4 mb-6 flex items-center justify-between text-xs text-zinc-500">
        <p>
          Showing <span className="font-semibold text-zinc-800">{filteredProducts.length}</span> products
          {selectedCollection !== 'all' && (
            <span> in <span className="text-[#008060] font-semibold">{collections.find((c) => c.id === selectedCollection)?.title}</span></span>
          )}
          {searchQuery && <span> matching "<span className="text-zinc-800">{searchQuery}</span>"</span>}
        </p>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <PackageX className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800">No products found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching to another collection category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCollection('all');
            }}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
