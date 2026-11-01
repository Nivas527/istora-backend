/**
 * Advanced Promotion & Coupon Rules Calculation Engine
 * 
 * Supports:
 * 1. BOGO (Buy X, Get Y Free / Discounted)
 * 2. Cart Value Thresholds (e.g., Get ₹500 off on orders above ₹2,999)
 * 3. Auto-Applied Promotions (applies automatically without typing a code)
 * 4. Quantity Tier Pricing (e.g., Buy 2 Save 10%, Buy 3+ Save 15%)
 */

export const DEFAULT_VOLUME_TIERS = [
  { minQty: 1, discountPercent: 0, label: 'Single Unit', badge: 'Standard' },
  { minQty: 2, discountPercent: 10, label: 'Buy 2, Save 10%', badge: 'Popular' },
  { minQty: 3, discountPercent: 15, label: 'Buy 3+, Save 15%', badge: 'Best Value' }
];

/**
 * Calculates volume tier savings for a single product given quantity and base price
 */
export function getProductTierPricing(quantity, basePrice, customTiers = null) {
  const tiers = Array.isArray(customTiers) && customTiers.length > 0 ? customTiers : DEFAULT_VOLUME_TIERS;
  
  // Find highest tier matching quantity
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  const matchedTier = sorted.find(t => (quantity || 1) >= t.minQty) || tiers[0];
  
  const discountPercent = matchedTier?.discountPercent || 0;
  const unitDiscount = (basePrice * discountPercent) / 100;
  const effectiveUnitPrice = Math.max(0, basePrice - unitDiscount);
  const lineSubtotal = effectiveUnitPrice * quantity;
  const totalSavings = unitDiscount * quantity;

  return {
    matchedTier,
    discountPercent,
    effectiveUnitPrice,
    lineSubtotal,
    totalSavings,
    allTiers: tiers
  };
}

/**
 * Calculate volume tier savings across all cart line items
 */
export function calculateCartVolumeTiers(cartItems = []) {
  let totalVolumeSavings = 0;
  const enrichedItems = (cartItems || []).map(item => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    
    // Check if item has custom tier pricing or use default
    let tiers = DEFAULT_VOLUME_TIERS;
    if (item.tierPricingJson) {
      try {
        const parsed = JSON.parse(item.tierPricingJson);
        if (Array.isArray(parsed) && parsed.length > 0) tiers = parsed;
      } catch (e) {
        // use default
      }
    }
    
    const tierInfo = getProductTierPricing(qty, price, tiers);
    totalVolumeSavings += tierInfo.totalSavings;
    
    return {
      ...item,
      tierDiscountPercent: tierInfo.discountPercent,
      tierSavings: tierInfo.totalSavings,
      effectiveUnitPrice: tierInfo.effectiveUnitPrice,
      effectiveLineTotal: tierInfo.lineSubtotal
    };
  });

  return {
    enrichedItems,
    totalVolumeSavings: Math.round(totalVolumeSavings * 100) / 100
  };
}

/**
 * Evaluates BOGO rule on cart items
 */
