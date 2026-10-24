import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import DistZipThemeUploader from './admin/DistZipThemeUploader';
import {
  X,
  Palette,
  CheckCircle2,
  Sparkles,
  Star,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  FileArchive,
  UploadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ThemeMarketplaceModal({ onClose }) {
  const {
    themes,
    activeTheme,
    applyThemeToActiveStore,
    activeStore
  } = useStore();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'upload_zip'
  const [selectedThemeId, setSelectedThemeId] = useState(activeTheme?.id || 'theme_apex_velocity');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleApplyTheme = (theme) => {
    setIsApplying(true);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      }

      applyThemeToActiveStore(theme.id, theme);
      setIsApplying(false);
      setSuccessMessage(`Theme "${theme.name}" applied and bound to ${activeStore?.name || 'Store'}!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">Theme & Website Marketplace</h2>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Auto-API Binding
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Choose a pre-engineered design or upload a production <code className="font-mono bg-zinc-200 px-1 py-0.2 rounded">dist.zip</code> to serve custom React storefronts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Tab switchers */}
            <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-xl border border-zinc-300">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Browse ({themes.length})
              </button>
              <button
                onClick={() => setActiveTab('upload_zip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload_zip'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Upload dist.zip</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Upload dist.zip View */}
        {activeTab === 'upload_zip' ? (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            <DistZipThemeUploader
              onThemeCreated={(newTheme) => {
                setActiveTab('browse');
                setSelectedThemeId(newTheme.id);
              }}
            />
          </div>
        ) : (
          /* Tab 2: Themes Grid */
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto flex-1">
            {(themes || []).map((theme) => {
              const isCurrentlyActive = (activeTheme?.id || '') === theme.id;
              const isSelected = selectedThemeId === theme.id;
              const isCustom = theme.isCustomDistZip;

              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 cursor-pointer bg-white ${
                    isCurrentlyActive
                      ? 'border-[#008060] ring-2 ring-[#008060]/30 shadow-md'
                      : isSelected
                      ? isCustom
                        ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                        : 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-zinc-200 hover:border-zinc-300 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Theme Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                      <img
                        src={theme.previewImage}
                        alt={theme.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Price Tag Pill */}
                      <div className="absolute top-3 right-3 bg-zinc-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md">
                        {theme.priceFormatted}
                      </div>

                      {/* Custom dist.zip Badge */}
                      {isCustom ? (
                        <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <FileArchive className="w-3 h-3" />
                          <span>Custom dist.zip</span>
                        </div>
                      ) : theme.badge ? (
                        <div className="absolute top-3 left-3 bg-white/90 text-zinc-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {theme.badge}
                        </div>
                      ) : null}

                      {/* Active Checkmark */}
                      {isCurrentlyActive && (
                        <div className="absolute inset-0 bg-[#008060]/20 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-[#008060] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active on Your Store</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Theme Metadata */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate max-w-[140px]">By {theme.developer}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-semibold shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{theme.rating || 5.0}</span>
                          <span className="text-zinc-400">({theme.reviewsCount || 1})</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#008060] transition-colors">
                        {theme.name}
                      </h3>

                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {theme.description}
                      </p>

                      {/* Tag pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(theme.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              tag.includes('dist.zip')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 pt-2 border-t border-zinc-100">
                    {isCurrentlyActive ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 bg-zinc-100 text-zinc-400 text-xs font-bold rounded-lg cursor-not-allowed text-center"
                      >
                        Currently Active
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTheme(theme);
                        }}
                        disabled={isApplying}
                        className="w-full py-2.5 px-3 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {theme.price === 0
                            ? 'Use This Design'
                            : `Deploy (${theme.priceFormatted})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="p-4 bg-zinc-900 text-zinc-300 text-xs border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Code API Synchronization:</strong> Any chosen design or extracted <code className="text-purple-300 bg-zinc-800 px-1 py-0.2 rounded font-mono">dist.zip</code> binds directly to your live inventory and checkout endpoints.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Close Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
