import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../services/apiClient';
import {
  X,
  Plus,
  Trash2,
  Layers,
  Check,
  UploadCloud,
  Image as ImageIcon,
  FolderPlus,
  Star,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ProductFormModal({ onClose }) {
  const { addProduct, collections, addCategory } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('Apex Athletics');
  const [productType, setProductType] = useState('Apparel');
  const [collectionId, setCollectionId] = useState('apparel');
  const [price, setPrice] = useState('79.00');
  const [compareAtPrice, setCompareAtPrice] = useState('99.00');

  // Category addition inline state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Local & Remote Images array: list of { id, url, isLocal, fileName, size }
  const [imagesList, setImagesList] = useState([
    {
      id: 'default_1',
      url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
      isLocal: false,
      fileName: 'default-product.jpg'
    }
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Options: array of { name: 'Size', valuesString: 'S, M, L' }
  const [options, setOptions] = useState([
    { name: 'Size', valuesString: 'S, M, L' },
    { name: 'Color', valuesString: 'Midnight Black, Olive' }
  ]);

  const handleAddOption = () => {
    setOptions([...options, { name: '', valuesString: '' }]);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  // Add Category Handler
  const handleSaveCategory = (e) => {
    e?.preventDefault();
    if (!newCategoryName.trim()) return;

    const created = addCategory({
      title: newCategoryName.trim(),
      description: newCategoryDesc.trim()
    });

    if (created) {
      setCollectionId(created.id);
      setProductType(created.title);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setShowAddCategory(false);
    }
  };

  // Local File Upload Handler
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError('');

    const fileList = Array.from(files);

    for (const file of fileList) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files (PNG, JPG, WEBP, SVG, GIF) are supported.');
        continue;
      }

      const tempId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Instant client-side preview via FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        setImagesList((prev) => [
          ...prev,
          {
            id: tempId,
            url: dataUrl,
            isLocal: true,
            fileName: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB'
          }
        ]);
      };
      reader.readAsDataURL(file);

      // 2. Upload to backend server in background
      try {
        const uploadResult = await apiClient.uploadImage(file);
        if (uploadResult && uploadResult.url) {
          // Update URL to backend hosted endpoint
          setImagesList((prev) =>
            prev.map((item) =>
              item.id === tempId ? { ...item, url: uploadResult.url, serverSaved: true } : item
            )
          );
        }
      } catch (err) {
        console.warn('Backend image upload fallback to dataURL:', err);
      }
    }

    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!customImageUrl.trim()) return;
    setImagesList((prev) => [
      ...prev,
      {
        id: `url_${Date.now()}`,
        url: customImageUrl.trim(),
        isLocal: false,
        fileName: 'External Image'
      }
    ]);
    setCustomImageUrl('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (idToRemove) => {
    setImagesList((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSetPrimary = (index) => {
    setImagesList((prev) => {
      const copy = [...prev];
      const [target] = copy.splice(index, 1);
      return [target, ...copy];
    });
  };

  // Compute Cartesian product of variants based on options entered
  const generateVariants = () => {
    const validOptions = options
      .map((opt) => ({
        name: opt.name.trim(),
        values: opt.valuesString
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      }))
      .filter((opt) => opt.name && opt.values.length > 0);

    if (validOptions.length === 0) {
      return [
        {
          id: `var_${Date.now()}_default`,
          title: 'Default Title',
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          price: parseFloat(price) || 0,
          compareAtPrice: parseFloat(compareAtPrice) || null,
          inventoryQuantity: 20
        }
      ];
    }

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap((d) => curr.map((e) => [...d, e]));
      }, [[]]);
    };

    const valueArrays = validOptions.map((opt) => opt.values);
    const combinations = cartesian(valueArrays);

    const baseSkuPrefix = title
      ? title.split(' ').map((w) => w[0]).join('').toUpperCase()
      : 'APX';

    return combinations.map((combo, idx) => {
      const varTitle = combo.join(' / ');
      const skuSuffix = combo.map((c) => c.substring(0, 3).toUpperCase()).join('-');
      const v = {
        id: `var_${Date.now()}_${idx}`,
        title: varTitle,
        sku: `${baseSkuPrefix}-${skuSuffix}-${idx + 1}`,
        price: parseFloat(price) || 0,
        compareAtPrice: parseFloat(compareAtPrice) || null,
        inventoryQuantity: 15
      };

      if (combo[0]) v.option1 = combo[0];
      if (combo[1]) v.option2 = combo[1];
      if (combo[2]) v.option3 = combo[2];

      return v;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validOptions = options
      .map((opt) => ({
        name: opt.name.trim(),
        values: opt.valuesString
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      }))
      .filter((opt) => opt.name && opt.values.length > 0);

    const generatedVariants = generateVariants();
    const finalImages = imagesList.map((img) => img.url).filter(Boolean);

    addProduct({
      title: title.trim(),
      description: description.trim(),
      vendor: vendor.trim(),
      productType: productType.trim(),
      category: productType.trim(),
      collectionId,
      price: parseFloat(price) || 0,
      compareAtPrice: parseFloat(compareAtPrice) || null,
      image: finalImages[0] || '',
      images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      tags: [productType.toLowerCase(), 'new-arrival'],
      options: validOptions.length > 0 ? validOptions : [{ name: 'Title', values: ['Default Title'] }],
      variants: generatedVariants
    });

    onClose();
  };

  const previewVariants = generateVariants();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Add New Product</h2>
            <p className="text-xs text-zinc-500">Shopify Product Creator with Category Manager & Local Image Uploads</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apex Aero Performance Jacket"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe features, fabric composition, and sizing..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            {/* Categorization & Vendor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Vendor / Brand</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Product Type / Category</label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="e.g. Oversized Tees"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-800">Category Collection</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-[11px] font-bold text-[#008060] hover:text-[#006e52] flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCategory ? 'Close' : 'New'}</span>
                  </button>
                </div>
                <select
                  value={collectionId}
                  onChange={(e) => {
                    setCollectionId(e.target.value);
                    const selected = collections.find((c) => c.id === e.target.value);
                    if (selected && selected.id !== 'all') {
                      setProductType(selected.title);
                    }
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 bg-white"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inline Add Category Section */}
            {showAddCategory && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <FolderPlus className="w-4 h-4 text-[#008060]" />
                  <span>Create New Category</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name (e.g. Oversized T-Shirts, Watches, Streetwear)"
                    className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                  />
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    className="px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            )}

            {/* Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Base Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">Compare-at Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>
            </div>

            {/* =========================================================================
                LOCAL IMAGE UPLOADER & MEDIA MANAGEMENT
                ========================================================================= */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#008060]" />
                  Product Media ({imagesList.length} {imagesList.length === 1 ? 'image' : 'images'})
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  {showUrlInput ? 'Hide URL input' : '+ Or paste image URL'}
                </button>
              </div>

              {/* Drag and Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#008060] bg-emerald-50/50'
                    : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif, image/avif"
                  multiple
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200 text-[#008060] flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800">
                      Click to upload local images or drag & drop files here
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Supports high-resolution PNG, JPG, WEBP, SVG • Instant client preview & server persistence
                    </p>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Optional URL Adder */}
              {showUrlInput && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              )}

              {/* Images Preview Grid */}
              {imagesList.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagesList.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative rounded-xl border border-zinc-200 bg-zinc-100 overflow-hidden group aspect-square shadow-xs"
                    >
                      <img
                        src={img.url}
                        alt={`Product preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Badge */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#008060] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" /> Primary
                        </span>
                      )}

                      {/* Local Badge */}
                      {img.isLocal && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-zinc-200 text-[9px] font-mono px-1.5 py-0.5 rounded">
                          Local
                        </span>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            title="Set as primary image"
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-zinc-900 shadow-xs text-[10px] font-bold cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          title="Remove image"
                          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options & Variants Engine */}
          <div className="pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#008060]" />
                  Product Options & Variant Matrix
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Shopify automatically computes all combinations from your options.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-[#008060] hover:text-[#006e52] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            {/* Options rows */}
            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                    placeholder="Option name (e.g. Size)"
                    className="w-1/3 px-2.5 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                  <input
                    type="text"
                    value={opt.valuesString}
                    onChange={(e) => handleOptionChange(idx, 'valuesString', e.target.value)}
                    placeholder="Comma-separated values (e.g. S, M, L)"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Variants Preview */}
            <div className="mt-4 bg-zinc-100/70 p-3 rounded-lg border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-700 block mb-1.5">
                Generated Variants Matrix ({previewVariants.length} SKUs):
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono text-zinc-600">
                {previewVariants.map((v, i) => (
                  <div key={i} className="flex justify-between bg-white px-2 py-1 rounded border border-zinc-200/60">
                    <span>{v.title}</span>
                    <span className="text-zinc-400">{v.sku}</span>
                    <span className="font-semibold text-emerald-700">${v.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
