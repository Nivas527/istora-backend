import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { buildHostedHtmlBundle } from '../../services/hostingCompiler';
import {
  ExternalLink,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  ArrowLeft,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  Share2
} from 'lucide-react';

export default function HostedAppRunner({
  deployment,
  onBack,
  isStandalone = false,
  isStorefrontRunner = false
}) {
  const { products, settings, cart, addToCart } = useStore();
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [useInlinedFallback, setUseInlinedFallback] = useState(false);

  // Storefront bridge injected into sandbox
  const storefrontBridge = useMemo(() => {
    return {
      store: {
        name: settings.storeName,
        domain: settings.storeDomain,
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        contactEmail: settings.contactEmail
      },
      products: products || [],
      cart: {
        items: cart.items || [],
        count: (cart.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
        addItem: (prod, qty) => {
          addToCart(prod, null, qty || 1);
        }
      }
    };
  }, [settings, products, cart, addToCart]);

  // Generate self-contained HTML bundle
  const htmlContent = useMemo(() => {
    if (!deployment) return '';
    return buildHostedHtmlBundle(deployment, storefrontBridge);
  }, [deployment, storefrontBridge, refreshKey]);

  // Expose storefront bridge on window so hosted iframes can read window.parent.ShopifyStorefront immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.ShopifyStorefront = storefrontBridge;
    }
  }, [storefrontBridge]);

  const copyUrl = () => {
    const url = deployment?.liveUrl || window.location.origin;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-full';
    }
  };

  if (!deployment) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-zinc-400 mb-4">Deployment not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold"
        >
          Return to Console
        </button>
      </div>
    );
  }

  // Pure Storefront Runner: clean, full-height customer store experience
  if (isStorefrontRunner) {
    return (
      <div className="w-full min-h-[calc(100vh-45px)] bg-black flex flex-col">
        <iframe
          key={`${refreshKey}_${useInlinedFallback ? 'inline' : 'src'}`}
          src={deployment.isDistZip && !useInlinedFallback ? `/hosted/${deployment.id}` : undefined}
          srcDoc={!deployment.isDistZip || useInlinedFallback ? htmlContent : undefined}
          title={deployment.name}
          className="w-full flex-1 border-none min-h-[calc(100vh-45px)]"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
          onError={() => {
            console.warn('Hosted HTTP route failed, activating client-side inlined sandbox fallback.');
            setUseInlinedFallback(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top Vercel Preview Toolbar */}
      <header className="bg-black/90 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
              title="Return to Hosting Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
              <span className="text-xs">▲</span> {deployment.name}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {deployment.environment}
            </span>
            {deployment.isDistZip && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                📦 dist.zip
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-500">https://</span>
            <span className="text-zinc-200">{deployment.subdomain}</span>
            <button
              onClick={copyUrl}
              className="ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Viewport Switcher & Actions */}
        <div className="flex items-center space-x-2">
          {/* Responsive Viewport Buttons */}
          <div className="hidden sm:flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Reload Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={`/hosted/${deployment.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-sm transition-colors"
          >
            <span>Open Standalone</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Sandbox Frame Container */}
      <main className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden relative">
        <div className={`w-full ${getViewportWidth()} h-[calc(100vh-68px)] transition-all duration-300 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-black relative`}>
          <iframe
            key={`${refreshKey}_${useInlinedFallback ? 'inline' : 'src'}`}
            src={deployment.isDistZip && !useInlinedFallback ? `/hosted/${deployment.id}` : undefined}
            srcDoc={!deployment.isDistZip || useInlinedFallback ? htmlContent : undefined}
            title={deployment.name}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
            onError={() => {
              console.warn('Hosted HTTP route failed, activating client-side inlined sandbox fallback.');
              setUseInlinedFallback(true);
            }}
          />
        </div>
      </main>
    </div>
  );
}
