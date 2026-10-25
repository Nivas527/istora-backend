import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { apiClient } from '../services/apiClient';
import {
  X,
  Sparkles,
  Store,
  Palette,
  CheckCircle2,
  Star,
  Check,
  FileSpreadsheet,
  Zap,
  Upload,
  Globe,
  Key,
  HelpCircle,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateStoreModal({ onClose }) {
  const { createStore, storeTemplates, themes, refreshStoreData } = useStore();

  // Basic Store Info
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [templateId, setTemplateId] = useState('apparel');
  const [selectedThemeId, setSelectedThemeId] = useState('theme_apex_velocity');
  const [email, setEmail] = useState('merchant@example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Catalog Source: 'shopify' | 'demo'
  const [catalogSource, setCatalogSource] = useState('shopify');

  // Shopify Import Options: 'csv' | 'api'
  const [importType, setImportType] = useState('csv');
  const [csvFile, setCsvFile] = useState(null);
  const [mirrorImages, setMirrorImages] = useState(true);
  const fileInputRef = useRef(null);

  // Shopify API Options
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [importCustomers, setImportCustomers] = useState(true);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setHandle(generated);
  };

  // CSV file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        setErrorMessage('');
        // Suggest store name if empty
        if (!name.trim()) {
          const guessed = file.name
            .replace(/\.csv$/i, '')
            .replace(/products_export/i, '')
            .replace(/products/i, '')
            .replace(/[-_]/g, ' ')
            .trim();
          if (guessed) handleNameChange(guessed);
        }
      } else {
        setErrorMessage('Please upload a valid Shopify .csv export file.');
      }
    }
  };

  const handleDomainChange = (val) => {
    setShopifyDomain(val);
    // Auto-fill Store Name & Handle if empty
    if (!name.trim() && val.trim()) {
      const clean = val
        .replace(/^https?:\/\//i, '')
        .replace(/\.myshopify\.com.*/i, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim();
      if (clean) handleNameChange(clean);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a store name.');
      return;
    }

    const cleanHandle = (handle.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const newStoreId = `store_${cleanHandle}`;
    const isImporting = catalogSource === 'shopify';

    if (isImporting) {
      if (importType === 'csv' && !csvFile) {
        setErrorMessage('Please choose a Shopify CSV file to import or switch to "Demo Catalog".');
        return;
      }
      if (importType === 'api' && (!shopifyDomain.trim() || !accessToken.trim())) {
        setErrorMessage('Please provide both your Shopify Domain and Admin API Access Token.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('Configuring store & database...');

    try {
      // 1. Create the store in StoreContext and PostgreSQL backend
      const createdStore = createStore({
        name: name.trim(),
        handle: cleanHandle,
        templateId,
        themeId: selectedThemeId,
        contactEmail: email.trim(),
        emptyCatalog: isImporting // Don't populate with demo items if importing real catalog
      });

      // 2. Execute Shopify migration if selected
      if (isImporting) {
        if (importType === 'csv') {
          setStatusMessage('Parsing Shopify CSV, extracting variants & mirroring media to Cloudflare R2...');
          await apiClient.importShopifyCsv(csvFile, {
            storeId: newStoreId,
            mirrorImages
          });
        } else if (importType === 'api') {
          setStatusMessage('Connecting to Shopify Admin API & cloning live products, variants & customers...');
          await apiClient.importShopifyApi({
            shopifyDomain: shopifyDomain.trim(),
            accessToken: accessToken.trim(),
            mirrorImages,
            importProducts: true,
            importCustomers,
            storeId: newStoreId
          });
        }

        // Reload data into React StoreContext
        setStatusMessage('Syncing catalog to your new store...');
        await refreshStoreData();
      }

      // 3. Celebrate with confetti & close
      try {
        confetti({
          particleCount: 130,
          spread: 75,
          origin: { y: 0.5 }
        });
      } catch (err) {}

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Store creation / import error:', err);
      setErrorMessage(err.message || 'Store created, but import encountered an issue.');
      setIsSubmitting(false);
    }
  };

  const currentChosenTheme = (themes || []).find((t) => t.id === selectedThemeId) || (themes && themes[0]) || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">Create & Launch a New Store</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Shopify Migrator Included
              </span>
            </div>
            <p className="text-xs text-zinc-500">Pick a design and import your Shopify catalog directly or start with demo items</p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="e.g. Luna Minimalist Jewelry, Mouse Athletics"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* Subdomain URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store URL (Subdomain)
            </label>
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden bg-zinc-50">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="store-name"
                className="flex-1 px-3 py-2 text-xs text-zinc-900 bg-white border-r border-zinc-200 focus:outline-none"
              />
              <span className="px-3 text-xs font-mono text-zinc-500 bg-zinc-100">
                .istora.online
              </span>
            </div>
          </div>

          {/* 🌟 CATALOG SOURCE: SHOPIFY IMPORT vs STARTER DEMO */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-zinc-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Catalog & Data Source</span>
              </label>
              <span className="text-[10px] font-semibold text-zinc-400">
                (You can also import later anytime in Admin)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCatalogSource('shopify')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  catalogSource === 'shopify'
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Import Existing Shopify Store</span>
                  </span>
                  {catalogSource === 'shopify' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Upload CSV export or clone live via 1-Click Admin API
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCatalogSource('demo')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  catalogSource === 'demo'
                    ? 'border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Start with Demo Catalog</span>
                  </span>
                  {catalogSource === 'demo' && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Pre-filled with starter products (Apparel, Footwear, etc.)
                </p>
              </button>
            </div>

            {/* SHOPIFY IMPORT DETAILS (When 'shopify' is chosen) */}
            {catalogSource === 'shopify' && (
              <div className="pt-2 border-t border-emerald-100 space-y-3 animate-in fade-in">
                {/* Method selector: CSV vs API */}
                <div className="flex items-center gap-2 bg-emerald-100/40 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setImportType('csv'); setErrorMessage(''); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      importType === 'csv'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shopify CSV File (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setImportType('api'); setErrorMessage(''); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      importType === 'api'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1-Click Live API Sync</span>
                  </button>
                </div>

                {/* CSV File Input */}
                {importType === 'csv' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        csvFile
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-zinc-300 hover:border-emerald-500 bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        {csvFile ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                      </div>
                      {csvFile ? (
                        <div className="text-xs font-bold text-emerald-950">
                          {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-zinc-800">
                            Click to select Shopify products_export.csv
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Supports multi-row variants, tags, categories, and images
                          </p>
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={mirrorImages}
                        onChange={(e) => setMirrorImages(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-zinc-300"
                      />
                      <span className="text-[11px] font-medium text-zinc-700">
                        Mirror all product images to Cloudflare R2 (<code className="text-[10px]">media.istora.online</code>)
                      </span>
                    </label>
                  </div>
                )}

                {/* API Input */}
                {importType === 'api' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                        Shopify Domain
                      </label>
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={shopifyDomain}
                          onChange={(e) => handleDomainChange(e.target.value)}
                          placeholder="e.g. yourstore.myshopify.com"
                          className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-zinc-700">
                          Admin API Access Token
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTokenHelp(!showTokenHelp)}
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Where to find this?</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Key className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    {showTokenHelp && (
                      <div className="p-3 bg-zinc-100 rounded-lg text-[10px] text-zinc-700 space-y-1">
                        <p className="font-bold">In Shopify Admin:</p>
                        <p>1. Go to <strong>Settings → Apps & sales channels → Develop apps</strong>.</p>
                        <p>2. Create App → configure <strong>read_products</strong> & <strong>read_customers</strong> scopes.</p>
                        <p>3. Install app and copy token starting with <code>shpat_</code>.</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mirrorImages}
                          onChange={(e) => setMirrorImages(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-zinc-300"
                        />
                        <span className="text-[11px] font-medium text-zinc-700">Mirror media to Cloudflare R2</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importCustomers}
                          onChange={(e) => setImportCustomers(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-zinc-300"
                        />
                        <span className="text-[11px] font-medium text-zinc-700">Import Customers</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DEMO TEMPLATE SELECTION (When 'demo' is chosen) */}
            {catalogSource === 'demo' && (
              <div className="pt-2 border-t border-zinc-200 animate-in fade-in">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1.5">
                  Pick Starter Template Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {storeTemplates.map((tmpl) => {
                    const isSelected = templateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setTemplateId(tmpl.id)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-100 font-bold'
                            : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                        }`}
                      >
                        <span className="text-xs block truncate">{tmpl.name}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{tmpl.category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Developer Theme Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Choose Website Design (Developer Themes)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span>Selected: {currentChosenTheme.name} ({currentChosenTheme.priceFormatted})</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto pr-1">
              {themes.map((thm) => {
                const isSelected = selectedThemeId === thm.id;
                return (
                  <div
                    key={thm.id}
                    onClick={() => setSelectedThemeId(thm.id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#008060] bg-emerald-50/50 ring-2 ring-[#008060]/30 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-100 mb-1.5">
                        <img src={thm.previewImage} alt="" className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 bg-zinc-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {thm.priceFormatted}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#008060]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <p className="font-bold text-xs text-zinc-900 truncate">{thm.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{thm.developer}</p>
                    </div>

                    <div className="mt-1 pt-1 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{thm.rating} ★</span>
                      <span className="font-semibold text-emerald-700">{thm.priceFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Owner Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourstore.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
            <div className="text-xs font-medium text-emerald-700">
              {statusMessage && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold shadow-md shadow-[#008060]/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Store Launch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{catalogSource === 'shopify' ? 'Launch & Import Store' : 'Launch My Store'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
