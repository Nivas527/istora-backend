import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SHOPPER_PROFILE_STORAGE_KEY = 'istora_shopper_profile';

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

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [cachedEvaluations, setCachedEvaluations] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(SHOPPER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

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

      const res = await fetch('/api/fit/verify', {
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
        throw new Error('Fit verification failed');
      }

      const data = await res.json();
      setCachedEvaluations((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (err) {
      console.warn('Fit verification API error:', err);
      return null;
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

      const res = await fetch('/api/fit/anti-bracketing/check', {
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
    const res = await fetch('/api/fit/tech-pack/parse', {
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
    const res = await fetch(`/api/fit/products/${productId}/garment-spec`, {
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
