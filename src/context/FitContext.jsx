import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { getUrl } from '../services/apiClient';

function calculateClientFitFallback(productId, requestedSize, compareSizes, profile) {
  const sizes = compareSizes && compareSizes.length > 0 ? compareSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const garmentBaseChest = {
    'XS': 92,
    'S': 98,
    'M': 104,
    'L': 110,
    'XL': 116,
    'XXL': 122
  };
  const garmentBaseWaist = {
    'XS': 76,
    'S': 82,
    'M': 88,
    'L': 94,
    'XL': 100,
    'XXL': 106
  };

  const evaluations = sizes.map(size => {
    const sUpper = size.toUpperCase();
    const gChest = garmentBaseChest[sUpper] || (104 + (sizes.indexOf(size) - 2) * 6);
    const gWaist = garmentBaseWaist[sUpper] || (88 + (sizes.indexOf(size) - 2) * 6);
    const chestEase = Math.round((gChest - profile.chestCm) * 10) / 10;
    const waistEase = Math.round((gWaist - profile.waistCm) * 10) / 10;

    let overallStatus = 'optimal';
    let returnRiskPercent = 6;
    let overallFitScore = 95;

    if (chestEase < 0 || waistEase < 0) {
      overallStatus = 'tight';
      returnRiskPercent = 65;
      overallFitScore = 42;
    } else if (chestEase < 3 || waistEase < 3) {
      overallStatus = 'snug';
      returnRiskPercent = 25;
      overallFitScore = 78;
    } else if (chestEase > 14 || waistEase > 14) {
      overallStatus = 'oversized';
      returnRiskPercent = 32;
      overallFitScore = 72;
    } else if (chestEase > 8 || waistEase > 8) {
      overallStatus = 'relaxed';
      returnRiskPercent = 12;
      overallFitScore = 88;
    } else {
      overallStatus = 'optimal';
      returnRiskPercent = 6;
      overallFitScore = 96;
    }

    return {
      size,
      overallFitScore,
      returnRiskPercent,
      overallStatus,
      summaryText: overallStatus === 'optimal'
        ? `Size ${size} provides optimal comfort with +${chestEase}cm ease across your chest.`
        : overallStatus === 'snug'
        ? `Size ${size} gives a tailored, form-fitting silhouette with +${chestEase}cm ease.`
        : overallStatus === 'tight'
        ? `Size ${size} is tight across chest (${chestEase}cm ease). High return risk.`
        : `Size ${size} offers a roomy, relaxed drape (+${chestEase}cm ease).`,
      zones: [
        {
          zoneName: 'Chest / Bust',
          garmentMeasureCm: gChest,
          shopperBodyCm: profile.chestCm,
          easeCm: chestEase,
          tensionIndex: Math.max(0, 1 - (chestEase / 6)),
          status: chestEase < 0 ? 'tight' : chestEase < 3 ? 'snug' : chestEase > 10 ? 'relaxed' : 'optimal'
        },
        {
          zoneName: 'Waist',
          garmentMeasureCm: gWaist,
          shopperBodyCm: profile.waistCm,
          easeCm: waistEase,
          tensionIndex: Math.max(0, 1 - (waistEase / 6)),
          status: waistEase < 0 ? 'tight' : waistEase < 3 ? 'snug' : waistEase > 10 ? 'relaxed' : 'optimal'
        }
      ]
    };
  });

  const bestEval = [...evaluations].sort((a, b) => b.overallFitScore - a.overallFitScore)[0] || evaluations[0];

  return {
    productId,
    recommendedSize: bestEval?.size || 'M',
    recommendedScore: bestEval?.overallFitScore || 95,
    summary: bestEval?.summaryText || `Optimal match: Size ${bestEval?.size}`,
    sizeEvaluations: evaluations,
    usableStretchPercent: 0.05
  };
}

const SHOPPER_PROFILE_STORAGE_KEY = 'istora_shopper_profile';
const FIT_CONSENT_STORAGE_KEY = 'istora_fit_biometric_consent_v1';

const DEFAULT_PROFILE = {
  heightCm: 178,
  weightKg: 74,
  gender: 'unisex',
  chestCm: 99,
  waistCm: 83,
  lowHipCm: 100,
  acrossShoulderCm: 44.5,
  sleeveLengthCm: 62.5,
  thighGirthCm: 56,
  inseamCm: 79,
  scanConfidence: 0.95,
  captureMethod: 'two_photo_hmr',
  lastScannedAt: new Date().toISOString()
};

const DEFAULT_CONSENT = {
  hasConsented: false,
  agreedAt: null,
  purposeAgreed: false,
  autoDeleteAgreed: false,
  neverShareAgreed: false,
  storePrivatelyOnDevice: true
};

const FitContext = createContext(null);

