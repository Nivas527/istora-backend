import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Globe,
  ChevronDown,
  Check,
  RefreshCw,
  Zap,
  MapPin,
  X,
  ArrowRight
} from 'lucide-react';

export default function CurrencySwitcher({ isDark = false, compact = false }) {
  const {
    currentCurrency,
    activeCurrencyMeta,
    supportedCurrencies,
    setCurrency,
    rates,
    inverseRates,
    ratesSource,
    lastUpdated,
    isLoadingRates,
    refreshRates,
    detectedLocation,
    showGeoIpBanner,
    dismissGeoIpBanner,
    revertToInr
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
          isDark
            ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
            : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 hover:text-zinc-950'
        }`}
        title="Change store currency and region"
      >
        <span className="text-sm leading-none">{activeCurrencyMeta.flag}</span>
        <span className="font-bold">{activeCurrencyMeta.code}</span>
        <span className="font-mono text-zinc-400 text-[11px] hidden sm:inline">
          ({activeCurrencyMeta.symbol})
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 z-50 animate-fadeIn text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-zinc-900 dark:text-white">Currency & Region</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshRates();
              }}
              disabled={isLoadingRates}
              className="p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
              title="Refresh live exchange rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRates ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Dynamic Rates Status Banner */}
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl mb-2.5 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Dynamic Market Rates</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
              Live Active
            </span>
          </div>

          {/* Currencies List */}
          <div className="space-y-1">
            {supportedCurrencies.map((curr) => {
              const isSelected = curr.code === currentCurrency;
              const invRate = inverseRates[curr.code] || (rates[curr.code] > 0 ? (1 / rates[curr.code]).toFixed(2) : '1.00');

              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    setCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{curr.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{curr.code}</span>
                        <span className="text-zinc-400 font-mono text-[11px] font-normal">
                          • {curr.symbol}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {curr.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSelected ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : curr.code !== 'INR' ? (
                      <span className="text-[10px] font-mono text-zinc-400 block">
                        1 {curr.code} ≈ ₹{invRate}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-semibold block">
                        Base
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 text-center">
            {ratesSource} • Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Non-intrusive floating or top toast for Geo-IP Auto-Detection
 */
export function GeoIpDetectionBanner() {
  const {
    showGeoIpBanner,
    detectedLocation,
    currentCurrency,
    dismissGeoIpBanner,
    revertToInr
  } = useCurrency();

  if (!showGeoIpBanner || !detectedLocation) return null;

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white px-4 py-2 border-b border-zinc-700 text-xs shadow-md sticky top-0 z-50 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="text-base">{detectedLocation.flag}</span>
          <span className="text-zinc-200">
            Welcome from <strong>{detectedLocation.countryName}</strong>! We've automatically converted prices to <strong>{currentCurrency}</strong> based on live market exchange rates.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={revertToInr}
            className="text-[11px] text-zinc-300 hover:text-white underline cursor-pointer"
          >
            Keep INR (₹)
          </button>
          <button
            onClick={dismissGeoIpBanner}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shadow-xs"
          >
            Got it
          </button>
          <button
            onClick={dismissGeoIpBanner}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