export function calculateBogoDiscount(cartItems = [], discountRule) {
  if (!discountRule) return { eligible: false, freeUnitsCount: 0, savings: 0 };
  
  const buyQty = Number(discountRule.buyQuantity) || 2;
  const getQty = Number(discountRule.getQuantity) || 1;
  const discountPercent = typeof discountRule.getDiscountPercent === 'number' ? discountRule.getDiscountPercent : 100;
  const categoryFilter = discountRule.applicableCategory || 'all';

  // Filter eligible items
  const eligibleItems = (cartItems || []).filter(item => {
    if (categoryFilter === 'all') return true;
    const itemCat = (item.collectionId || item.category || item.productType || '').toLowerCase();
    return itemCat.includes(categoryFilter.toLowerCase());
  });

  // Expand to individual units sorted by price ascending (so lowest priced gets discounted)
  const individualUnits = [];
  eligibleItems.forEach(item => {
    const qty = item.quantity || 1;
    for (let i = 0; i < qty; i++) {
      individualUnits.push({
        price: item.price || 0,
        title: item.title,
        productId: item.productId
      });
    }
  });

  individualUnits.sort((a, b) => a.price - b.price);

  const groupSize = buyQty + getQty;
  const totalUnits = individualUnits.length;
  const freeUnitsCount = Math.floor(totalUnits / groupSize) * getQty;

  let savings = 0;
  if (freeUnitsCount > 0) {
    for (let i = 0; i < Math.min(freeUnitsCount, individualUnits.length); i++) {
      savings += (individualUnits[i].price * discountPercent) / 100;
    }
  }

  const itemsNeededForNext = totalUnits === 0 
    ? groupSize 
    : (groupSize - (totalUnits % groupSize));

  return {
    eligible: freeUnitsCount > 0,
    freeUnitsCount,
    savings: Math.round(savings * 100) / 100,
    buyQty,
    getQty,
    discountPercent,
    totalUnits,
    itemsNeededForNext: freeUnitsCount === 0 || (totalUnits % groupSize !== 0) ? itemsNeededForNext : 0,
    message: freeUnitsCount > 0 
      ? `Buy ${buyQty} Get ${getQty} Free Applied: ${freeUnitsCount} item${freeUnitsCount > 1 ? 's' : ''} discounted!`
      : `Add ${itemsNeededForNext} more qualifying item${itemsNeededForNext > 1 ? 's' : ''} to get ${getQty} Free!`
  };
}

/**
 * Finds the nearest Cart Value Threshold rule and calculates progress
 */
export function calculateThresholdProgress(cartSubtotal = 0, discounts = []) {
  const thresholdPromos = (discounts || [])
    .filter(d => (d.ruleType === 'threshold' || d.type === 'fixed') && d.minSubtotal > 0 && d.isActive !== false)
    .sort((a, b) => a.minSubtotal - b.minSubtotal);

  if (thresholdPromos.length === 0) {
    return null;
  }

  // Find the next upcoming threshold or highest unlocked
  const unlocked = thresholdPromos.filter(d => cartSubtotal >= d.minSubtotal);
  const nextUpcoming = thresholdPromos.find(d => cartSubtotal < d.minSubtotal);

  const activePromo = nextUpcoming || unlocked[unlocked.length - 1];
  if (!activePromo) return null;

  const targetSubtotal = activePromo.minSubtotal;
  const isUnlocked = cartSubtotal >= targetSubtotal;
  const amountNeeded = Math.max(0, targetSubtotal - cartSubtotal);
  const percentComplete = Math.min(100, Math.round((cartSubtotal / targetSubtotal) * 100));

  let rewardText = '';
  if (activePromo.type === 'percentage') {
    rewardText = `${activePromo.value}% OFF`;
  } else if (activePromo.type === 'shipping') {
    rewardText = 'FREE Shipping';
  } else {
    rewardText = `₹${activePromo.value} OFF`;
  }

  return {
    promo: activePromo,
    targetSubtotal,
    isUnlocked,
    amountNeeded: Math.round(amountNeeded * 100) / 100,
    percentComplete,
    rewardText,
    message: isUnlocked
      ? `🎉 Threshold Reached! ${activePromo.code || 'Promo'} applied (${rewardText})`
      : `Add ₹${amountNeeded.toLocaleString('en-IN')} more to unlock ${rewardText}!`
  };
}

/**
 * Master promotion engine evaluator:
 * Evaluates auto-applied discounts, manual coupon codes, BOGO, thresholds, and tier pricing.
 */
