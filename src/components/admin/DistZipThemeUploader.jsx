import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { extractDistZip, createSampleDistZip } from '../../services/zipExtractor';
import {
  FileArchive,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  AlertCircle,
  FileCode,
  Loader2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DistZipThemeUploader({ onThemeCreated, onClose }) {
  const {
    activeStore,
    createDeployment,
    addCustomTheme,
    applyThemeToActiveStore,
    setActiveMode
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [applyImmediately, setApplyImmediately] = useState(true);
  const [successTheme, setSuccessTheme] = useState(null);

  const fileInputRef = useRef(null);

  const handleProcessZip = async (file) => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const extracted = await extractDistZip(file);
      const defaultName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = defaultName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      setExtractedData(extracted);
      setThemeName(`${cleanTitle} (dist.zip)`);
      setThemeDescription(
        `Production React application extracted from ${file.name}. Contains ${extracted.fileCount} bundled assets.`
      );
    } catch (err) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'Failed to extract dist.zip. Please ensure it is a valid zip archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessZip(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessZip(file);
  };

  const handleLoadDemoZip = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const demoBlob = await createSampleDistZip();
      const demoFile = new File([demoBlob], 'apex-react19-dist.zip', { type: 'application/zip' });
      await handleProcessZip(demoFile);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate demo dist.zip.');
      setIsProcessing(false);
    }
  };

  const handleLoadIstoraZip = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await fetch('/samples/istora-dist.zip');
      if (!res.ok) throw new Error('Could not fetch istora-dist.zip');
      const blob = await res.blob();
      const file = new File([blob], 'Website_Istora-dist.zip', { type: 'application/zip' });
      await handleProcessZip(file);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load Website_Istora dist.zip.');
      setIsProcessing(false);
    }
  };

  const handlePublishToMarketplace = async () => {
    if (!extractedData || !themeName.trim()) return;

    setIsProcessing(true);
    try {
      const depId = `dep_theme_${Date.now()}`;
      const themeId = `theme_dist_${Date.now()}`;

      // 1. Create deployment record so the edge runner and backend can serve it
      const newDeployment = {
        id: depId,
        name: themeName,
        project: activeStore?.subdomain || 'theme-app',
        subdomain: `${(activeStore?.subdomain || 'theme').split('.')[0]}-dist`,
        liveUrl: `/hosted/${depId}`,
        status: 'READY',
        environment: 'production',
        isDistZip: true,
        framework: 'React 19 (dist.zip)',
        bundleSizeKb: Math.round((extractedData.totalSizeBytes / 1024) * 10) / 10,
        buildDurationMs: 650,
        files: extractedData.files,
        createdAt: new Date().toISOString(),
        logs: [
          {
            timestamp: '00:00.010',
            level: 'info',
            message: `Extracted ${extractedData.fileCount} production assets from dist.zip`
          },
          {
            timestamp: '00:00.080',
            level: 'success',
            message: 'Marketplace theme package initialized and ready for deployment'
          }
        ]
      };

      await createDeployment(newDeployment);

      // 2. Create Theme Marketplace Package
      const newTheme = {
        id: themeId,
        name: themeName,
        developer: `${activeStore?.name || 'Merchant'} Custom Upload`,
        price: 0,
        priceFormatted: 'Free',
        rating: 5.0,
        reviewsCount: 1,
        badge: '📦 Custom dist.zip',
        category: 'Custom React Web App',
        description: themeDescription || 'Custom React application extracted from dist.zip archive.',
        previewImage:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        tags: ['Custom dist.zip', 'Vite / React', 'Edge Hosted', 'Zero-Config'],
        isCustomDistZip: true,
        deploymentId: depId,
        files: extractedData.files,
        styles: {
          accentColor: '#10b981',
          tagline: 'Custom React Storefront',
          heroBg: 'bg-zinc-950',
          badgeBg: 'bg-emerald-600'
        }
      };

      await addCustomTheme(newTheme);

      // 3. Optionally apply immediately to store
      if (applyImmediately) {
        applyThemeToActiveStore(themeId, newTheme);
      }

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setSuccessTheme(newTheme);
      if (onThemeCreated) onThemeCreated(newTheme);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to register theme in marketplace.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900">
                Upload Custom dist.zip Theme
              </h3>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                React & Vite Unpacker
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Extract any built web application zip file and turn it into a reusable Theme Marketplace design for your stores.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success View */}
      {successTheme ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-emerald-900">
              Theme Successfully Extracted & Published!
            </h4>
            <p className="text-xs text-emerald-700 mt-1 max-w-lg mx-auto">
              <strong>{successTheme.name}</strong> is now live in your Developer Theme Marketplace.
              {applyImmediately && (
                <span> It has been bound directly as the active design for <strong>{activeStore?.name}</strong>.</span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveMode('storefront')}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>View Live Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setExtractedData(null);
                setSuccessTheme(null);
                if (onClose) onClose();
              }}
              className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Upload Another Zip
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Dropzone */}
          {!extractedData && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-50/50'
                  : 'border-zinc-300 hover:border-purple-400 bg-zinc-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {isProcessing ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              <h4 className="text-sm font-bold text-zinc-900">
                {isProcessing ? 'Extracting Zip Archive...' : 'Drag & drop your dist.zip file here'}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Upload your Vite, Next.js static export, or React production build zip. We will extract all HTML, CSS, JS, and media assets.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Browse Files
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadDemoZip();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-all border border-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Try Demo dist.zip (1-Click)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadIstoraZip();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileArchive className="w-3.5 h-3.5 text-purple-600" />
                  <span>Load Website_Istora (dist.zip)</span>
                </button>
              </div>
            </div>
          )}

          {/* Extracted Details & Customization Form */}
          {extractedData && (
            <div className="space-y-5 animate-fadeIn">
              {/* Extraction summary bar */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    Successfully unpacked <strong>{extractedData.fileCount} files</strong> (
                    {(extractedData.totalSizeBytes / 1024).toFixed(1)} KB) with entry point <code className="bg-purple-100 px-1 py-0.5 rounded font-mono font-bold">index.html</code>.
                  </span>
                </div>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                >
                  Change Zip
                </button>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Theme / Marketplace Name *
                  </label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="e.g. Neo-Tokyo Cyberpunk Storefront"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Target Store
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${activeStore?.name} (${activeStore?.subdomain})`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Description & Marketplace Summary
                  </label>
                  <textarea
                    rows={2}
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    placeholder="Describe the aesthetic, key pages, or features of this custom design..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Asset manifest preview */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Extracted Files Manifest (Top Assets)
                </span>
                <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 text-xs">
                  {extractedData.manifest.slice(0, 10).map((m) => (
                    <div key={m.path} className="py-1.5 px-2 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-700 truncate">{m.path}</span>
                      <span className="text-zinc-400 shrink-0">{(m.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                  {extractedData.manifest.length > 10 && (
                    <div className="py-1 px-2 text-[10px] text-zinc-400 font-sans italic">
                      + {extractedData.manifest.length - 10} more assets bundled
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="applyThemeImmediately"
                  checked={applyImmediately}
                  onChange={(e) => setApplyImmediately(e.target.checked)}
                  className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="applyThemeImmediately" className="text-xs text-zinc-700 font-medium cursor-pointer">
                  Immediately switch <strong>{activeStore?.name}</strong> to use this extracted theme
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePublishToMarketplace}
                  disabled={isProcessing || !themeName.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Packaging & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract & Add to Theme Marketplace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
