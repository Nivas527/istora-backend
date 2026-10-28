// apiClient.js - Centralized HTTP client connecting the React frontend to the ASP.NET Core (C#) Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Helper to build full endpoint URL (supports relative proxy or absolute URL)
 */
function getUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * Derives a deterministic Public Storefront Access Token for a store
 */
export function getPublicStorefrontToken(storeId) {
  if (!storeId) return 'shpat_pub_anonymous';
  const clean = storeId.replace(/^store_/, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `shpat_pub_${clean}_${hex}`;
}

/**
 * Derives a deterministic Private Merchant Admin Token for a store
 */
export function getPrivateMerchantToken(storeId) {
  if (!storeId) return 'shppa_sec_master';
  const clean = storeId.replace(/^store_/, '');
  let hash = 0x5f3759df;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) ^ clean.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `shppa_sec_${clean}_${hex}`;
}

/**
 * Injects X-Store-Id and dual authentication tokens:
 * - Public Storefront Token (for shoppers browsing catalog / checkout)
 * - Private Merchant Token (for admin operations)
 */
function getHeaders(custom = {}, explicitStoreId = null, isAdmin = false) {
  const headers = { ...custom };
  let storeId = explicitStoreId;
  if (!storeId && typeof window !== 'undefined') {
    const host = window.location.host;
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'admin' && parts[0] !== 'api') {
      storeId = parts[0].startsWith('store_') ? parts[0] : `store_${parts[0]}`;
    } else {
      storeId = localStorage.getItem('active_store_id') || 'store_apex';
    }
  }

  const normalizedStoreId = storeId ? (storeId.startsWith('store_') ? storeId : `store_${storeId}`) : 'store_apex';
  headers['X-Store-Id'] = normalizedStoreId;

  if (isAdmin) {
    let merchantToken = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(`istora_merchant_session_${normalizedStoreId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.token) merchantToken = parsed.token;
        }
      } catch {}
    }
    if (!merchantToken) {
      merchantToken = getPrivateMerchantToken(normalizedStoreId);
    }
    headers['X-Shopify-Access-Token'] = merchantToken;
    headers['Authorization'] = `Bearer ${merchantToken}`;
  } else {
    const pubToken = getPublicStorefrontToken(normalizedStoreId);
    headers['X-Shopify-Storefront-Access-Token'] = pubToken;
  }

  return headers;
}

export const apiClient = {
  baseUrl: API_BASE_URL,

  // ==========================================
  // 1. MULTI-TENANT STORES APIS
  // ==========================================
  async getStores() {
    try {
      const res = await fetch(getUrl('/api/stores'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getStores fallback:', err.message);
      return null;
    }
  },

  async getStoreById(id) {
    try {
      const res = await fetch(getUrl(`/api/stores/${id}`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getStoreById fallback:', err.message);
      return null;
    }
  },

  async createStore(storeData) {
    try {
      const res = await fetch(getUrl('/api/stores'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createStore fallback:', err.message);
      return storeData;
    }
  },

  async updateStore(id, storeData) {
    try {
      const res = await fetch(getUrl(`/api/stores/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] updateStore fallback:', err.message);
      return storeData;
    }
  },

  async deleteStore(id) {
    try {
      const res = await fetch(getUrl(`/api/stores/${id}`), {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] deleteStore fallback:', err.message);
      return { success: false };
    }
  },

  // ==========================================
  // 2. PRODUCTS APIS (Filtered by storeId)
  // ==========================================
  async getProducts(category = 'all', storeId = null) {
    try {
      const query = new URLSearchParams();
      if (category && category !== 'all') query.append('category', category);
      if (storeId) query.append('storeId', storeId);

      const qs = query.toString();
      const url = getUrl(qs ? `/api/products?${qs}` : '/api/products');
      const res = await fetch(url, { headers: getHeaders({}, storeId) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getProducts fallback:', err.message);
      return null;
    }
  },

  async createProduct(productData) {
    try {
      const storeId = productData?.storeId;
      const res = await fetch(getUrl('/api/products'), {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }, storeId),
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createProduct fallback:', err.message);
      return null;
    }
  },

  async updateProduct(id, productData) {
    try {
      const storeId = productData?.storeId;
      const res = await fetch(getUrl(`/api/products/${id}`), {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }, storeId),
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] updateProduct fallback:', err.message);
      return null;
    }
  },

  async deleteProduct(id, storeId = null) {
    try {
      const res = await fetch(getUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: getHeaders({}, storeId)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] deleteProduct fallback:', err.message);
      return { success: false };
    }
  },

  // ==========================================
  // 3. ORDERS & CHECKOUT APIS
  // ==========================================
  async getOrders(storeId = null) {
    try {
      const url = storeId ? getUrl(`/api/orders?storeId=${encodeURIComponent(storeId)}`) : getUrl('/api/orders');
      const res = await fetch(url, { headers: getHeaders({}, storeId) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getOrders fallback:', err.message);
      return null;
    }
  },

  async createOrder(orderData) {
    try {
      const storeId = orderData?.storeId;
      const res = await fetch(getUrl('/api/orders'), {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }, storeId),
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createOrder fallback:', err.message);
      return null;
    }
  },

  // ==========================================
  // 4. CATEGORIES, CUSTOMERS, DISCOUNTS & REVIEWS
  // ==========================================
  async getCategories(storeId = null) {
    try {
      const url = storeId ? getUrl(`/api/categories?storeId=${encodeURIComponent(storeId)}`) : getUrl('/api/categories');
      const res = await fetch(url, { headers: getHeaders({}, storeId) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.categories || [];
    } catch (err) {
      console.warn('[C# API] getCategories fallback:', err.message);
      return [];
    }
  },

  async createCategory(categoryData) {
    try {
      const storeId = categoryData?.storeId;
      const res = await fetch(getUrl('/api/categories'), {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }, storeId),
        body: JSON.stringify(categoryData)
      });
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createCategory fallback:', err.message);
      return categoryData;
    }
  },

  async getCustomers(storeId = null) {
    try {
      const url = storeId ? getUrl(`/api/customers?storeId=${encodeURIComponent(storeId)}`) : getUrl('/api/customers');
      const res = await fetch(url, { headers: getHeaders({}, storeId) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getCustomers fallback:', err.message);
      return [];
    }
  },

  async getDiscounts(storeId = null) {
    try {
      const url = storeId ? getUrl(`/api/discounts?storeId=${encodeURIComponent(storeId)}`) : getUrl('/api/discounts');
      const res = await fetch(url, { headers: getHeaders({}, storeId) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getDiscounts fallback:', err.message);
      return [];
    }
  },

  async createDiscount(discountData) {
    try {
      const storeId = discountData?.storeId;
      const res = await fetch(getUrl('/api/discounts'), {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }, storeId),
        body: JSON.stringify(discountData)
      });
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createDiscount fallback:', err.message);
      return discountData;
    }
  },

  async getReviews(storeId = null, productId = null) {
    try {
      const query = new URLSearchParams();
      if (storeId) query.append('storeId', storeId);
      if (productId) query.append('productId', productId);
      const url = getUrl(query.toString() ? `/api/reviews?${query.toString()}` : '/api/reviews');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getReviews fallback:', err.message);
      return [];
    }
  },

  async createReview(reviewData) {
    try {
      const res = await fetch(getUrl('/api/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      return await res.json();
    } catch (err) {
      console.warn('[C# API] createReview fallback:', err.message);
      return reviewData;
    }
  },

  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(getUrl('/api/upload'), {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] uploadImage fallback:', err.message);
      return null;
    }
  },

  // ==========================================
  // SHOPIFY MIGRATION & IMPORT (CSV & 1-CLICK API)
  // ==========================================
  async importShopifyCsv(file, { mirrorImages = true, storeId = null } = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mirrorImages', mirrorImages ? 'true' : 'false');
      if (storeId) formData.append('storeId', storeId);

      const headers = getHeaders({}, storeId);
      const res = await fetch(getUrl('/api/import/shopify-csv'), {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (data.errors && data.errors[0]) || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      console.error('[C# API] importShopifyCsv failed:', err);
      throw err;
    }
  },

  async importShopifyApi({ shopifyDomain, accessToken, mirrorImages = true, importProducts = true, importCustomers = true, storeId = null }) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/import/shopify-api'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shopifyDomain,
          accessToken,
          mirrorImages,
          importProducts,
          importCustomers,
          storeId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (data.errors && data.errors[0]) || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      console.error('[C# API] importShopifyApi failed:', err);
      throw err;
    }
  },

  // ==========================================
  // PAYMENT GATEWAYS (RAZORPAY & STRIPE & COD)
  // ==========================================
  async getPaymentConfig(storeId = null) {
    try {
      const headers = getHeaders({}, storeId);
      const url = storeId ? `/api/payments/config?storeId=${storeId}` : '/api/payments/config';
      const res = await fetch(getUrl(url), { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getPaymentConfig fallback:', err.message);
      return null;
    }
  },

  async createRazorpayOrder(orderData, storeId = null) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/payments/razorpay/create-order'), {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[C# API] createRazorpayOrder failed:', err);
      throw err;
    }
  },

  async verifyRazorpayPayment(verificationData, storeId = null) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/payments/razorpay/verify'), {
        method: 'POST',
        headers,
        body: JSON.stringify(verificationData)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      return await res.json();
    } catch (err) {
      console.error('[C# API] verifyRazorpayPayment failed:', err);
      throw err;
    }
  },

  async createStripeIntent(intentData, storeId = null) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/payments/stripe/create-payment-intent'), {
        method: 'POST',
        headers,
        body: JSON.stringify(intentData)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      return await res.json();
    } catch (err) {
      console.error('[C# API] createStripeIntent failed:', err);
      throw err;
    }
  },

  async verifyStripePayment(verificationData, storeId = null) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/payments/stripe/verify'), {
        method: 'POST',
        headers,
        body: JSON.stringify(verificationData)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      return await res.json();
    } catch (err) {
      console.error('[C# API] verifyStripePayment failed:', err);
      throw err;
    }
  },

  async confirmCodOrder(orderData, storeId = null) {
    try {
      const headers = getHeaders({ 'Content-Type': 'application/json' }, storeId);
      const res = await fetch(getUrl('/api/payments/cod/confirm'), {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      return await res.json();
    } catch (err) {
      console.error('[C# API] confirmCodOrder failed:', err);
      throw err;
    }
  },

  // ==========================================
  // 5. DEPLOYMENTS (Vercel React / dist.zip)
  // ==========================================
  async getDeployments() {
    try {
      const res = await fetch(getUrl('/api/deployments'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getDeployments fallback:', err.message);
      return null;
    }
  },

  async saveDeployment(deployment) {
    try {
      const res = await fetch(getUrl('/api/deployments/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployment)
      });
      return await res.json();
    } catch (err) {
      console.warn('[C# API] saveDeployment fallback:', err.message);
      return deployment;
    }
  },

  async getDeploymentById(id) {
    try {
      const res = await fetch(getUrl(`/api/deployments/${id}`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getDeploymentById fallback:', err.message);
      return null;
    }
  }
};
