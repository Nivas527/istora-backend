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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getProducts fallback:', err.message);
      return null;
    }
  },

  async createProduct(productData) {
    try {
      const res = await fetch(getUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(getUrl(`/api/products/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] updateProduct fallback:', err.message);
      return null;
    }
  },

  async deleteProduct(id) {
    try {
      const res = await fetch(getUrl(`/api/products/${id}`), {
        method: 'DELETE'
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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getOrders fallback:', err.message);
      return null;
    }
  },

  async createOrder(orderData) {
    try {
      const res = await fetch(getUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(url);
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
      const res = await fetch(getUrl('/api/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(url);
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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[C# API] getDiscounts fallback:', err.message);
      return [];
    }
  },

  async createDiscount(discountData) {
    try {
      const res = await fetch(getUrl('/api/discounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
