import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Layers, Cpu, Palette } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function HeroBanner({ onExploreClick }) {
  const { activeTheme, settings, setIsThemeMarketplaceOpen } = useStore();
  const styles = activeTheme?.styles || {};

  return (
    <div
      className={`relative overflow-hidden ${styles.heroBg || 'bg-zinc-950'} text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8 my-6 border border-zinc-800 shadow-2xl transition-all duration-500`}
    >
      {/* Background ambient lighting styled with theme accent */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% -20%, ${styles.accentColor || '#008060'}, transparent 70%)`
        }}
      />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ backgroundColor: styles.accentColor || '#008060' }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-20 text-center flex flex-col items-center">
        {/* Theme & Architecture Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-xs font-medium mb-6 shadow-inner">
          <Palette className="w-3.5 h-3.5" style={{ color: styles.accentColor || '#008060' }} />
          <span className="text-zinc-200">
            Active Design: <strong className="text-white">{activeTheme.name}</strong>
          </span>
          <span className="text-zinc-500">•</span>
          <button
            onClick={() => setIsThemeMarketplaceOpen(true)}
            className="text-[11px] font-semibold underline underline-offset-2 hover:text-white cursor-pointer"
            style={{ color: styles.accentColor || '#5ce5b4' }}
          >
            Change Design
          </button>
        </div>

        {/* Hero Title */}
        <h1
          className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] ${styles.fontHeading || 'font-sans'}`}
        >
          {settings.storeName} —{' '}
          <span
            className="bg-clip-text text-transparent bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${styles.accentColor || '#008060'}, #38bdf8, #a855f7)`
            }}
          >
            {styles.tagline || 'Engineered Velocity'}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          {styles.heroSubtitle ||
            'Featuring Shopify-compatible Variant Matrix Combinatorics, sub-second optimistic cart state, automated inventory locking, and a high-density Polaris merchant control plane.'}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center items-center">
          <button
            onClick={onExploreClick}
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
            style={{ backgroundColor: styles.accentColor || '#008060' }}
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsThemeMarketplaceOpen(true)}
            className="flex items-center gap-1.5 px-4 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs border border-zinc-700 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Marketplace ({activeTheme?.priceFormatted || 'Free'})</span>
          </button>
        </div>

        {/* Core Specs Grid */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl text-left">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Design Template</p>
              <p className="text-xs font-semibold text-zinc-200">{activeTheme?.name || 'Apex Velocity'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">API Binding</p>
              <p className="text-xs font-semibold text-zinc-200">Auto Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Inventory Lock</p>
              <p className="text-xs font-semibold text-zinc-200">Atomic Decrement</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Developer</p>
              <p className="text-xs font-semibold text-zinc-200 truncate">{(activeTheme?.developer || 'Apex Labs').split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
