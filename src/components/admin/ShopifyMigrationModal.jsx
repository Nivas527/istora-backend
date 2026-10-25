import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../services/apiClient';
import {
  X,
  FileSpreadsheet,
  Zap,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Key,
  Layers,
  Users,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function ShopifyMigrationModal({ isOpen, onClose }) {
  const { activeStore, refreshStoreData } = useStore();
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'api'

  // Model 1: CSV Importer State
  const [csvFile, setCsvFile] = useState(null);
  const [csvMirrorImages, setCsvMirrorImages] = useState(true);
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Model 2: 1-Click API Migrator State
  const [apiDomain, setApiDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiMirrorImages, setApiMirrorImages] = useState(true);
  const [apiImportProducts, setApiImportProducts] = useState(true);
  const [apiImportCustomers, setApiImportCustomers] = useState(true);
  const [isApiSyncing, setIsApiSyncing] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  // Results & Errors State
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
    setCsvFile(null);
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // CSV Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        setError('');
      } else {
        setError('Please select a valid Shopify .csv export file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        setError('');
      } else {
        setError('Please select a valid Shopify .csv export file.');
      }
    }
  };

  // Submit CSV Import
  const handleCsvImport = async () => {
    if (!csvFile) {
      setError('Please choose a Shopify CSV file to import.');
      return;
    }

    setIsCsvUploading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiClient.importShopifyCsv(csvFile, {
        mirrorImages: csvMirrorImages,
        storeId: activeStore?.id
      });

      setResult(res);
      await refreshStoreData();
    } catch (err) {
      setError(err.message || 'CSV Import failed. Please check the file format.');
    } finally {
      setIsCsvUploading(false);
    }
  };

  // Submit 1-Click API Sync
  const handleApiImport = async (e) => {
    e.preventDefault();
    if (!apiDomain.trim()) {
      setError('Please enter your Shopify store domain (e.g. mystore.myshopify.com).');
      return;
    }
    if (!apiToken.trim()) {
      setError('Please provide your Shopify Admin API Access Token (shpat_...).');
      return;
    }

    setIsApiSyncing(true);
    setError('');
    setResult(null);

    try {
      const res = await apiClient.importShopifyApi({
        shopifyDomain: apiDomain.trim(),
        accessToken: apiToken.trim(),
        mirrorImages: apiMirrorImages,
        importProducts: apiImportProducts,
        importCustomers: apiImportCustomers,
        storeId: activeStore?.id
      });

      setResult(res);
      await refreshStoreData();
    } catch (err) {
      setError(err.message || 'Shopify API connection failed. Please verify credentials.');
    } finally {
      setIsApiSyncing(false);
    }
  };

  // Sample CSV generator for merchants
  const handleDownloadSampleCsv = () => {
    const sample = `Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Option2 Name,Option2 Value,Option3 Name,Option3 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Shopping / Google Product Category,Variant Image,Variant Weight Unit,Variant Tax Code,Cost per item,Status
apex-pro-runner,"Apex Velocity Pro Runner","<p>Engineered for maximum athletic endurance and ultra-lightweight cushioning.</p>","Apex Athletics","Apparel & Accessories > Shoes","Footwear","running,marathon,cushion",TRUE,"Size","9","Color","Obsidian Black","","","RUN-9-BLK",320,"shopify",45,"deny","manual","159.00","189.00",TRUE,TRUE,"","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000",1,"Apex Velocity Pro Runner Front",FALSE,"","","","","g","","85.00","active"
apex-pro-runner,"","","","","","","","Size","10","Color","Obsidian Black","","","RUN-10-BLK",330,"shopify",60,"deny","manual","159.00","189.00",TRUE,TRUE,"","https://images.unsplash.com/photo-1551107696-a4b085a6d9a0?w=1000",2,"Apex Velocity Angle View",FALSE,"","","","","g","","85.00","active"
apex-dryfit-tee,"Apex Core Training Tee","<p>Breathable aerodynamic performance knit tee with anti-odor silver threads.</p>","Apex Athletics","Apparel & Accessories > Clothing","Apparel","training,gym,dryfit",TRUE,"Size","Medium","Color","Deep Slate","","","TEE-M-SLT",160,"shopify",120,"deny","manual","48.00","58.00",TRUE,TRUE,"","https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000",1,"Apex Training Tee Front",FALSE,"","","","","g","","18.00","active"`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shopify_products_sample_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Import Data from Shopify</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Dual-Model
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Target Store: <span className="font-semibold text-zinc-800">{activeStore?.name || 'Active Store'}</span> ({activeStore?.id})
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!result && (
          <div className="flex border-b border-zinc-200 bg-white px-6 pt-3 gap-2">
            <button
              onClick={() => { setActiveTab('csv'); setError(''); }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'csv'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Model 1: Shopify CSV Export</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">Zero-Tech</span>
            </button>

            <button
              onClick={() => { setActiveTab('api'); setError(''); }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'api'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Model 2: 1-Click Live API Sync</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Auto-Clone</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-950">
                    Data Migration Completed Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Imported into <span className="font-semibold">{result.storeName}</span> ({result.storeId}).
                    All products, variants, and categories are now live in your Istora store catalog.
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <div className="text-xl font-black text-zinc-900">{result.productsImported}</div>
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3 text-zinc-400" /> Products
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <div className="text-xl font-black text-zinc-900">{result.variantsImported}</div>
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-zinc-400" /> Variants
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <div className="text-xl font-black text-emerald-700">{result.imagesMirrored}</div>
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                    <ImageIcon className="w-3 h-3 text-emerald-600" /> Cloudflare R2
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <div className="text-xl font-black text-zinc-900">{result.customersImported}</div>
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                    <Users className="w-3 h-3 text-zinc-400" /> Customers
                  </div>
                </div>
              </div>

              {/* Sample Product Titles */}
              {result.sampleProductTitles && result.sampleProductTitles.length > 0 && (
                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="text-[11px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Sample Imported Products
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.sampleProductTitles.map((title, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white border border-zinc-300 text-zinc-800 px-2 py-0.5 rounded-md font-medium shadow-2xs"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings if any */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Notes & Warnings:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {result.warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={resetState}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer"
                >
                  Import Another
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Done & View Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: CSV IMPORTER */}
          {!result && activeTab === 'csv' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">Upload Shopify Product or Customer CSV</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Export your products from Shopify (<strong>Products → Export → All products → CSV for Excel, Numbers, or other spreadsheet programs</strong>) and drop it here.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  csvFile
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-zinc-300 hover:border-emerald-500 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  csvFile ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {csvFile ? <FileSpreadsheet className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>

                {csvFile ? (
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-zinc-900">{csvFile.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {(csvFile.size / 1024).toFixed(1)} KB • Ready for migration
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-800">
                      Click to upload or drag & drop your Shopify CSV
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Standard Shopify products_export.csv (multi-row handles, variants, images)
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold text-zinc-900">Migration Options</div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csvMirrorImages}
                    onChange={(e) => setCsvMirrorImages(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-800">
                      Mirror and host images on Cloudflare R2 (media.istora.online)
                    </span>
                    <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                      Automatically downloads external Shopify CDN images and stores them permanently on your high-speed Cloudflare R2 bucket.
                    </p>
                  </div>
                </label>
              </div>

              {/* Sample link */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Sample Shopify CSV Template</span>
                </button>

                <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tenant isolated to {activeStore?.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 1-CLICK API SYNC */}
          {!result && activeTab === 'api' && (
            <form onSubmit={handleApiImport} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">Direct 1-Click Shopify Admin API Clone</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Connect your live Shopify store directly. We will automatically fetch and clone your products, variants, media, and customer directory in real time.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1">
                    Shopify Store URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={apiDomain}
                      onChange={(e) => setApiDomain(e.target.value)}
                      placeholder="e.g. yourbrand.myshopify.com"
                      className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-800">
                      Shopify Admin API Access Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTokenHelp(!showTokenHelp)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Where to find this?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Token Helper Accordion */}
                {showTokenHelp && (
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 space-y-2 animate-in fade-in">
                    <div className="font-bold text-zinc-900">How to get your Shopify Access Token in 60 seconds:</div>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-zinc-600">
                      <li>In Shopify Admin, go to <strong>Settings → Apps and sales channels → Develop apps</strong>.</li>
                      <li>Click <strong>Create an app</strong> (name it "Istora Migrator").</li>
                      <li>In <strong>Configuration</strong>, grant read access to <strong>Products</strong> (read_products) and <strong>Customers</strong> (read_customers).</li>
                      <li>Click <strong>Install app</strong> and reveal the <strong>Admin API access token</strong> (starts with <code className="bg-zinc-200 px-1 py-0.5 rounded text-[10px]">shpat_</code>).</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <div className="text-xs font-bold text-zinc-900">Sync Scope</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiImportProducts}
                      onChange={(e) => setApiImportProducts(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300"
                    />
                    <span className="text-xs font-medium text-zinc-800">Products & Variants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiImportCustomers}
                      onChange={(e) => setApiImportCustomers(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300"
                    />
                    <span className="text-xs font-medium text-zinc-800">Customer Directory</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={apiMirrorImages}
                      onChange={(e) => setApiMirrorImages(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300"
                    />
                    <span className="text-xs font-medium text-zinc-800">
                      Mirror all media assets to Cloudflare R2 (<code className="text-[10px] text-zinc-600">media.istora.online</code>)
                    </span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!result && (
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <button
              onClick={handleClose}
              disabled={isCsvUploading || isApiSyncing}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'csv' ? (
              <button
                onClick={handleCsvImport}
                disabled={!csvFile || isCsvUploading}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isCsvUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing & Mirroring to R2...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Shopify CSV</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApiImport}
                disabled={!apiDomain || !apiToken || isApiSyncing}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isApiSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting & Cloning Store...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Start 1-Click Live Sync</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
