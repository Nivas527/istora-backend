import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import DistZipThemeUploader from './DistZipThemeUploader';
import HostedAppRunner from '../hosting/HostedAppRunner';
import {
  Palette,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Star,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileArchive,
  UploadCloud,
  Eye,
  Plus
} from 'lucide-react';

export default function ThemesView() {
  const {
    themes,
    activeTheme,
    applyThemeToActiveStore,
    setIsThemeMarketplaceOpen,
    setActiveMode,
    settings,
    deployments
  } = useStore();

  const [showZipUploader, setShowZipUploader] = useState(false);
  const [previewDeployment, setPreviewDeployment] = useState(null);

  // If user opened full app preview for a custom dist.zip theme
  if (previewDeployment) {
    return (
      <HostedAppRunner
        deployment={previewDeployment}
        onBack={() => setPreviewDeployment(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Theme Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-zinc-900">Current Active Theme</h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              This design is currently bound to your store's live catalog and checkout APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowZipUploader(!showZipUploader)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{showZipUploader ? 'Close dist.zip Uploader' : 'Upload dist.zip Theme'}</span>
            </button>

            <button
              onClick={() => setIsThemeMarketplaceOpen(true)}
              className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Browse Theme Store</span>
            </button>
          </div>
        </div>

        {/* Collapsible dist.zip Uploader Section */}
        {showZipUploader && (
          <div className="mb-6 animate-fadeIn">
            <DistZipThemeUploader
              onClose={() => setShowZipUploader(false)}
              onThemeCreated={(newTheme) => {
                setShowZipUploader(false);
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Screenshot */}
          <div className="md:col-span-5 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-video relative group shadow-inner">
            <img
              src={activeTheme?.previewImage}
              alt={activeTheme?.name || 'Theme'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => setActiveMode('storefront')}
                className="px-4 py-2 bg-white text-zinc-900 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Preview Live Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Details & Status */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Live & Serving Customers
              </span>
              {activeTheme?.isCustomDistZip && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1">
                  <FileArchive className="w-3 h-3" />
                  Custom dist.zip App
                </span>
              )}
              <span className="text-xs text-zinc-400">By {activeTheme?.developer || 'Studio'}</span>
            </div>

            <h2 className="text-2xl font-black text-zinc-900">{activeTheme?.name || 'Active Theme'}</h2>
            <p className="text-xs text-zinc-600 leading-relaxed">{activeTheme?.description || ''}</p>

            {/* Architecture note */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <p className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#008060]" />
                Storefront API Synchronization
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                Store ID: {settings?.storeDomain || 'store'} • Accent: {activeTheme?.styles?.accentColor || '#008060'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveMode('storefront')}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View Online Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {activeTheme?.isCustomDistZip && activeTheme?.deploymentId && (
                <button
                  onClick={() => {
                    const dep = (deployments || []).find((d) => d.id === activeTheme.deploymentId) || {
                      id: activeTheme.deploymentId,
                      name: activeTheme.name,
                      files: activeTheme.files || {}
                    };
                    setPreviewDeployment(dep);
                  }}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview React Sandbox</span>
                </button>
              )}

              <button
                onClick={() => setIsThemeMarketplaceOpen(true)}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Switch Design
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Library (Available designs to switch in 1-click) */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Developer Design Library</h3>
            <p className="text-xs text-zinc-500">
              Pick any standard theme or custom extracted dist.zip package to reconnect your store.
            </p>
          </div>
          <button
            onClick={() => setShowZipUploader(true)}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add dist.zip Theme</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(themes || []).map((theme) => {
            const isCurrent = (activeTheme?.id || '') === theme.id;
            const isCustom = theme.isCustomDistZip;

            return (
              <div
                key={theme.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-[#008060] bg-emerald-50/20 ring-2 ring-[#008060]/20 shadow-sm'
                    : isCustom
                    ? 'border-purple-200 bg-purple-50/10 hover:border-purple-300 hover:shadow-md'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-100 mb-2.5 relative">
                    <img src={theme.previewImage} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 right-1.5 bg-zinc-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {theme.priceFormatted}
                    </span>
                    {isCustom && (
                      <span className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <FileArchive className="w-2.5 h-2.5" />
                        dist.zip
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-zinc-900 truncate">{theme.name}</p>
                  <p className="text-[10px] text-zinc-400 truncate">By {theme.developer}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{theme.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-1.5">
                  {isCustom && theme.deploymentId && (
                    <button
                      onClick={() => {
                        const dep = (deployments || []).find((d) => d.id === theme.deploymentId) || {
                          id: theme.deploymentId,
                          name: theme.name,
                          files: theme.files || {}
                        };
                        setPreviewDeployment(dep);
                      }}
                      className="w-full py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-purple-600" />
                      <span>Preview dist.zip App</span>
                    </button>
                  )}

                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Current Active Theme</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => applyThemeToActiveStore(theme.id, theme)}
                      className="w-full py-1.5 bg-zinc-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {theme.price === 0 ? 'Switch to This Theme' : `Deploy (${theme.priceFormatted})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
