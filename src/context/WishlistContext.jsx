import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from './StoreContext';
import { useCustomerAuth } from './CustomerAuthContext';
import { apiClient } from '../services/apiClient';

const WISHLIST_STORAGE_KEY = 'istora_wishlist_v1';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { products, addToCart, setIsCartOpen } = useStore();
  const { customer, isAuthenticated } = useCustomerAuth();

  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('[Wishlist] Failed to write localStorage', e);
    }
  }, [wishlist]);

  // Sync with authenticated customer profile
  useEffect(() => {
    if (isAuthenticated && customer?.id) {
      apiClient.updateCustomerWishlist({
        wishlist,
        customerId: customer.id,
        email: customer.email,
        storeId: customer.storeId
      }).catch(() => null);
    }
  }, [wishlist, isAuthenticated, customer?.id]);

  // Helper to show transient notification toast
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Check if an item is wishlisted
  const isInWishlist = useCallback((productId, variantId = null) => {
    if (!productId) return false;
    return wishlist.some(item => {
      if (item.productId !== productId) return false;
      if (variantId && item.variantId && item.variantId !== variantId) return false;
      return true;
    });
  }, [wishlist]);

  // Add item to wishlist
  const addToWishlist = useCallback((product, variant = null) => {
    if (!product) return;
    const v = variant || (product.variants && product.variants[0]) || null;
    const variantId = v?.id || null;
    const variantTitle = v?.title || null;
    const currentPrice = v?.price ?? product.price ?? 0;
    const compareAtPrice = v?.compareAtPrice ?? product.compareAtPrice ?? null;
    const stockQty = v ? (v.inventoryQuantity ?? 10) : product.variants?.reduce((s, x) => s + (x.inventoryQuantity || 0), 0) || 10;
    const primaryImg = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

    setWishlist(prev => {
      const exists = prev.find(item => item.productId === product.id && (!variantId || item.variantId === variantId));
      if (exists) return prev;

      const newItem = {
        id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        variantId,
        variantTitle,
        title: product.title,
        price: currentPrice,
        priceWhenAdded: currentPrice,
        compareAtPrice,
        image: primaryImg,
        inStock: stockQty > 0,
        stockQuantity: stockQty,
        addedAt: new Date().toISOString(),
        notifyPriceDrop: true,
        notifyRestock: true
      };

      return [newItem, ...prev];
    });

    showToast(`Added "${product.title}" to Wishlist!`, 'success');
  }, [showToast]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback((productId, variantId = null) => {
    setWishlist(prev => prev.filter(item => {
      if (item.productId !== productId) return true;
      if (variantId && item.variantId && item.variantId !== variantId) return true;
      return false;
    }));
  }, []);

  // Toggle wishlist state
  const toggleWishlist = useCallback((product, variant = null) => {
    if (!product) return false;
    const v = variant || (product.variants && product.variants[0]) || null;
    const vId = v?.id || null;

    if (isInWishlist(product.id, vId)) {
      removeFromWishlist(product.id, vId);
      showToast(`Removed "${product.title}" from Wishlist.`, 'info');
      return false;
    } else {
      addToWishlist(product, v);
      return true;
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist, showToast]);

  // Move single item from wishlist to cart
  const moveToCart = useCallback((item) => {
    if (!item) return;
    const catalogProduct = products.find(p => p.id === item.productId);
    if (!catalogProduct) return;

    const catalogVariant = (catalogProduct.variants || []).find(v => v.id === item.variantId) || catalogProduct.variants?.[0];
    if (catalogVariant && catalogVariant.inventoryQuantity <= 0) {
      showToast(`"${item.title}" is currently sold out. Restock alert is active.`, 'error');
      return;
    }

    addToCart(catalogProduct, catalogVariant, 1);
    removeFromWishlist(item.productId, item.variantId);
    showToast(`Moved "${item.title}" to Cart!`, 'success');
  }, [products, addToCart, removeFromWishlist, showToast]);

  // Move all available items from wishlist to cart
  const moveAllToCart = useCallback(() => {
    let movedCount = 0;
    wishlist.forEach(item => {
      const catalogProduct = products.find(p => p.id === item.productId);
      if (!catalogProduct) return;
      const catalogVariant = (catalogProduct.variants || []).find(v => v.id === item.variantId) || catalogProduct.variants?.[0];
      if (catalogVariant && catalogVariant.inventoryQuantity > 0) {
        addToCart(catalogProduct, catalogVariant, 1);
        movedCount++;
      }
    });

    if (movedCount > 0) {
      setWishlist(prev => prev.filter(item => {
        const prod = products.find(p => p.id === item.productId);
        const v = prod?.variants?.find(vx => vx.id === item.variantId) || prod?.variants?.[0];
        return (v?.inventoryQuantity || 0) <= 0;
      }));
      showToast(`Moved ${movedCount} item(s) to Cart!`, 'success');
      setIsWishlistOpen(false);
      setIsCartOpen(true);
    } else {
      showToast('No wishlisted items currently in stock to move.', 'info');
    }
  }, [wishlist, products, addToCart, showToast, setIsCartOpen]);

  // Clear entire wishlist
  const clearWishlist = useCallback(() => {
    setWishlist([]);
    showToast('Wishlist cleared.', 'info');
  }, [showToast]);

  // Toggle alerts
  const togglePriceDropAlert = useCallback((id) => {
    setWishlist(prev => prev.map(item =>
      item.id === id ? { ...item, notifyPriceDrop: !item.notifyPriceDrop } : item
    ));
  }, []);

  const toggleRestockAlert = useCallback((id) => {
    setWishlist(prev => prev.map(item =>
      item.id === id ? { ...item, notifyRestock: !item.notifyRestock } : item
    ));
  }, []);

  // Dynamic price drop & stock restock detection based on current live catalog
  const enrichedWishlist = useMemo(() => {
    return wishlist.map(item => {
      const catalogProduct = products.find(p => p.id === item.productId);
      const catalogVariant = catalogProduct?.variants?.find(v => v.id === item.variantId) || catalogProduct?.variants?.[0];

      const currentLivePrice = catalogVariant ? catalogVariant.price : (catalogProduct?.price ?? item.price);
      const currentStock = catalogVariant ? (catalogVariant.inventoryQuantity || 0) : 0;
      const currentInStock = currentStock > 0;

      // Price drop detection: current price is lower than price when added
      const isPriceDropped = item.priceWhenAdded && currentLivePrice < item.priceWhenAdded;
      const priceDropSavings = isPriceDropped ? (item.priceWhenAdded - currentLivePrice) : 0;

      // Restock detection: was out of stock when added/previously recorded, now has inventory
      const isRestocked = (!item.inStock || item.stockQuantity === 0) && currentInStock;

      return {
        ...item,
        price: currentLivePrice,
        inStock: currentInStock,
        stockQuantity: currentStock,
        isPriceDropped,
        priceDropSavings,
        isRestocked
      };
    });
  }, [wishlist, products]);

  // Active alerts list for the banner
  const activeAlerts = useMemo(() => {
    const list = [];
    enrichedWishlist.forEach(item => {
      if (item.isPriceDropped && item.notifyPriceDrop) {
        list.push({
          id: `alert_price_${item.id}`,
          type: 'price_drop',
          item,
          message: `Price drop on "${item.title}": Saved $${item.priceDropSavings.toFixed(2)}! Now $${item.price.toFixed(2)}.`
        });
      }
      if (item.isRestocked && item.notifyRestock) {
        list.push({
          id: `alert_restock_${item.id}`,
          type: 'restock',
          item,
          message: `Back in Stock! "${item.title}" is now available (${item.stockQuantity} units left).`
        });
      }
    });
    return list;
  }, [enrichedWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist: enrichedWishlist,
        wishlistCount: wishlist.length,
        isWishlistOpen,
        openWishlistDrawer: () => setIsWishlistOpen(true),
        closeWishlistDrawer: () => setIsWishlistOpen(false),
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveToCart,
        moveAllToCart,
        clearWishlist,
        togglePriceDropAlert,
        toggleRestockAlert,
        activeAlerts,
        toastMessage
      }}
    >
      {children}

      {/* Floating Wishlist Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl text-xs font-semibold bg-zinc-900 text-white border border-zinc-700 animate-slideUp backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
