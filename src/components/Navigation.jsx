import React from 'react';
import { useStore } from '../context/StoreContext';
import GlobalHeader from './common/GlobalHeader';
import StoreSelectorDropdown from './StoreSelectorDropdown';
import {
  ShoppingBag,
  Search,
  Plus,
  Sliders,
  Truck
} from 'lucide-react';

export default function Navigation({ onSearchClick, onTrackClick }) {
  const {
    activeTheme,
    settings,
    cartItemsCount,
    setIsCartOpen,
    setActiveMode,
    setIsCreateStoreModalOpen,
    isDedicatedStore
  } = useStore();

  const themeStyles = activeTheme?.styles || {};
  const isDark = themeStyles.isDark || false;

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all ${themeStyles.navBg || 'bg-white/95 border-[#e1e3e5] text-zinc-900'}`}>
      {/* Top Global Command Hub / Module Switcher */}
      <GlobalHeader currentSection="storefront" />

      {/* Main Storefront Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Multi-Tenant Store Selector */}
          <div className="flex items-center space-x-3">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveMode('storefront')}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all"
                style={{
                  background: `linear-gradient(135deg, ${themeStyles.accentColor || '#008060'}, #1e293b)`,
                  boxShadow: `0 4px 14px ${themeStyles.accentColor || '#008060'}33`
                }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.38 8.16a.75.75 0 0 0-.76-.08l-4.5 2.25V5.5a.75.75 0 0 0-.75-.75h-2.74a3 3 0 0 0-5.76 0H2a.75.75 0 0 0-.75.75v13.5c0 .41.34.75.75.75h16a.75.75 0 0 0 .75-.75V8.5a.75.75 0 0 0-.37-.66ZM8 3.5a1.5 1.5 0 0 1 1.5 1.25h-3A1.5 1.5 0 0 1 8 3.5ZM17.25 18H2.75V6.25h2.38a3.02 3.02 0 0 0 5.74 0h1.88v4.08l-3.37 1.69a.75.75 0 0 0-.38.67V14a.75.75 0 0 0 1.5 0v-.85l2.25-1.12v5.97Zm-4.5-5.36 4.5-2.25v6.86h-4.5V12.64Z"/>
                </svg>
              </div>
              <div>
                <span className={`font-extrabold text-lg sm:text-xl tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {settings.storeName}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 block">
                  {settings.storeDomain}
                </span>
              </div>
            </div>

            {/* Store Switcher Pill (hidden in live dedicated store mode) */}
            {!isDedicatedStore && (
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-zinc-200">
                <StoreSelectorDropdown />
                <button
                  onClick={() => setIsCreateStoreModalOpen(true)}
                  className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-[#008060] hover:text-[#006e52] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  title="Create a new shop tenant"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Create Store</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions (Search, Admin quick link, Cart Drawer button) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onSearchClick}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm border cursor-pointer ${
                isDark
                  ? 'text-zinc-200 hover:text-white hover:bg-zinc-800 border-zinc-700'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border-zinc-200/80'
              }`}
              title="Search catalog"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span className={`hidden md:inline text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Search catalog...</span>
              <kbd className={`hidden md:inline text-[10px] px-1.5 py-0.5 rounded border ${isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>⌘K</kbd>
            </button>

            {/* Track Order Button */}
            {onTrackClick && (
              <button
                onClick={onTrackClick}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}
                title="Track your order delivery"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Track Order</span>
              </button>
            )}

            {/* Direct Merchant Admin Shortcut (hidden in live dedicated store mode for clean customer experience) */}
            {!isDedicatedStore && (
              <button
                onClick={() => setActiveMode('admin')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                }`}
                title="Open Merchant Admin for this store"
              >
                <Sliders className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor || '#008060' }} />
                <span>Merchant Admin</span>
              </button>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{
                backgroundColor: themeStyles.accentColor || '#008060',
                color: isDark && themeStyles.accentColor === '#00dfd8' ? '#000' : '#fff'
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemsCount > 0 && (
                <span className="bg-black/40 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse-subtle">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