export function evaluateAllPromotions({
  cartItems = [],
  discounts = [],
  manualDiscountCode = null,
  freeShippingThreshold = 75
}) {
  // 1. Calculate Volume Tier savings
  const { enrichedItems, totalVolumeSavings } = calculateCartVolumeTiers(cartItems);
  
  // Base raw subtotal
  const rawSubtotal = (cartItems || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  
  // Active discounts
  const activeDiscounts = (discounts || []).filter(d => d.isActive !== false);

  // 2. Resolve Applied Promotion (Manual Code vs Auto-Applied Rules)
  let appliedDiscount = null;
  let isAutoApplied = false;
  let discountAmount = 0;
  let promoRuleType = 'percentage';
  let bogoDetails = null;

  // Case A: Customer typed a specific code
  if (manualDiscountCode && manualDiscountCode.trim()) {
    const cleanCode = manualDiscountCode.trim().toUpperCase();
    const matched = activeDiscounts.find(d => (d.code || '').toUpperCase() === cleanCode);
    
    if (matched) {
      appliedDiscount = matched;
      isAutoApplied = false;
    }
  }

  // Case B: If no manual code or manual code not found, check Auto-Applied promotions
  if (!appliedDiscount) {
    const autoPromos = activeDiscounts.filter(d => Boolean(d.isAutoApplied));
    
    // Evaluate each auto promotion and pick the one with highest financial benefit
    let bestAuto = null;
    let highestAutoSavings = 0;

    for (const auto of autoPromos) {
      if (auto.ruleType === 'bogo' || auto.type === 'bogo') {
        const bogo = calculateBogoDiscount(cartItems, auto);
        if (bogo.eligible && bogo.savings > highestAutoSavings) {
          highestAutoSavings = bogo.savings;
          bestAuto = { ...auto, _bogo: bogo };
        }
      } else if (auto.ruleType === 'threshold' || auto.minSubtotal > 0) {
        if (rawSubtotal >= auto.minSubtotal) {
          let savings = 0;
          if (auto.type === 'percentage') savings = (rawSubtotal * auto.value) / 100;
          else if (auto.type === 'fixed') savings = Math.min(auto.value, rawSubtotal);
          
          if (savings > highestAutoSavings) {
            highestAutoSavings = savings;
            bestAuto = auto;
          }
        }
      } else if (auto.ruleType === 'percentage' || auto.type === 'percentage') {
        const savings = (rawSubtotal * auto.value) / 100;
        if (savings > highestAutoSavings) {
          highestAutoSavings = savings;
          bestAuto = auto;
        }
      }
    }

    if (bestAuto) {
      appliedDiscount = bestAuto;
      isAutoApplied = true;
    }
  }

  // 3. Compute discount amount for the applied promotion
  if (appliedDiscount) {
    promoRuleType = appliedDiscount.ruleType || appliedDiscount.type || 'percentage';

    if (promoRuleType === 'bogo' || appliedDiscount.type === 'bogo') {
      bogoDetails = calculateBogoDiscount(cartItems, appliedDiscount);
      discountAmount = bogoDetails.savings;
    } else if (appliedDiscount.type === 'percentage' || promoRuleType === 'percentage') {
      if (rawSubtotal >= (appliedDiscount.minSubtotal || 0)) {
        discountAmount = (rawSubtotal * (appliedDiscount.value || 0)) / 100;
      }
    } else if (appliedDiscount.type === 'fixed' || promoRuleType === 'threshold' || promoRuleType === 'fixed') {
      if (rawSubtotal >= (appliedDiscount.minSubtotal || 0)) {
        discountAmount = Math.min(appliedDiscount.value || 0, rawSubtotal);
      }
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  // 4. Free shipping check
  const isFreeShipping =
    rawSubtotal >= (freeShippingThreshold || 75) ||
    (appliedDiscount && (appliedDiscount.type === 'shipping' || promoRuleType === 'shipping'));

  // 5. Threshold progress for Cart Drawer / Checkout Banner
  const thresholdProgress = calculateThresholdProgress(rawSubtotal, activeDiscounts);

  // 6. Available Quick-Apply Coupons (excluding already applied)
  const availablePromotions = activeDiscounts
    .filter(d => !d.isAutoApplied && d.code)
    .map(d => ({
      code: d.code,
      description: d.description,
      ruleType: d.ruleType || d.type,
      minSubtotal: d.minSubtotal || 0,
      isApplicable: rawSubtotal >= (d.minSubtotal || 0)
    }));

  return {
    rawSubtotal,
    cartItems: enrichedItems,
    appliedDiscount: appliedDiscount ? {
      ...appliedDiscount,
      isAutoApplied,
      ruleType: promoRuleType
    } : null,
    isAutoApplied,
    discountAmount,
    volumeTierSavings: totalVolumeSavings,
    totalSavings: Math.round((discountAmount + totalVolumeSavings) * 100) / 100,
    isFreeShipping,
    thresholdProgress,
    bogoDetails,
    availablePromotions
  };
}