export function FitProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(SHOPPER_PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.chestCm) return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [consent, setConsent] = useState(() => {
    try {
      const saved = localStorage.getItem(FIT_CONSENT_STORAGE_KEY);
      if (saved) return { ...DEFAULT_CONSENT, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CONSENT;
  });

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [cachedEvaluations, setCachedEvaluations] = useState({});

  useEffect(() => {
    try {
      // Only persist privately on device if user chose to do so
      if (consent.storePrivatelyOnDevice) {
        localStorage.setItem(SHOPPER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(SHOPPER_PROFILE_STORAGE_KEY);
        sessionStorage.setItem(SHOPPER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch {}
  }, [profile, consent.storePrivatelyOnDevice]);

  const updateConsent = useCallback((newConsent) => {
    setConsent((prev) => {
      const merged = { ...prev, ...newConsent };
      const hasConsented = Boolean(merged.purposeAgreed && merged.autoDeleteAgreed && merged.neverShareAgreed);
      const updated = {
        ...merged,
        hasConsented,
        agreedAt: hasConsented ? (prev.agreedAt || new Date().toISOString()) : null
      };
      try {
        localStorage.setItem(FIT_CONSENT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearFitData = useCallback(() => {
    try {
      localStorage.removeItem(SHOPPER_PROFILE_STORAGE_KEY);
      localStorage.removeItem(FIT_CONSENT_STORAGE_KEY);
      sessionStorage.removeItem(SHOPPER_PROFILE_STORAGE_KEY);
    } catch {}
    setProfile(DEFAULT_PROFILE);
    setConsent(DEFAULT_CONSENT);
    setCachedEvaluations({});
  }, []);

  const updateProfile = useCallback((newProfile) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile, lastScannedAt: new Date().toISOString() };
      return updated;
    });
    // Invalidate cached evaluations when body metrics change
    setCachedEvaluations({});
  }, []);

  const verifyProductFit = useCallback(async (productId, requestedSize = null, compareSizes = null, storeId = null) => {
    try {
      const cacheKey = `${productId}_${requestedSize || 'default'}_${JSON.stringify(compareSizes || [])}_${profile.chestCm}_${profile.waistCm}`;
      if (cachedEvaluations[cacheKey]) {
        return cachedEvaluations[cacheKey];
      }

      const res = await fetch(getUrl('/api/fit/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          storeId,
          requestedSize,
          compareSizes,
          shopperProfile: profile
        })
      });

      if (!res.ok) {
        throw new Error(`Fit verification failed with status ${res.status}`);
      }

      const data = await res.json();
      setCachedEvaluations((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (err) {
      console.warn('Fit verification API error, using client-side biometric model:', err);
      const fallback = calculateClientFitFallback(productId, requestedSize, compareSizes, profile);
      return fallback;
    }
  }, [profile, cachedEvaluations]);

  const checkAntiBracketing = useCallback(async (cartItems) => {
    if (!cartItems || cartItems.length < 2) return { hasBracketRisk: false, alerts: [] };
    try {
      const formattedItems = cartItems.map((item) => ({
        productId: item.productId || item.id,
        variantId: item.variantId || item.id,
        size: item.selectedSize || item.size || (item.variantTitle?.split('/')?.[0]?.trim()) || 'M',
        variantTitle: item.variantTitle || item.name || '',
        quantity: item.quantity || 1
      }));

      const res = await fetch(getUrl('/api/fit/anti-bracketing/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: formattedItems,
          shopperProfile: profile
        })
      });

      if (!res.ok) return { hasBracketRisk: false, alerts: [] };
      return await res.json();
    } catch (err) {
      console.warn('Anti-bracketing check error:', err);
      return { hasBracketRisk: false, alerts: [] };
    }
  }, [profile]);

  const parseTechPack = useCallback(async (rawText, fabricType = 'woven', usableStretchPercent = 0.02, intendedFit = 'regular') => {
    const res = await fetch(getUrl('/api/fit/tech-pack/parse'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        fabricType,
        usableStretchPercent,
        intendedFit
      })
    });
    if (!res.ok) {
      throw new Error('Tech pack parsing failed');
    }
    return await res.json();
  }, []);

  const saveProductGarmentSpec = useCallback(async (productId, garmentSpec) => {
    const res = await fetch(getUrl(`/api/fit/products/${productId}/garment-spec`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(garmentSpec)
    });
    if (!res.ok) {
      throw new Error('Failed to save garment specification');
    }
    return await res.json();
  }, []);

  const value = {
    profile,
    updateProfile,
    consent,
    updateConsent,
    clearFitData,
    isScanModalOpen,
    openScanModal: () => setIsScanModalOpen(true),
    closeScanModal: () => setIsScanModalOpen(false),
    verifyProductFit,
    checkAntiBracketing,
    parseTechPack,
    saveProductGarmentSpec
  };

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const ctx = useContext(FitContext);
  if (!ctx) {
    throw new Error('useFit must be used within a FitProvider');
  }
  return ctx;
}
