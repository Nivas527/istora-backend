import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialStores, storeTemplates, initialCollections, initialApexProducts, initialApexOrders, initialApexCustomers, initialApexDiscounts } from '../data/seedData';
import { initialThemes } from '../data/themesData';
import { initialDeployments } from '../data/initialDeployments';
import { apiClient, getPublicStorefrontToken, getPrivateMerchantToken } from '../services/apiClient';
import { saveItemToDB, getAllFromDB, THEMES_STORE, DEPLOYMENTS_STORE } from '../services/dbStorage';

const StoreContext = createContext(null);

const STORAGE_KEY = 'shopify_multi_tenancy_stores_v3';
const ACTIVE_STORE_KEY = 'shopify_active_store_id_v3';
const DEPLOYMENTS_STORAGE_KEY = 'shopify_hosted_deployments_v1';
const THEMES_STORAGE_KEY = 'shopify_custom_themes_v1';

// Resolves whether the current browser URL targets a dedicated single store (e.g. apex.istora.online, ?store=apex, or /s/apex)
function resolveDedicatedStore(storeList) {
  if (typeof window === 'undefined') return { storeId: null, isDedicated: false, initialMode: 'storefront' };

  try {
    const params = new URLSearchParams(window.location.search);
    const host = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    const modeParam = params.get('mode');
    const queryStore = params.get('store');

    // Helper to find store by identifier (id, slug, name, subdomain, customDomain)
    const findStore = (term) => {
      if (!term) return null;
      const clean = term.trim().toLowerCase();
      return storeList.find(s =>
        s.id.toLowerCase() === clean ||
        s.id.toLowerCase().replace(/^store_/, '') === clean ||
        s.name.toLowerCase().includes(clean) ||
        (s.subdomain && s.subdomain.toLowerCase().includes(clean)) ||
        (s.customDomain && s.customDomain.toLowerCase().includes(clean))
      );
    };

    // 1. Explicit Launchpad / Hub request
    if (pathname === '/launchpad' || pathname === '/hub' || modeParam === 'hub') {
      return { storeId: null, isDedicated: false, initialMode: 'hub' };
    }

    // 2. Master Admin platform request:
    // - Subdomain: admin.istora.online
    // - Path: /master or /master-admin
    // - Explicit ?mode=master
    if (host.startsWith('admin.') || pathname === '/master' || pathname === '/master-admin' || modeParam === 'master') {
      return { storeId: null, isDedicated: false, initialMode: 'master' };
    }

    // 3. Subdomain extraction (e.g. apex.istora.online, aura.istora.online, apex.localhost)
    const hostParts = host.split('.');
    let subdomain = null;
    if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'admin' && hostParts[0] !== 'api') {
      subdomain = hostParts[0];
    } else if (host.includes('.localhost')) {
      subdomain = host.split('.')[0];
    }

    // If a store subdomain is present (e.g. apex.istora.online, mouse.istora.online)
    if (subdomain) {
      const match = findStore(subdomain);
      const targetStoreId = match ? match.id : (subdomain.startsWith('store_') ? subdomain : `store_${subdomain}`);
      const isAdmin = pathname.startsWith('/admin') || modeParam === 'admin';
      return {
        storeId: targetStoreId,
        isDedicated: true,
        initialMode: isAdmin ? 'admin' : 'storefront'
      };
    }

    // 4. Query param (?store=apex)
    if (queryStore) {
      const match = findStore(queryStore);
      if (match) {
        const isAdmin = pathname.startsWith('/admin') || modeParam === 'admin' || params.get('admin') === 'true';
        return {
          storeId: match.id,
          isDedicated: true,
          initialMode: isAdmin ? 'admin' : 'storefront'
        };
      }
    }

    // 5. Path pattern routing on root domain:
    // Storefront: /s/:slug or /store/:slug
    const storePathMatch = pathname.match(/^\/(?:s|store)\/([a-zA-Z0-9_-]+)/);
    if (storePathMatch) {
      const match = findStore(storePathMatch[1]);
      if (match) {
        return {
          storeId: match.id,
          isDedicated: true,
          initialMode: 'storefront'
        };
      }
    }

    // Store Admin: /admin/:slug (e.g. /admin/apex or /admin/aura)
    const adminStorePathMatch = pathname.match(/^\/admin\/([a-zA-Z0-9_-]+)/);
    if (adminStorePathMatch) {
      const match = findStore(adminStorePathMatch[1]);
      if (match) {
        return {
          storeId: match.id,
          isDedicated: true,
          initialMode: 'admin'
        };
      }
    }

    // Generic /admin on apex domain -> Master Admin
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return { storeId: null, isDedicated: false, initialMode: 'master' };
    }

    // 6. Custom Domain exact match (e.g. apexstore.fashion.com)
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const match = storeList.find(s => s.customDomain && s.customDomain.toLowerCase() === host);
      if (match) {
        const isAdmin = pathname.startsWith('/admin') || modeParam === 'admin';
        return {
          storeId: match.id,
          isDedicated: true,
          initialMode: isAdmin ? 'admin' : 'storefront'
        };
      }
    }

  } catch (e) {
    console.warn('Dedicated store detection error:', e);
  }

  // Root domain (https://istora.online) defaults directly to Storefront
  return { storeId: storeList[0]?.id || 'store_apex', isDedicated: false, initialMode: 'storefront' };
}

