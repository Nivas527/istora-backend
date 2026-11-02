import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useFit } from '../context/FitContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useWishlist } from '../context/WishlistContext';
import GlobalHeader from './common/GlobalHeader';
import StoreSelectorDropdown from './StoreSelectorDropdown';
import CurrencySwitcher from './storefront/CurrencySwitcher';
import {
  ShoppingBag,
  Search,
  Plus,
  Sliders,
  Truck,
  Sparkles,
  User,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
  Heart
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
  const { profile, openScanModal } = useFit();
  const {
    customer,
    isAuthenticated,
    openAuthModal,
    openPortal,
    logout,
    customerOrders
  } = useCustomerAuth();
  const { wishlistCount, openWishlistDrawer } = useWishlist();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

            {/* Shopper Body Fit Scan Indicator Button */}
            <button
              onClick={openScanModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/80 ring-1 ring-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20'
              }`}
              title="Calibrate your body measurements for zero-return fit verification"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-bold">✨ Fit Check:</span>
              <span className="font-mono font-bold">{profile.chestCm}cm / {profile.waistCm}cm</span>
            </button>

            {/* Customer Account & Shopper Portal Trigger */}
            <div className="relative" ref={accountMenuRef}>
              {isAuthenticated && customer ? (
                <div>
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                      isDark
                        ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-100 border-zinc-700'
                        : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
                    }`}
                    title="Shopper Account Menu"
                  >
                    {customer.avatar ? (
                      <img
                        src={customer.avatar}
                        alt={customer.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500/40"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {customer.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                    )}
                    <span className="hidden lg:inline max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 text-xs animate-fade-in">
                      {/* Customer Info Header */}
                      <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {customer.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openPortal('orders');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-emerald-500" />
                          <span>My Orders</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                          {customerOrders.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openPortal('addresses');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>Saved Addresses</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openWishlistDrawer();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-red-500" />
                          <span>Saved for Later</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                          {wishlistCount}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openPortal('fit');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>My Fit Profile</span>
                      </button>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 hover:text-zinc-950'
                  }`}
                  title="Sign In to Shopper Portal"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Multi-Currency & Geo-IP Switcher */}
            <CurrencySwitcher isDark={isDark} />

            {/* Wishlist / Saved for Later Trigger Button */}
            <button
              onClick={openWishlistDrawer}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
              }`}
              title="Saved for Later & Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : 'text-zinc-500'}`} />
              <span className="hidden md:inline">Saved</span>
              {wishlistCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {wishlistCount}
                </span>
              )}
            </button>

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
