// dbStorage.js
// High-capacity browser storage using IndexedDB to store dist.zip bundles,
// custom theme files, and deployments without the 5MB localStorage quota limit.

const DB_NAME = 'ShopifyEngineDB';
const DB_VERSION = 1;
const THEMES_STORE = 'custom_themes';
const DEPLOYMENTS_STORE = 'deployments';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(THEMES_STORE)) {
        db.createObjectStore(THEMES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEPLOYMENTS_STORE)) {
        db.createObjectStore(DEPLOYMENTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveItemToDB(storeName, item) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to save to ${storeName}:`, err);
    return null;
  }
}

export async function getItemFromDB(storeName, id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to get from ${storeName}:`, err);
    return null;
  }
}

export async function getAllFromDB(storeName) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to getAll from ${storeName}:`, err);
    return [];
  }
}

export async function deleteFromDB(storeName, id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to delete from ${storeName}:`, err);
    return false;
  }
}

export { THEMES_STORE, DEPLOYMENTS_STORE };