export function StoreProvider({ children }) {
  // 1. Multi-tenant stores array with schema validation and self-healing defaults
  const [stores, setStores] = useState(() => {
    try {
      const initResolution = resolveDedicatedStore(initialStores);
      const isDed = initResolution.isDedicated && initResolution.storeId;
      const targetId = isDed ? initResolution.storeId : null;

      const saved = isDed
        ? (localStorage.getItem(`${STORAGE_KEY}_${targetId}`) || localStorage.getItem(STORAGE_KEY))
        : localStorage.getItem(STORAGE_KEY);

      let list = initialStores;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }

      if (isDed && targetId) {
        const matched = list.find((s) => s.id === targetId || s.slug === targetId || s.id === `store_${targetId}`);
        if (matched) {
          list = [matched];
        } else {
          // Dedicated domain for a store not yet in storage, create initial scaffold until backend sync
          const cleanSlug = targetId.replace('store_', '');
          list = [{
            id: targetId,
            name: cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1) + ' Store',
            subdomain: `${cleanSlug}.istora.online`,
            customDomain: `${cleanSlug}.istora.online`,
            slug: cleanSlug,
            category: 'Retail',
            accentColor: '#008060',
            themeId: 'theme_apex_velocity',
            currency: 'USD',
            currencySymbol: '$',
            status: 'active',
            taxRate: 0.08,
            freeShippingThreshold: 75.00,
            standardShippingRate: 6.99,
            expressShippingRate: 14.99,
            contactEmail: `owner@${cleanSlug}.com`,
            products: [],
            collections: initialCollections,
            orders: [],
            customers: [],
            discounts: initialApexDiscounts,
            cart: { items: [], discountCode: null },
            createdAt: new Date().toISOString()
          }];
        }
      }

      return list.map((s) => ({
        id: s.id || `store_${Date.now()}`,
        name: s.name || 'Apex Athletics & Co.',
        subdomain: s.subdomain || 'apex-athletics.myshopify.local',
        customDomain: s.customDomain || (s.id === 'store_apex' ? 'apexstore.fashion.com' : s.id === 'store_aura' ? 'aurasound.audio.com' : `${s.subdomain?.split('.')[0] || 'store'}.com`),
        category: s.category || 'Sportswear & Performance',
        accentColor: s.accentColor || '#008060',
        themeId: s.themeId || 'theme_apex_velocity',
        currency: s.currency || 'USD',
        currencySymbol: s.currencySymbol || '$',
        status: s.status || 'active',
        taxRate: typeof s.taxRate === 'number' ? s.taxRate : 0.08,
        freeShippingThreshold: typeof s.freeShippingThreshold === 'number' ? s.freeShippingThreshold : 75.00,
        standardShippingRate: typeof s.standardShippingRate === 'number' ? s.standardShippingRate : 6.99,
        expressShippingRate: typeof s.expressShippingRate === 'number' ? s.expressShippingRate : 14.99,
        contactEmail: s.contactEmail || 'support@apexathletics.com',
        products: Array.isArray(s.products) ? s.products : [],
        collections: Array.isArray(s.collections) && s.collections.length > 0 ? s.collections : initialCollections,
        orders: Array.isArray(s.orders) ? s.orders : [],
        customers: Array.isArray(s.customers) ? s.customers : [],
        discounts: Array.isArray(s.discounts) ? s.discounts : initialApexDiscounts,
        cart: s.cart && Array.isArray(s.cart.items) ? s.cart : { items: [], discountCode: null },
        createdAt: s.createdAt || new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Storage parse fallback to initialStores:', e);
      return initialStores;
    }
  });

  // Resolve dedicated domain/query target on load
  const dedicatedResolution = useMemo(() => resolveDedicatedStore(stores), [stores]);
  const isDedicatedStore = dedicatedResolution.isDedicated;

  // 2. Active store ID (locks to dedicated store if matched via domain or URL)
  const [activeStoreId, setActiveStoreId] = useState(() => {
    if (dedicatedResolution.storeId) {
      return dedicatedResolution.storeId;
    }
    try {
      const saved = localStorage.getItem(ACTIVE_STORE_KEY);
      return saved || initialStores[0].id;
    } catch {
      return initialStores[0].id;
    }
  });

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);
  const [isThemeMarketplaceOpen, setIsThemeMarketplaceOpen] = useState(false);
  const [selectedProductForQuickView, setSelectedProductForQuickView] = useState(null);
  const [activeMode, setActiveMode] = useState(() => dedicatedResolution.initialMode || 'hub');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Scoped Authentication Tokens & Session
  const [merchantSession, setMerchantSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(`istora_merchant_session_${activeStoreId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token) return parsed;
      }
    } catch {}
    return { isAuthenticated: false, token: null, email: null };
  });

  // Re-sync session when store changes
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`istora_merchant_session_${activeStoreId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token) {
          setMerchantSession(parsed);
          return;
        }
      }
    } catch {}
    setMerchantSession({ isAuthenticated: false, token: null, email: null });
  }, [activeStoreId]);

  const publicStorefrontToken = useMemo(() => getPublicStorefrontToken(activeStoreId), [activeStoreId]);
  const privateMerchantToken = useMemo(() => getPrivateMerchantToken(activeStoreId), [activeStoreId]);
  const isMerchantAuthenticated = isImpersonating || merchantSession.isAuthenticated;

  const loginMerchant = (email, passwordOrToken) => {
    const store = stores.find(s => s.id === activeStoreId) || initialStores[0];
    const expectedEmail = (store.contactEmail || `owner@${store.slug || 'store'}.com`).toLowerCase();
    const expectedToken = getPrivateMerchantToken(activeStoreId);

    const inputClean = (passwordOrToken || '').trim();
    const emailClean = (email || '').trim().toLowerCase();

    // Valid if token matches OR password is 'admin' / 'password' / store slug / 4+ chars
    const isValid =
      inputClean === expectedToken ||
      inputClean === 'admin' ||
      inputClean === 'password' ||
      inputClean === (store.slug || '') ||
      inputClean.length >= 4;

    if (isValid) {
      const session = {
        isAuthenticated: true,
        token: expectedToken,
        email: emailClean || expectedEmail,
        storeId: activeStoreId,
        storeName: store.name
      };
      setMerchantSession(session);
      try {
        sessionStorage.setItem(`istora_merchant_session_${activeStoreId}`, JSON.stringify(session));
      } catch {}
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials or private merchant token.' };
  };

  const logoutMerchant = () => {
    setMerchantSession({ isAuthenticated: false, token: null, email: null });
    try {
      sessionStorage.removeItem(`istora_merchant_session_${activeStoreId}`);
    } catch {}
  };

  // Themes list with custom dist.zip persistence
  const [themes, setThemes] = useState(() => {
    try {
      const saved = localStorage.getItem(THEMES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialThemes;
    } catch {
      return initialThemes;
    }
  });

  // Vercel React Hosting Deployments
  const [deployments, setDeployments] = useState(() => {
    try {
      const saved = localStorage.getItem(DEPLOYMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialDeployments;
    } catch {
      return initialDeployments;
    }
  });

  const [activeDeploymentId, setActiveDeploymentId] = useState(
    deployments?.[0]?.id || initialDeployments[0].id
  );

  // Load high-capacity IndexedDB data (themes with full dist bundles & deployments)
  useEffect(() => {
    let isMounted = true;
    async function loadIndexedDb() {
      try {
        const [dbThemes, dbDeployments] = await Promise.all([
          getAllFromDB(THEMES_STORE),
          getAllFromDB(DEPLOYMENTS_STORE)
        ]);

        if (isMounted && Array.isArray(dbThemes) && dbThemes.length > 0) {
          setThemes((prev) => {
            const map = new Map(prev.map((t) => [t.id, t]));
            dbThemes.forEach((t) => {
              if (t && t.id) {
                map.set(t.id, { ...(map.get(t.id) || {}), ...t });
              }
            });
            return Array.from(map.values());
          });
        }

        if (isMounted && Array.isArray(dbDeployments) && dbDeployments.length > 0) {
          setDeployments((prev) => {
            const map = new Map(prev.map((d) => [d.id, d]));
            dbDeployments.forEach((d) => {
              if (d && d.id) {
                map.set(d.id, { ...(map.get(d.id) || {}), ...d });
              }
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[IndexedDB] Initial sync fallback:', err);
      }
    }
    loadIndexedDb();
    return () => { isMounted = false; };
  }, []);

  // Sync with C# ASP.NET Core Backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const isDedicated = dedicatedResolution.isDedicated;
        const targetStoreId = (isDedicated && dedicatedResolution.storeId) ? dedicatedResolution.storeId : null;

        const [backendDeployments, backendStores, backendProducts] = await Promise.all([
          apiClient.getDeployments().catch(() => null),
          apiClient.getStores().catch(() => null),
          apiClient.getProducts('all', targetStoreId).catch(() => null)
        ]);

        if (!isMounted) return;

        if (Array.isArray(backendDeployments) && backendDeployments.length > 0) {
          setDeployments((prev) => {
            const map = new Map(prev.map((d) => [d.id, d]));
            backendDeployments.forEach((d) => {
              if (d && d.id) {
                map.set(d.id, { ...(map.get(d.id) || {}), ...d });
              }
            });
            return Array.from(map.values());
          });
        }

        if (Array.isArray(backendStores) && backendStores.length > 0) {
          // If accessing a dedicated merchant domain, filter stores array strictly to their store
          const relevantBackendStores = (isDedicated && targetStoreId)
            ? backendStores.filter((s) => s.id === targetStoreId || s.slug === targetStoreId || s.id === `store_${targetStoreId}`)
            : backendStores;

          setStores((prev) => {
            const baseList = (isDedicated && targetStoreId)
              ? prev.filter((s) => s.id === targetStoreId || s.slug === targetStoreId || s.id === `store_${targetStoreId}`)
              : prev;
            const map = new Map(baseList.map((s) => [s.id, s]));

            relevantBackendStores.forEach((bs) => {
              const existing = map.get(bs.id);
              if (existing) {
                map.set(bs.id, {
                  ...existing,
                  ...bs,
                  products: existing.products?.length ? existing.products : []
                });
              } else {
                map.set(bs.id, {
                  ...bs,
                  products: [],
                  collections: initialCollections,
                  orders: [],
                  customers: [],
                  discounts: initialApexDiscounts,
                  cart: { items: [], discountCode: null },
                  createdAt: bs.createdAt || new Date().toISOString()
                });
              }
            });

            // If backend products are returned, attach them to their respective store
            if (Array.isArray(backendProducts) && backendProducts.length > 0) {
              relevantBackendStores.forEach((bs) => {
                const storeProds = backendProducts.filter((p) => p.storeId === bs.id);
                if (storeProds.length > 0) {
                  const target = map.get(bs.id);
                  if (target) {
                    target.products = storeProds.map((p) => ({
                      id: p.id,
                      title: p.title,
                      price: p.price,
                      compareAtPrice: p.compareAtPrice,
                      badge: p.badge,
                      images: [p.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
                      collectionId: (p.category || 'footwear').toLowerCase(),
                      productType: p.category,
                      description: p.description,
                      options: p.options || [{ name: 'Title', values: ['Default Title'] }],
                      variants: p.variants && p.variants.length > 0 ? p.variants : [
                        { id: `var_${p.id}_1`, title: 'Default', price: p.price, inventoryQuantity: p.inventory || 50 }
                      ]
                    }));
                  }
                }
              });
            }

            return Array.from(map.values());
          });

          if (isDedicated && targetStoreId) {
            setActiveStoreId(targetStoreId);
          }
        }
      } catch (err) {
        console.warn('[C# Engine] Initial sync fallback to local state:', err);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  // Persist themes: full data to IndexedDB, lightweight manifest to localStorage
  const addCustomTheme = async (newTheme) => {
    // 1. Save full bundle to IndexedDB (no quota limit)
    await saveItemToDB(THEMES_STORE, newTheme);

    // 2. Update React state
    setThemes((prev) => {
      const updated = [newTheme, ...prev.filter((t) => t.id !== newTheme.id)];
      try {
        const lightweight = updated.map((t) => {
          if (!t.isCustomDistZip) return t;
          return {
            ...t,
            // Avoid saving full multimegabyte files object in 5MB localStorage
            files: { 'index.html': t.files?.['index.html'] || '' }
          };
        });
        localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(lightweight));
      } catch (e) {
        console.warn('Deployments manifest fallback:', e);
      }
      return updated;
    });
  };

  // Persist deployments: full data to IndexedDB, lightweight manifest to localStorage
  const createDeployment = async (newDep) => {
    await saveItemToDB(DEPLOYMENTS_STORE, newDep);
    setDeployments((prev) => [newDep, ...prev.filter((d) => d.id !== newDep.id)]);
    setActiveDeploymentId(newDep.id);
    try {
      await apiClient.saveDeployment(newDep);
    } catch {}
  };

  const deleteDeployment = async (id) => {
    setDeployments((prev) => prev.filter((d) => d.id !== id));
    await apiClient.deleteDeployment(id);
  };

  const updateDeploymentFiles = async (id, newFiles) => {
    let updatedDep = null;
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updatedDep = {
            ...d,
            files: newFiles,
            logs: [
              {
                timestamp: '00:00.010',
                level: 'info',
                message: 'Incremental hot-reload trigger synced to C# ASP.NET Core backend'
              },
              {
                timestamp: '00:00.080',
                level: 'info',
                message: 'Rebuilt React AST and updated edge distribution'
              },
              ...(d.logs || [])
            ]
          };
          return updatedDep;
        }
        return d;
      })
    );
    if (updatedDep) {
      await apiClient.saveDeployment(updatedDep);
    }
  };

  const rebuildDeployment = (id) => {
    setDeployments((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            buildDurationMs: Math.floor(Math.random() * 400 + 800),
            logs: [
              {
                timestamp: '00:00.010',
                level: 'info',
                message: `Manual rebuild triggered for ${d.name}`
              },
              {
                timestamp: '00:00.210',
                level: 'info',
                message: 'Re-transpiling React JSX bundle via esbuild'
              },
              {
                timestamp: '00:00.640',
                level: 'success',
                message: `Deployment updated successfully: ${d.liveUrl}`
              },
              ...(d.logs || [])
            ]
          };
        }
        return d;
      })
    );
  };

  useEffect(() => {
    try {
      if (!isDedicatedStore) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
      } else if (activeStoreId) {
        localStorage.setItem(`${STORAGE_KEY}_${activeStoreId}`, JSON.stringify(stores));
      }
    } catch (e) {
      console.error('Failed to save stores to localStorage:', e);
    }
  }, [stores, isDedicatedStore, activeStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_STORE_KEY, activeStoreId);
    } catch (e) {
      console.error('Failed to save activeStoreId:', e);
    }
  }, [activeStoreId]);

  // Guaranteed active store resolution
  const activeStore =
    (stores && stores.length > 0 ? stores.find((s) => s.id === activeStoreId) || stores[0] : null) ||
    initialStores[0];

  // Guaranteed active theme resolution with dynamic deployment file fallback
  const activeTheme = useMemo(() => {
    const tId = activeStore?.themeId || 'theme_apex_velocity';
    const found = themes.find((t) => t.id === tId) || themes[0];
    // If it is a custom dist.zip theme, ensure files are resolved from deployments if missing
    if (found?.isCustomDistZip && (!found.files || Object.keys(found.files).length === 0)) {
      const dep = deployments.find((d) => d.id === (found.deploymentId || activeStore?.customDeploymentId));
      if (dep?.files) {
        return { ...found, files: dep.files };
      }
    }
    return found;
  }, [themes, activeStore?.themeId, activeStore?.customDeploymentId, deployments]);

  // Helper to mutate active store safely
  const mutateActiveStore = (updater) => {
    setStores((prevStores) =>
      prevStores.map((store) => {
        if (store.id === activeStore.id) {
          return updater(store);
        }
        return store;
      })
    );
  };

  // Instant 1-Click Theme Binding to Store (supports direct theme object to avoid async state race)
  const applyThemeToActiveStore = (themeId, customThemeObj = null) => {
    const selectedTheme = customThemeObj || themes.find((t) => t.id === themeId);
    if (!selectedTheme) return;

    mutateActiveStore((store) => ({
      ...store,
      themeId: selectedTheme.id,
      accentColor: selectedTheme.styles?.accentColor || store.accentColor,
      customDeploymentId: selectedTheme.deploymentId || null
    }));

    // Sync theme selection to C# backend PostgreSQL settings
    try {
      apiClient.updateStoreSettings({
        id: 'default',
        storeName: activeStore?.name || 'Apex Athletics',
        storeDomain: activeStore?.subdomain || 'apex-store.myshopify.local',
        theme: selectedTheme.id
      }).catch(() => {});
    } catch {}
  };

  // Multi-Tenancy Store Creator with Developer Theme Binding
  const createStore = ({ name, handle, category, templateId, themeId, contactEmail, emptyCatalog = false }) => {
    const cleanSubdomain = (handle || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const template = storeTemplates.find((t) => t.id === templateId) || storeTemplates[0];
    const selectedTheme = themes.find((t) => t.id === themeId) || themes[0];

    const newStoreId = `store_${cleanSubdomain}`;
    const newStore = {
      id: newStoreId,
      name: name.trim(),
      slug: cleanSubdomain,
      subdomain: `${cleanSubdomain}.istora.online`,
      customDomain: `${cleanSubdomain}.istora.online`,
      category: category || template.category,
      themeId: selectedTheme.id,
      customDeploymentId: selectedTheme.deploymentId || null,
      accentColor: selectedTheme.styles?.accentColor || template.accentColor || '#008060',
      currency: 'USD',
      currencySymbol: '$',
      status: 'active',
      taxRate: 0.08,
      freeShippingThreshold: 75.00,
      standardShippingRate: 6.99,
      expressShippingRate: 14.99,
      contactEmail: contactEmail || `owner@${cleanSubdomain}.com`,
      products: emptyCatalog ? [] : template.products.map((p) => ({
        ...p,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        storeId: newStoreId
      })),
      orders: [],
      customers: [],
      discounts: [
        { code: 'WELCOME10', type: 'percentage', value: 10, description: '10% off your first purchase', minSubtotal: 0, storeId: newStoreId },
        { code: 'FREESHIP', type: 'shipping', value: 100, description: 'Free express courier shipping', minSubtotal: 0, storeId: newStoreId }
      ],
      cart: { items: [], discountCode: null },
      createdAt: new Date().toISOString()
    };

    setStores((prev) => [newStore, ...prev.filter(s => s.id !== newStoreId)]);
    setActiveStoreId(newStoreId);
    setActiveMode('storefront');

    // Sync to PostgreSQL backend
    apiClient.createStore({
      id: newStore.id,
      name: newStore.name,
      slug: newStore.slug,
      subdomain: newStore.subdomain,
      customDomain: newStore.customDomain,
      category: newStore.category,
      themeId: newStore.themeId,
      accentColor: newStore.accentColor,
      currency: newStore.currency,
      currencySymbol: newStore.currencySymbol,
      taxRate: newStore.taxRate,
      freeShippingThreshold: newStore.freeShippingThreshold,
      standardShippingRate: newStore.standardShippingRate,
      expressShippingRate: newStore.expressShippingRate,
      contactEmail: newStore.contactEmail,
      status: newStore.status
    }).catch(err => console.warn('[StoreContext] Backend createStore sync notice:', err));

    return newStore;
  };

  const switchStore = (storeId) => {
    if (isDedicatedStore && !isImpersonating) {
      console.warn('[Tenant Guard] Store switching disabled on dedicated merchant domains.');
      return;
    }
    if (stores.some((s) => s.id === storeId)) {
      setActiveStoreId(storeId);
      setIsCartOpen(false);
      setSelectedProductForQuickView(null);
    }
  };

  const toggleStoreStatus = (storeId) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId
          ? { ...s, status: s.status === 'suspended' ? 'active' : 'suspended' }
          : s
      )
    );
  };

  const deleteStore = (storeId) => {
    if (stores.length <= 1) {
      alert('Cannot delete the last remaining store.');
      return;
    }
    const remaining = stores.filter((s) => s.id !== storeId);
    setStores(remaining);
    setActiveStoreId(remaining[0].id);
  };

  // Master Admin: Impersonate any merchant store
  const loginAsMerchant = (storeId) => {
    switchStore(storeId);
    setIsImpersonating(true);
    setActiveMode('admin');
  };

  const exitImpersonation = () => {
    setIsImpersonating(false);
    setActiveMode('master');
  };

  // Active store collections & items
  const cart = activeStore?.cart || { items: [], discountCode: null };
  const products = activeStore?.products || [];
  const collections = activeStore?.collections || initialCollections;
  const orders = activeStore?.orders || [];
  const customers = activeStore?.customers || [];
  const discounts = activeStore?.discounts || [];
  const settings = {
    storeName: activeStore?.name || 'Apex Athletics & Co.',
    storeDomain: activeStore?.subdomain || 'apex-athletics.myshopify.local',
    customDomain: activeStore?.customDomain || (activeStore?.id === 'store_apex' ? 'apexstore.fashion.com' : `${activeStore?.subdomain?.split('.')[0] || 'store'}.com`),
    currency: activeStore?.currency || 'USD',
    currencySymbol: activeStore?.currencySymbol || '$',
    taxRate: typeof activeStore?.taxRate === 'number' ? activeStore.taxRate : 0.08,
    freeShippingThreshold: typeof activeStore?.freeShippingThreshold === 'number' ? activeStore.freeShippingThreshold : 75.00,
    standardShippingRate: typeof activeStore?.standardShippingRate === 'number' ? activeStore.standardShippingRate : 6.99,
    expressShippingRate: typeof activeStore?.expressShippingRate === 'number' ? activeStore.expressShippingRate : 14.99,
    contactEmail: activeStore?.contactEmail || 'support@apexathletics.com',
    accentColor: activeStore?.accentColor || '#008060',
    status: activeStore?.status || 'active',
    // Payment Gateways
    razorpayEnabled: activeStore?.razorpayEnabled ?? true,
    razorpayKeyId: activeStore?.razorpayKeyId || '',
    razorpayKeySecret: activeStore?.razorpayKeySecret || '',
    stripeEnabled: activeStore?.stripeEnabled ?? true,
    stripePublishableKey: activeStore?.stripePublishableKey || '',
    stripeSecretKey: activeStore?.stripeSecretKey || '',
    codEnabled: activeStore?.codEnabled ?? true
  };

  const appliedDiscount = discounts.find(
    (d) => d.code.toUpperCase() === (cart.discountCode || '').toUpperCase()
  );

  const cartItemsCount = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartSubtotal = (cart.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  let cartDiscountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      cartDiscountAmount = (cartSubtotal * appliedDiscount.value) / 100;
    } else if (appliedDiscount.type === 'fixed') {
      cartDiscountAmount = Math.min(appliedDiscount.value, cartSubtotal);
    }
  }

  const isFreeShipping =
    cartSubtotal >= settings.freeShippingThreshold ||
    (appliedDiscount && appliedDiscount.type === 'shipping');

  const cartShippingCost = (cart.items || []).length === 0 ? 0 : isFreeShipping ? 0 : settings.standardShippingRate;
  const taxableAmount = Math.max(0, cartSubtotal - cartDiscountAmount);
  const cartTax = taxableAmount * settings.taxRate;
  const cartTotal = taxableAmount + cartShippingCost + cartTax;
  const amountToFreeShipping = Math.max(0, settings.freeShippingThreshold - cartSubtotal);

  // Cart Actions
  const addToCart = (product, variant, quantity = 1) => {
    mutateActiveStore((store) => {
      const prevCart = store.cart || { items: [], discountCode: null };
      const currentItems = Array.isArray(prevCart.items) ? prevCart.items : [];
      const existingIndex = currentItems.findIndex((item) => item.variantId === variant.id);
      let updatedItems;

      if (existingIndex > -1) {
        updatedItems = [...currentItems];
        const newQty = updatedItems[existingIndex].quantity + quantity;
        updatedItems[existingIndex].quantity = Math.min(newQty, variant.inventoryQuantity || 99);
      } else {
        updatedItems = [
          ...currentItems,
          {
            variantId: variant.id,
            productId: product.id,
            title: product.title,
            variantTitle: variant.title,
            price: variant.price || product.price,
            compareAtPrice: variant.compareAtPrice || product.compareAtPrice,
            image: product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
            sku: variant.sku,
            quantity: Math.min(quantity, variant.inventoryQuantity || 99),
            maxStock: variant.inventoryQuantity || 99
          }
        ];
      }

      return {
        ...store,
        cart: { ...prevCart, items: updatedItems }
      };
    });
    setIsCartOpen(true);
  };

  const updateCartItemQty = (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    mutateActiveStore((store) => ({
      ...store,
      cart: {
        ...(store.cart || {}),
        items: (store.cart?.items || []).map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.min(newQuantity, item.maxStock || 99) }
            : item
        )
      }
    }));
  };

  const removeFromCart = (variantId) => {
    mutateActiveStore((store) => ({
      ...store,
      cart: {
        ...(store.cart || {}),
        items: (store.cart?.items || []).filter((item) => item.variantId !== variantId)
      }
    }));
  };

  const clearCart = () => {
    mutateActiveStore((store) => ({
      ...store,
      cart: { items: [], discountCode: null }
    }));
  };

  const applyDiscount = (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    const match = discounts.find((d) => d.code.toUpperCase() === trimmed);
    if (!match) {
      return { success: false, message: 'Invalid discount code' };
    }
    if (cartSubtotal < match.minSubtotal) {
      return {
        success: false,
        message: `Order subtotal must be at least $${match.minSubtotal} to use ${match.code}`
      };
    }
    mutateActiveStore((store) => ({
      ...store,
      cart: { ...(store.cart || {}), discountCode: trimmed }
    }));
    return { success: true, message: `${match.code} applied successfully!`, discount: match };
  };

  const removeDiscount = () => {
    mutateActiveStore((store) => ({
      ...store,
      cart: { ...(store.cart || {}), discountCode: null }
    }));
  };

  // Order Placement & Inventory Lock for the active store
  const createOrder = (checkoutDetails) => {
    const orderNum = `#${1001 + orders.length}`;
    const newOrderId = `ord_${Date.now()}`;

    let createdOrder = null;

    mutateActiveStore((store) => {
      const currentCartItems = store.cart?.items || [];

      // 1. Decrement inventory
      const updatedProducts = (store.products || []).map((p) => {
        const matchingCartItems = currentCartItems.filter((item) => item.productId === p.id);
        if (matchingCartItems.length === 0) return p;

        const updatedVariants = (p.variants || []).map((v) => {
          const cartItem = matchingCartItems.find((item) => item.variantId === v.id);
          if (cartItem) {
            return {
              ...v,
              inventoryQuantity: Math.max(0, (v.inventoryQuantity || 0) - cartItem.quantity)
            };
          }
          return v;
        });

        return { ...p, variants: updatedVariants };
      });

      // 2. Materialize order
      createdOrder = {
        id: newOrderId,
        orderNumber: orderNum,
        storeId: store.id,
        storeName: store.name,
        customer: {
          firstName: checkoutDetails.firstName,
          lastName: checkoutDetails.lastName,
          email: checkoutDetails.email,
          address: checkoutDetails.address,
          city: checkoutDetails.city,
          state: checkoutDetails.state,
          zip: checkoutDetails.zip
        },
        items: currentCartItems.map((item) => ({ ...item })),
        financialStatus: 'paid',
        fulfillmentStatus: 'unfulfilled',
        trackingNumber: null,
        subtotal: cartSubtotal,
        discountAmount: cartDiscountAmount,
        shippingCost: checkoutDetails.shippingMethod === 'express' ? store.expressShippingRate : cartShippingCost,
        tax: cartTax,
        total:
          taxableAmount +
          (checkoutDetails.shippingMethod === 'express' ? store.expressShippingRate : cartShippingCost) +
          cartTax,
        createdAt: new Date().toISOString()
      };

      // 3. Update customer CRM
      let updatedCustomers = [...(store.customers || [])];
      const existing = updatedCustomers.find(
        (c) => c.email.toLowerCase() === checkoutDetails.email.toLowerCase()
      );
      if (existing) {
        updatedCustomers = updatedCustomers.map((c) =>
          c.id === existing.id
            ? { ...c, ordersCount: (c.ordersCount || 0) + 1, totalSpent: (c.totalSpent || 0) + createdOrder.total }
            : c
        );
      } else {
        updatedCustomers.unshift({
          id: `cust_${Date.now()}`,
          name: `${checkoutDetails.firstName} ${checkoutDetails.lastName}`,
          email: checkoutDetails.email,
          ordersCount: 1,
          totalSpent: createdOrder.total,
          city: `${checkoutDetails.city}, ${checkoutDetails.state}`,
          tags: ['new-customer']
        });
      }

      return {
        ...store,
        products: updatedProducts,
        orders: [createdOrder, ...(store.orders || [])],
        customers: updatedCustomers,
        cart: { items: [], discountCode: null }
      };
    });

    if (createdOrder) {
      apiClient.createOrder({
        id: createdOrder.id,
        storeId: createdOrder.storeId,
        orderNumber: createdOrder.orderNumber,
        customerName: `${checkoutDetails.firstName} ${checkoutDetails.lastName}`,
        customerEmail: checkoutDetails.email,
        total: Number(createdOrder.total) || 0,
        status: 'Paid',
        paymentMethod: checkoutDetails.paymentMethod || 'UPI',
        items: (createdOrder.items || []).map(i => ({
          product: { id: i.productId, title: i.title, price: i.price, category: 'General' },
          variant: { id: i.variantId, name: i.variantTitle, price: i.price, sku: i.sku },
          quantity: i.quantity
        }))
      }).catch(err => console.warn('[StoreContext] Backend order sync error:', err));
    }

    return createdOrder;
  };

  // Fulfill Order
  const fulfillOrder = (orderId, customTracking) => {
    const tracking = customTracking || `APX-${Math.floor(100000000 + Math.random() * 900000000)}`;
    mutateActiveStore((store) => ({
      ...store,
      orders: (store.orders || []).map((ord) =>
        ord.id === orderId
          ? { ...ord, fulfillmentStatus: 'fulfilled', trackingNumber: tracking }
          : ord
      )
    }));
  };

  // Product CRUD
  const addProduct = (productData) => {
    const id = `prod_${Date.now()}`;
    const handle = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProduct = {
      id,
      handle,
      status: 'active',
      createdAt: new Date().toISOString(),
      ...productData
    };
    mutateActiveStore((store) => ({
      ...store,
      products: [newProduct, ...(store.products || [])]
    }));

    // Async sync with C# ASP.NET Core API / PostgreSQL database
    apiClient.createProduct({
      id: newProduct.id,
      storeId: activeStore.id,
      title: newProduct.title,
      category: newProduct.category || 'Apparel',
      price: Number(newProduct.price) || 0,
      compareAtPrice: newProduct.compareAtPrice ? Number(newProduct.compareAtPrice) : null,
      badge: newProduct.badge || null,
      image: Array.isArray(newProduct.images) ? newProduct.images[0] : (newProduct.image || ''),
      description: newProduct.description || '',
      inventory: Number(newProduct.inventory) || 50,
      variants: Array.isArray(newProduct.variants) ? newProduct.variants : []
    }).catch(err => console.warn('[StoreContext] Backend product sync error:', err));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shopify:products:updated', { detail: newProduct }));
      // Broadcast to iframe hosted runners
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          iframe.contentWindow?.postMessage({ type: 'SHOPIFY_PRODUCTS_UPDATED', product: newProduct }, '*');
        } catch (e) {}
      });
    }

    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    mutateActiveStore((store) => {
      const updatedList = (store.products || []).map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
      const target = updatedList.find(p => p.id === id);
      if (target) {
        apiClient.updateProduct(id, {
          id: target.id,
          title: target.title,
          category: target.category || 'Apparel',
          price: Number(target.price) || 0,
          compareAtPrice: target.compareAtPrice ? Number(target.compareAtPrice) : null,
          badge: target.badge || null,
          image: Array.isArray(target.images) ? target.images[0] : (target.image || ''),
          description: target.description || '',
          inventory: Number(target.inventory) || 50,
          variants: Array.isArray(target.variants) ? target.variants : []
        }).catch(err => console.warn('[StoreContext] Backend product update error:', err));
      }
      return {
        ...store,
        products: updatedList
      };
    });
  };

  const deleteProduct = (id) => {
    mutateActiveStore((store) => ({
      ...store,
      products: (store.products || []).filter((p) => p.id !== id)
    }));
    apiClient.deleteProduct(id).catch(err => console.warn('[StoreContext] Backend product delete error:', err));
  };

  // Category & Collection Management
  const addCategory = (categoryData) => {
    const title = typeof categoryData === 'string' ? categoryData.trim() : (categoryData?.title?.trim() || '');
    if (!title) return null;

    const id = (typeof categoryData === 'object' && categoryData.id)
      ? categoryData.id
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const handle = id;
    const description = typeof categoryData === 'object' ? categoryData.description || '' : '';
    const image = typeof categoryData === 'object' ? categoryData.image || '' : '';

    const newCollection = { id, title, handle, description, image };

    mutateActiveStore((store) => {
      const existing = store.collections || initialCollections;
      if (existing.some((c) => c.id === id || c.title.toLowerCase() === title.toLowerCase())) {
        return store;
      }
      return {
        ...store,
        collections: [...existing, newCollection]
      };
    });

    return newCollection;
  };

  const deleteCategory = (categoryId) => {
    mutateActiveStore((store) => ({
      ...store,
      collections: (store.collections || initialCollections).filter((c) => c.id !== categoryId)
    }));
  };

  const setSettings = (newSettings) => {
    let updatedStore = null;
    mutateActiveStore((store) => {
      updatedStore = {
        ...store,
        name: newSettings.storeName || store.name,
        customDomain: newSettings.customDomain !== undefined ? newSettings.customDomain : store.customDomain,
        taxRate: typeof newSettings.taxRate === 'number' ? newSettings.taxRate : store.taxRate,
        freeShippingThreshold: typeof newSettings.freeShippingThreshold === 'number' ? newSettings.freeShippingThreshold : store.freeShippingThreshold,
        standardShippingRate: typeof newSettings.standardShippingRate === 'number' ? newSettings.standardShippingRate : store.standardShippingRate,
        expressShippingRate: typeof newSettings.expressShippingRate === 'number' ? newSettings.expressShippingRate : store.expressShippingRate,
        razorpayEnabled: newSettings.razorpayEnabled !== undefined ? newSettings.razorpayEnabled : store.razorpayEnabled,
        razorpayKeyId: newSettings.razorpayKeyId !== undefined ? newSettings.razorpayKeyId : store.razorpayKeyId,
        razorpayKeySecret: newSettings.razorpayKeySecret !== undefined ? newSettings.razorpayKeySecret : store.razorpayKeySecret,
        stripeEnabled: newSettings.stripeEnabled !== undefined ? newSettings.stripeEnabled : store.stripeEnabled,
        stripePublishableKey: newSettings.stripePublishableKey !== undefined ? newSettings.stripePublishableKey : store.stripePublishableKey,
        stripeSecretKey: newSettings.stripeSecretKey !== undefined ? newSettings.stripeSecretKey : store.stripeSecretKey,
        codEnabled: newSettings.codEnabled !== undefined ? newSettings.codEnabled : store.codEnabled
      };
      return updatedStore;
    });

    if (updatedStore && updatedStore.id) {
      apiClient.updateStore(updatedStore.id, {
        id: updatedStore.id,
        name: updatedStore.name,
        slug: updatedStore.slug || updatedStore.id.replace(/^store_/, ''),
        subdomain: updatedStore.subdomain,
        customDomain: updatedStore.customDomain,
        category: updatedStore.category,
        themeId: updatedStore.themeId,
        accentColor: updatedStore.accentColor,
        currency: updatedStore.currency,
        currencySymbol: updatedStore.currencySymbol,
        taxRate: updatedStore.taxRate,
        freeShippingThreshold: updatedStore.freeShippingThreshold,
        standardShippingRate: updatedStore.standardShippingRate,
        expressShippingRate: updatedStore.expressShippingRate,
        contactEmail: updatedStore.contactEmail,
        status: updatedStore.status,
        razorpayEnabled: updatedStore.razorpayEnabled,
        razorpayKeyId: updatedStore.razorpayKeyId,
        razorpayKeySecret: updatedStore.razorpayKeySecret,
        stripeEnabled: updatedStore.stripeEnabled,
        stripePublishableKey: updatedStore.stripePublishableKey,
        stripeSecretKey: updatedStore.stripeSecretKey,
        codEnabled: updatedStore.codEnabled
      }).catch(err => console.warn('[StoreContext] Backend updateStore error:', err));
    }
  };

  // Sync and reload products, categories, customers from backend
  const refreshStoreData = async () => {
    try {
      const targetStoreId = activeStore?.id || dedicatedResolution.storeId || 'store_apex';
      const [backendProducts, backendCategories, backendCustomers] = await Promise.all([
        apiClient.getProducts('all', targetStoreId).catch(() => null),
        apiClient.getCategories(targetStoreId).catch(() => null),
        apiClient.getCustomers(targetStoreId).catch(() => null)
      ]);

      mutateActiveStore((store) => {
        let updatedProducts = store.products;
        if (Array.isArray(backendProducts) && backendProducts.length > 0) {
          updatedProducts = backendProducts.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            badge: p.badge,
            images: [p.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
            collectionId: (p.category || 'footwear').toLowerCase(),
            productType: p.category,
            description: p.description,
            inventory: p.inventory || 50,
            options: p.options || [{ name: 'Title', values: ['Default Title'] }],
            variants: p.variants && p.variants.length > 0 ? p.variants : [
              { id: `var_${p.id}_1`, title: 'Default', price: p.price, inventoryQuantity: p.inventory || 50 }
            ]
          }));
        }

        let updatedCollections = store.collections;
        if (Array.isArray(backendCategories) && backendCategories.length > 0) {
          updatedCollections = backendCategories.map((c) => ({
            id: (c.slug || c.id || c.name).toLowerCase(),
            title: c.name,
            description: c.name
          }));
        }

        let updatedCustomers = store.customers;
        if (Array.isArray(backendCustomers) && backendCustomers.length > 0) {
          updatedCustomers = backendCustomers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone || '',
            ordersCount: c.ordersCount || 0,
            totalSpent: c.totalSpent || 0,
            createdAt: c.createdAt || new Date().toISOString()
          }));
        }

        return {
          ...store,
          products: updatedProducts,
          collections: updatedCollections,
          customers: updatedCustomers
        };
      });
      return true;
    } catch (err) {
      console.warn('[StoreContext] refreshStoreData error:', err);
      return false;
    }
  };

  // Factory reset
  const resetToDefaults = () => {
    try {
      localStorage.clear();
    } catch {}
    setStores(initialStores);
    setActiveStoreId(initialStores[0].id);
  };

  // Active Store KPI Metrics
  const totalRevenue = (orders || []).reduce((sum, ord) => sum + (ord.total || 0), 0);
  const totalOrdersCount = (orders || []).length;
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const unfulfilledOrdersCount = (orders || []).filter((o) => o.fulfillmentStatus === 'unfulfilled').length;

  // Master / Super Admin Global Metrics
  const totalPlatformGmv = (stores || []).reduce(
    (sum, s) => sum + (s.orders || []).reduce((oSum, o) => oSum + (o.total || 0), 0),
    0
  );
  const totalPlatformOrders = (stores || []).reduce((sum, s) => sum + (s.orders || []).length, 0);
  const totalPlatformProducts = (stores || []).reduce((sum, s) => sum + (s.products || []).length, 0);
  const totalPlatformCustomers = (stores || []).reduce((sum, s) => sum + (s.customers || []).length, 0);
  const platformTakeRate = 0.025;
  const totalPlatformFeesCollected = totalPlatformGmv * platformTakeRate;

  const allPlatformOrders = (stores || [])
    .flatMap((s) => (s.orders || []).map((o) => ({ ...o, storeName: s.name, storeId: s.id, subdomain: s.subdomain })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <StoreContext.Provider
      value={{
        // Multi-Tenant Stores
        stores,
        activeStore,
        activeStoreId,
        isDedicatedStore,
        createStore,
        switchStore,
        deleteStore,
        toggleStoreStatus,
        storeTemplates,

        // Themes & Design Marketplace
        themes,
        setThemes,
        addCustomTheme,
        activeTheme,
        applyThemeToActiveStore,
        isThemeMarketplaceOpen,
        setIsThemeMarketplaceOpen,

        // Vercel React Hosting Engine
        deployments,
        setDeployments,
        activeDeploymentId,
        setActiveDeploymentId,
        createDeployment,
        deleteDeployment,
        updateDeploymentFiles,
        rebuildDeployment,

        // Master / Super Admin
        totalPlatformGmv,
        totalPlatformOrders,
        totalPlatformProducts,
        totalPlatformCustomers,
        totalPlatformFeesCollected,
        allPlatformOrders,
        loginAsMerchant,
        isImpersonating,
        exitImpersonation,

        // Data for active store
        products,
        collections,
        addCategory,
        deleteCategory,
        orders,
        customers,
        discounts,
        settings,
        setSettings,

        // Cart
        cart,
        isCartOpen,
        setIsCartOpen,
        isCreateStoreModalOpen,
        setIsCreateStoreModalOpen,
        cartItemsCount,
        cartSubtotal,
        cartDiscountAmount,
        cartShippingCost,
        cartTax,
        cartTotal,
        amountToFreeShipping,
        isFreeShipping,
        appliedDiscount,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        applyDiscount,
        removeDiscount,

        // Orders & Fulfillment
        createOrder,
        fulfillOrder,

        // Product Management
        addProduct,
        updateProduct,
        deleteProduct,

        // UI State
        selectedProductForQuickView,
        setSelectedProductForQuickView,
        activeMode,
        setActiveMode,
        adminTab,
        setAdminTab,

        // Analytics
        totalRevenue,
        totalOrdersCount,
        averageOrderValue,
        unfulfilledOrdersCount,

        // Dual Token Authentication
        publicStorefrontToken,
        privateMerchantToken,
        isMerchantAuthenticated,
        merchantSession,
        loginMerchant,
        logoutMerchant,

        // System
        refreshStoreData,
        resetToDefaults
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
