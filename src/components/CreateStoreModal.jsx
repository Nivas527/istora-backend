import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { apiClient } from '../services/apiClient';
import {
  X,
  Sparkles,
  Store,
  MapPin,
  Globe,
  Layers,
  ArrowRight,
  AlertCircle,
  Check,
  ChevronDown,
  Upload,
  FileSpreadsheet,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const LOCATION_OPTIONS = [
  {
    id: 'India',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    symbol: '₹',
    tax: '18% GST',
    gateways: 'UPI/QR, Cards, NetBanking, COD'
  },
  {
    id: 'United States',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    tax: '8% Sales Tax',
    gateways: 'Stripe, Cards, Apple Pay, COD'
  },
  {
    id: 'United Kingdom',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    tax: '20% VAT',
    gateways: 'Stripe, Cards, Google Pay, COD'
  },
  {
    id: 'United Arab Emirates',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'د.إ',
    tax: '5% VAT',
    gateways: 'Stripe, Cards, COD'
  },
  {
    id: 'European Union',
    name: 'European Union',
    flag: '🇪🇺',
    currency: 'EUR',
    symbol: '€',
    tax: '19% VAT',
    gateways: 'Stripe, SEPA, Cards, COD'
  },
  {
    id: 'Canada',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    symbol: 'C$',
    tax: '13% HST',
    gateways: 'Stripe, Cards, Interac, COD'
  },
  {
    id: 'Australia',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    symbol: 'A$',
    tax: '10% GST',
    gateways: 'Stripe, Cards, COD'
  }
];

const CATEGORY_OPTIONS = [
  'Consumer Electronics & Tech',
  'Fashion, Apparel & Footwear',
  'Beauty, Cosmetics & Skincare',
  'Food, Beverages & Specialty Goods',
  'Home, Kitchen & Modern Living',
  'Sports, Fitness & Outdoors',
  'General Merchandise'
];

export default function CreateStoreModal({ onClose }) {
  const { createStore, themes, refreshStoreData } = useStore();

  // Basic Details
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isHandleCustom, setIsHandleCustom] = useState(false);
  const [location, setLocation] = useState('India');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [email, setEmail] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('theme_apex_velocity');

  // Catalog Setup
  const [catalogType, setCatalogType] = useState('starter'); // 'starter' | 'empty' | 'shopify'
  const [showShopifyImport, setShowShopifyImport] = useState(false);
  const [shopifyImportMode, setShopifyImportMode] = useState('csv'); // 'csv' | 'api'
  const [csvFile, setCsvFile] = useState(null);
  const [mirrorImages, setMirrorImages] = useState(true);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const fileInputRef = useRef(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected Location Config
  const selectedLocConfig = LOCATION_OPTIONS.find((l) => l.id === location) || LOCATION_OPTIONS[0];

  const handleNameChange = (val) => {
    setName(val);
    if (!isHandleCustom) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setHandle(generated);
    }
    if (!email && val.trim()) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '');
      setEmail(`owner@${slug || 'store'}.com`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Please select a valid Shopify products .csv export file.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your store name.');
      return;
    }

    const cleanHandle = (handle.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const newStoreId = `store_${cleanHandle}`;
    const isImporting = catalogType === 'shopify';

    if (isImporting) {
      if (shopifyImportMode === 'csv' && !csvFile) {
        setErrorMessage('Please choose a Shopify CSV file or choose "Fast-Track Starter Catalog".');
        return;
      }
      if (shopifyImportMode === 'api' && (!shopifyDomain.trim() || !accessToken.trim())) {
        setErrorMessage('Please provide both your Shopify Domain and Admin API Access Token.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('Configuring store, currency & regional settings...');

    try {
      // 1. Create the store in React context and PostgreSQL backend
      await createStore({
        name: name.trim(),
        handle: cleanHandle,
        location: location,
        category: category,
        themeId: selectedThemeId,
        contactEmail: email.trim() || `owner@${cleanHandle}.com`,
        emptyCatalog: catalogType === 'empty' || isImporting
      });

      // 2. Import catalog if selected
      if (isImporting) {
        if (shopifyImportMode === 'csv' && csvFile) {
          setStatusMessage('Importing Shopify CSV products & media...');
          await apiClient.importShopifyCsv(csvFile, {
            storeId: newStoreId,
            mirrorImages
          });
        } else if (shopifyImportMode === 'api') {
          setStatusMessage('Connecting to Shopify Admin API & cloning catalog...');
          await apiClient.importShopifyApi({
            shopifyDomain: shopifyDomain.trim(),
            accessToken: accessToken.trim(),
            mirrorImages,
            importProducts: true,
            importCustomers: true,
            storeId: newStoreId
          });
        }
        await refreshStoreData();
      }

      // 3. Celebrate with confetti & close
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Store creation error:', err);
      setErrorMessage(err.message || 'Failed to create store. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008060] to-[#00a67e] text-white flex items-center justify-center shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">Create & Launch Your Store</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Setup your store name, regional currency, and domain in 30 seconds</p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Mouse Studio, Aura Living, Apex Sports"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060] font-medium"
            />
          </div>

          {/* Location & Region */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span>Store Location & Regional Market</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Auto-configures currency & tax</span>
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] appearance-none font-medium pr-10 cursor-pointer"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.flag} {loc.name} ({loc.currency} {loc.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            {/* Location preview banner */}
            <div className="mt-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-lg flex items-center justify-between text-[11px] text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-900">{selectedLocConfig.flag} {selectedLocConfig.currency} ({selectedLocConfig.symbol})</span>
                <span className="text-zinc-300">•</span>
                <span>Tax: {selectedLocConfig.tax}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedLocConfig.gateways.split(',')[0]} Enabled
              </span>
            </div>
          </div>

          {/* Store URL (Subdomain) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>Store Subdomain URL</span>
              </span>
              <button
                type="button"
                onClick={() => setIsHandleCustom(!isHandleCustom)}
                className="text-[11px] text-[#008060] hover:underline font-medium cursor-pointer"
              >
                {isHandleCustom ? 'Auto-generate' : 'Edit slug'}
              </button>
            </label>
            <div className="flex items-center rounded-xl border border-zinc-300 overflow-hidden bg-zinc-50 focus-within:ring-2 focus-within:ring-[#008060]">
              <span className="pl-3 pr-1 text-xs text-zinc-400 font-mono select-none">https://</span>
              <input
                type="text"
                value={handle}
                readOnly={!isHandleCustom}
                onChange={(e) => {
                  setIsHandleCustom(true);
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''));
                }}
                placeholder="store-name"
                className={`flex-1 py-2 text-xs font-mono text-zinc-900 focus:outline-none ${
                  isHandleCustom ? 'bg-white' : 'bg-transparent text-zinc-700'
                }`}
              />
              <span className="px-3 py-2 text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 border-l border-zinc-200 select-none">
                .istora.online
              </span>
            </div>
          </div>

          {/* Category & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Store Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] appearance-none font-medium pr-8 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Owner Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@mystore.com"
                className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>
          </div>

          {/* Catalog Setup Choice */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-zinc-800 mb-2">Initial Catalog Setup</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setCatalogType('starter'); setShowShopifyImport(false); }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  catalogType === 'starter'
                    ? 'border-[#008060] bg-emerald-50/40 ring-1 ring-[#008060]'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Starter Products</span>
                  </span>
                  {catalogType === 'starter' && <Check className="w-3.5 h-3.5 text-[#008060]" />}
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">Pre-loads 4 ready-to-sell demo items to test checkout</p>
              </button>

              <button
                type="button"
                onClick={() => { setCatalogType('empty'); setShowShopifyImport(false); }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  catalogType === 'empty'
                    ? 'border-[#008060] bg-emerald-50/40 ring-1 ring-[#008060]'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Empty Catalog</span>
                  </span>
                  {catalogType === 'empty' && <Check className="w-3.5 h-3.5 text-[#008060]" />}
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">Start with zero products and add items manually</p>
              </button>
            </div>

            {/* Optional Shopify Migration Drawer */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  const next = !showShopifyImport;
                  setShowShopifyImport(next);
                  if (next) setCatalogType('shopify');
                  else setCatalogType('starter');
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <span>Need to import an existing store from Shopify?</span>
                <span className="text-[#008060] font-semibold underline">
                  {showShopifyImport ? 'Hide import options' : 'Import CSV or Admin API'}
                </span>
              </button>

              {showShopifyImport && (
                <div className="mt-2.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShopifyImportMode('csv')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        shopifyImportMode === 'csv'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-white border border-zinc-200 text-zinc-600'
                      }`}
                    >
                      Shopify CSV File
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopifyImportMode('api')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        shopifyImportMode === 'api'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-white border border-zinc-200 text-zinc-600'
                      }`}
                    >
                      Shopify Admin API
                    </button>
                  </div>

                  {shopifyImportMode === 'csv' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 border border-dashed border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-xs text-zinc-700 flex items-center justify-center gap-2 cursor-pointer font-medium"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#008060]" />
                        <span>{csvFile ? csvFile.name : 'Choose Shopify products_export.csv'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="mystore.myshopify.com"
                        value={shopifyDomain}
                        onChange={(e) => setShopifyDomain(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Admin Access Token (shpat_...)"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3 px-4 bg-[#008060] hover:bg-[#006e52] disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{statusMessage || 'Creating store...'}</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  <span>Launch Store on {selectedLocConfig.currency}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
