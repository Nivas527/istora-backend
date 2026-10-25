import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import ProductFormModal from './ProductFormModal';
import ShopifyMigrationModal from './ShopifyMigrationModal';
import { Plus, Search, Trash2, Layers, CheckCircle2, FolderPlus, X, Tag, Sparkles, Upload } from 'lucide-react';

export default function ProductsView() {
  const { products, deleteProduct, collections, addCategory, deleteCategory } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // New Category State in Categories Modal
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catError, setCatError] = useState('');

  const handleCreateCategory = (e) => {
    e?.preventDefault();
    if (!newCatTitle.trim()) {
      setCatError('Category name is required.');
      return;
    }
    addCategory({
      title: newCatTitle.trim(),
      description: newCatDesc.trim()
    });
    setNewCatTitle('');
    setNewCatDesc('');
    setCatError('');
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.productType && p.productType.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (p.productType && p.productType.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title or type..."
            className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Shopify Dual-Model Migrator Button */}
          <button
            onClick={() => setIsMigrationModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Import existing data from Shopify CSV or live Admin API"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import from Shopify</span>
          </button>

          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>Manage Categories ({collections.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-400 font-medium shrink-0 flex items-center gap-1 text-[11px]">
          <Tag className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          All ({products.length})
        </button>
        {collections.map((cat) => {
          const count = products.filter(
            (p) => p.productType && p.productType.toLowerCase() === cat.title.toLowerCase()
          ).length;
          const isSelected = selectedCategory.toLowerCase() === cat.title.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.title)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#008060] text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <span>{cat.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {filtered.map((product) => {
                const totalStock = (product.variants || []).reduce(
                  (sum, v) => sum + (v.inventoryQuantity || 0),
                  0
                );
                return (
                  <tr key={product.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-200 bg-zinc-100 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-zinc-900">{product.title}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {(product.variants || []).length} {(product.variants || []).length === 1 ? 'variant' : 'variants'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {totalStock > 0 ? (
                        <span className="font-semibold text-zinc-800">
                          {totalStock} in stock for {(product.variants || []).length} variants
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">0 in stock</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-zinc-600 font-medium">
                      {product.productType || 'Standard'}
                    </td>

                    <td className="py-3 px-4 font-bold text-zinc-900">
                      ${(product.price || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded hover:bg-zinc-100"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <ProductFormModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {/* Manage Categories Modal */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#008060] rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">Product Categories & Collections</h3>
                  <p className="text-zinc-500 text-xs">Organize products into dynamic store collections</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add New Category Form */}
              <form onSubmit={handleCreateCategory} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <FolderPlus className="w-4 h-4 text-[#008060]" />
                  <span>Create New Category</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Category Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Winter Jackets, Accessories, Footwear"
                      value={newCatTitle}
                      onChange={(e) => setNewCatTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Brief description for customer storefront SEO"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                    />
                  </div>
                </div>

                {catError && (
                  <p className="text-[11px] text-red-500 font-medium">{catError}</p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span>Current Store Categories</span>
                  <span className="text-zinc-400 font-normal">{collections.length} total</span>
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  {collections.map((cat) => {
                    const productCount = products.filter(
                      (p) => p.productType && p.productType.toLowerCase() === cat.title.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 flex items-center justify-between hover:bg-zinc-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase">
                            {cat.title.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900">{cat.title}</span>
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                                {productCount} {productCount === 1 ? 'product' : 'products'}
                              </span>
                            </div>
                            {cat.description ? (
                              <p className="text-[11px] text-zinc-400 line-clamp-1">{cat.description}</p>
                            ) : (
                              <p className="text-[11px] text-zinc-300 italic font-mono">handle: {cat.handle || cat.id}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove category "${cat.title}"? Associated products will not be deleted.`)) {
                                deleteCategory(cat.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopify Dual-Model Migrator Modal */}
      <ShopifyMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
}
