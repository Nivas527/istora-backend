import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export const SUPPORTED_CURRENCIES = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    locale: 'en-IN',
    decimals: 0,
    country: 'India'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2,
    country: 'United States'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    locale: 'en-IE',
    decimals: 2,
    country: 'European Union'
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    locale: 'en-GB',
    decimals: 2,
    country: 'United Kingdom'
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    flag: '🇦🇪',
    locale: 'en-AE',
    decimals: 2,
    country: 'United Arab Emirates'
  }
];

const DEFAULT_RATES = {
  INR: 1.0,
  USD: 0.0105,
  EUR: 0.0094,
  GBP: 0.0079,
  AED: 0.0386
};

const DEFAULT_INVERSE = {
  INR: 1.0,
  USD: 95.08,
  EUR: 105.98,
  GBP: 127.15,
  AED: 25.89
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Check if shopper has manually set a preferred currency before
  const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('istora_selected_currency') : null;
  const hasUserChosen = typeof window !== 'undefined' ? localStorage.getItem('istora_user_explicit_currency') === 'true' : false;

  const [currentCurrency, setCurrentCurrency] = useState(savedCurrency || 'INR');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [inverseRates, setInverseRates] = useState(DEFAULT_INVERSE);
  const [ratesSource, setRatesSource] = useState('Live Market Rates');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Geo-IP Detection States
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [showGeoIpBanner, setShowGeoIpBanner] = useState(false);

  // Active currency object
  const activeCurrencyMeta = SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency) || SUPPORTED_CURRENCIES[0];

  // 1. Fetch Live Exchange Rates
  const fetchRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const data = await apiClient.getExchangeRates('INR');
      if (data && data.rates) {
        setRates(data.rates);
        if (data.inverseRates) setInverseRates(data.inverseRates);
        if (data.source) setRatesSource(data.source);
        if (data.lastUpdated) setLastUpdated(data.lastUpdated);
      }
    } catch (err) {
      console.warn('Failed to load exchange rates:', err);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  // 2. Geo-IP Location Auto-Detection
  const runGeoIpDetection = useCallback(async () => {
    // If the shopper has explicitly picked a currency, honor their manual choice
    if (hasUserChosen && savedCurrency) return;

    try {
      // Step A: Check server Geo-IP endpoint
      const geo = await apiClient.detectGeoIp();
      let detectedCode = geo?.currency;
      let countryName = geo?.countryName || 'your region';
      let flag = geo?.flag || '🌐';

      // Step B: Fallback to Cloudflare CDN trace in browser if backend is localhost
      if (!detectedCode || geo?.countryCode === 'IN') {
        try {
          const cfTrace = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
          if (cfTrace.ok) {
            const text = await cfTrace.text();
            const match = text.match(/loc=([A-Z]{2})/);
            if (match && match[1]) {
              const country = match[1];
              if (country === 'US' || country === 'CA' || country === 'AU' || country === 'SG') {
                detectedCode = 'USD';
                countryName = country === 'US' ? 'United States' : country;
                flag = country === 'US' ? '🇺🇸' : '🌐';
              } else if (country === 'GB') {
                detectedCode = 'GBP';
                countryName = 'United Kingdom';
                flag = '🇬🇧';
              } else if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE'].includes(country)) {
                detectedCode = 'EUR';
                countryName = 'Europe';
                flag = '🇪🇺';
              } else if (['AE', 'SA', 'QA', 'OM', 'KW'].includes(country)) {
                detectedCode = 'AED';
                countryName = 'United Arab Emirates';
                flag = '🇦🇪';
              }
            }
          }
        } catch (e) {
          // ignore trace fallback error
        }
      }

      // Step C: Fallback to timezone heuristics
      if (!detectedCode) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('America')) {
          detectedCode = 'USD';
          countryName = 'United States';
          flag = '🇺🇸';
        } else if (tz.includes('London') || tz.includes('Europe/Belfast')) {
          detectedCode = 'GBP';
          countryName = 'United Kingdom';
          flag = '🇬🇧';
        } else if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Rome') || tz.includes('Madrid')) {
          detectedCode = 'EUR';
          countryName = 'Europe';
          flag = '🇪🇺';
        } else if (tz.includes('Dubai')) {
          detectedCode = 'AED';
          countryName = 'United Arab Emirates';
          flag = '🇦🇪';
        }
      }

      if (detectedCode && detectedCode !== 'INR') {
        setCurrentCurrency(detectedCode);
        setDetectedLocation({ countryName, flag, currency: detectedCode });
        setShowGeoIpBanner(true);
        localStorage.setItem('istora_selected_currency', detectedCode);
      }
    } catch (err) {
      console.warn('Geo-IP detection fallback:', err);
    }
  }, [hasUserChosen, savedCurrency]);

  useEffect(() => {
    fetchRates();
    runGeoIpDetection();
  }, [fetchRates, runGeoIpDetection]);

  // Set currency manually (user choice)
  const setCurrency = (code) => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrentCurrency(found.code);
      localStorage.setItem('istora_selected_currency', found.code);
      localStorage.setItem('istora_user_explicit_currency', 'true');
      setShowGeoIpBanner(false);
    }
  };

  // Raw numeric price conversion from base (INR) to target currency
  const convertPrice = useCallback(
    (baseAmount, targetCurrency = currentCurrency) => {
      const num = Number(baseAmount) || 0;
      if (targetCurrency === 'INR') return num;
      const rate = rates[targetCurrency] || DEFAULT_RATES[targetCurrency] || 1;
      return num * rate;
    },
    [currentCurrency, rates]
  );

  // Unified string price formatter with currency symbol and localization
  const formatPrice = useCallback(
    (baseAmount, targetCurrency = currentCurrency, showCode = false) => {
      const num = Number(baseAmount) || 0;
      const meta = SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) || activeCurrencyMeta;

      if (meta.code === 'INR') {
        const formatted = Math.round(num).toLocaleString('en-IN');
        return `${meta.symbol}${formatted}${showCode ? ' INR' : ''}`;
      }

      const rate = rates[meta.code] || DEFAULT_RATES[meta.code] || 1;
      const converted = num * rate;

      // Formatting based on target currency
      const formattedNumber = converted.toLocaleString(meta.locale || 'en-US', {
        minimumFractionDigits: meta.decimals ?? 2,
        maximumFractionDigits: meta.decimals ?? 2
      });

      if (meta.code === 'AED') {
        return `AED ${formattedNumber}`;
      }

      return `${meta.symbol}${formattedNumber}${showCode ? ` ${meta.code}` : ''}`;
    },
    [currentCurrency, rates, activeCurrencyMeta]
  );

  // Formatter for values already converted in target currency
  const formatRawPrice = useCallback(
    (amountInTarget, targetCurrency = currentCurrency) => {
      const num = Number(amountInTarget) || 0;
      const meta = SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) || activeCurrencyMeta;

      if (meta.code === 'INR') {
        return `${meta.symbol}${Math.round(num).toLocaleString('en-IN')}`;
      }
      if (meta.code === 'AED') {
        return `AED ${num.toFixed(2)}`;
      }
      return `${meta.symbol}${num.toFixed(2)}`;
    },
    [currentCurrency, activeCurrencyMeta]
  );

  const dismissGeoIpBanner = () => {
    setShowGeoIpBanner(false);
    localStorage.setItem('istora_user_explicit_currency', 'true');
  };

  const revertToInr = () => {
    setCurrency('INR');
    setShowGeoIpBanner(false);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencySymbol: activeCurrencyMeta.symbol,
        activeCurrencyMeta,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        rates,
        inverseRates,
        ratesSource,
        lastUpdated,
        isLoadingRates,
        refreshRates: fetchRates,
        setCurrency,
        convertPrice,
        formatPrice,
        formatRawPrice,
        detectedLocation,
        showGeoIpBanner,
        dismissGeoIpBanner,
        revertToInr
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
