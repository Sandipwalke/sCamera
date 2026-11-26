/**
 * Persistence layer combining localStorage (settings, roll counter, photo index)
 * and IndexedDB (full-resolution JPEG blobs and thumbnails for offline gallery).
 */

const SETTINGS_KEY = 'scamera.settings.v1';
const INDEX_KEY = 'scamera.gallery.index.v1';
const FALLBACK_PHOTOS_KEY = 'scamera.gallery.fallback.v1';
const DB_NAME = 'sCameraDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

export const DEFAULT_SETTINGS = {
  filterId: 'kodak-gold',
  filterCategory: 'all',
  favoriteFilterIds: ['kodak-gold', 'portra-400', 'cinestill-800t'],
  aspectRatio: '4:3',
  exposure: 0,
  grainIntensity: 1.0,
  vignetteIntensity: 1.0,
  lightLeakMode: 0, // 0: off, 1: amber, 2: magenta, 3: gold, 4: random
  lightLeakIntensity: 0.65,
  dateStampMode: 'modern', // 'off' | 'modern' | 'retro98'
  frameStyle: 'none', // 'none' | 'polaroid' | '35mm'
  gridEnabled: true,
  soundEnabled: true,
  autoSaveDevice: true,
  timerSeconds: 0,
  facingMode: 'environment',
  rollCounter: 1,
  rollNumber: 1,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save settings to localStorage:', err);
  }
}

function loadGalleryIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGalleryIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.warn('Could not save gallery index to localStorage:', err);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataURL) {
  const [header, b64] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

class PhotoStore {
  constructor() {
    this.dbPromise = null;
  }

  async _getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB().catch(() => null);
    }
    return this.dbPromise;
  }

  async savePhoto({ blob, thumbBlob, meta }) {
    const record = {
      id: meta.id,
      createdAt: meta.createdAt,
      filterId: meta.filterId,
      filterName: meta.filterName,
      frameNumber: meta.frameNumber,
      width: meta.width,
      height: meta.height,
      caption: meta.caption || '',
      favorite: Boolean(meta.favorite),
      sizeBytes: blob.size,
    };

    const index = loadGalleryIndex();
    index.unshift(record);
    saveGalleryIndex(index);

    const db = await this._getDB();
    if (db) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({
          ...record,
          blob,
          thumbBlob,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return record;
    }

    // Fallback to localStorage for environments without IndexedDB
    try {
      const existing = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
      const dataUrl = await blobToDataURL(thumbBlob || blob);
      existing[record.id] = dataUrl;
      localStorage.setItem(FALLBACK_PHOTOS_KEY, JSON.stringify(existing));
    } catch (err) {
      console.warn('localStorage fallback quota exceeded:', err);
    }
    return record;
  }

  async listPhotos() {
    const index = loadGalleryIndex();
    const db = await this._getDB();
    if (!db) {
      const fallback = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
      return index.map((item) => ({
        ...item,
        thumbUrl: fallback[item.id] || '',
        fullUrl: fallback[item.id] || '',
      }));
    }

    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const map = new Map(records.map((r) => [r.id, r]));
    // Reconcile if index was cleared or out of sync
    const ordered = index.length
      ? index.map((item) => map.get(item.id) || item).filter(Boolean)
      : records.sort((a, b) => b.createdAt - a.createdAt);

    return ordered.map((item) => ({
      ...item,
      thumbBlob: item.thumbBlob || item.blob,
    }));
  }

  async getPhoto(id) {
    const db = await this._getDB();
    if (!db) {
      const index = loadGalleryIndex();
      const meta = index.find((i) => i.id === id);
      const fallback = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
      if (!meta || !fallback[id]) return null;
      const blob = dataURLToBlob(fallback[id]);
      return { ...meta, blob, thumbBlob: blob };
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async updatePhotoMeta(id, patch) {
    const index = loadGalleryIndex();
    const nextIndex = index.map((item) => (item.id === id ? { ...item, ...patch } : item));
    saveGalleryIndex(nextIndex);

    const db = await this._getDB();
    if (db) {
      const existing = await this.getPhoto(id);
      if (existing) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put({ ...existing, ...patch });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
    }
  }

  async deletePhoto(id) {
    const index = loadGalleryIndex().filter((item) => item.id !== id);
    saveGalleryIndex(index);

    const db = await this._getDB();
    if (db) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      const fallback = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
      delete fallback[id];
      localStorage.setItem(FALLBACK_PHOTOS_KEY, JSON.stringify(fallback));
    }
  }

  async clearAll() {
    saveGalleryIndex([]);
    localStorage.removeItem(FALLBACK_PHOTOS_KEY);
    const db = await this._getDB();
    if (db) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  async getStorageSummary() {
    const index = loadGalleryIndex();
    const totalBytes = index.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
    let quotaBytes = null;
    let usageBytes = totalBytes;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota || null;
        usageBytes = est.usage || totalBytes;
      } catch {
        // ignore
      }
    }
    return {
      count: index.length,
      photosBytes: totalBytes,
      usageBytes,
      quotaBytes,
    };
  }
}

export const photoStore = new PhotoStore();
