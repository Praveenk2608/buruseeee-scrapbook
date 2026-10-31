export interface WishVideo {
  id: string;
  friendName: string;
  caption: string;
  blob?: Blob;
  url: string;
  thumbnail?: string;
  duration: number;
  fileSize: number;
  fileName: string;
  fileType: string;
  createdAt: number;
  order: number;
}

const DB_NAME = 'BuruseBirthdayWishesDB';
const DB_VERSION = 1;
const STORE_NAME = 'wishes';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('order', 'order', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load all stored wish videos from IndexedDB and generate active object URLs
 */
export async function loadWishVideosFromDB(): Promise<WishVideo[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result as (WishVideo & { blob: Blob })[]) || [];
        const videos: WishVideo[] = records.map((rec) => {
          let objectUrl = '';
          if (rec.blob) {
            try {
              objectUrl = URL.createObjectURL(rec.blob);
            } catch (err) {
              console.warn('Could not create object URL for video', rec.id, err);
            }
          }
          return {
            ...rec,
            url: objectUrl || rec.url || '',
          };
        });

        videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        resolve(videos);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load videos from IndexedDB', err);
    return [];
  }
}

/**
 * Save or update a wish video in IndexedDB
 */
export async function saveWishVideoToDB(video: WishVideo, fileBlob?: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const recordToSave = {
      id: video.id,
      friendName: video.friendName,
      caption: video.caption,
      blob: fileBlob || video.blob,
      thumbnail: video.thumbnail || '',
      duration: video.duration || 0,
      fileSize: video.fileSize || 0,
      fileName: video.fileName || '',
      fileType: video.fileType || '',
      createdAt: video.createdAt || Date.now(),
      order: video.order ?? 0,
    };

    const request = store.put(recordToSave);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a wish video from IndexedDB
 */
export async function deleteWishVideoFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update orders of multiple videos in IndexedDB
 */
export async function updateVideosOrderInDB(videos: WishVideo[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    videos.forEach((vid, index) => {
      const getReq = store.get(vid.id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, order: index };
          store.put(updated);
        }
      };
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Update friend name or caption in IndexedDB
 */
export async function updateWishMetadataInDB(
  id: string,
  updates: Partial<Pick<WishVideo, 'friendName' | 'caption'>>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = {
          ...getReq.result,
          ...updates,
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Check storage estimate
 */
export async function getStorageEstimate(): Promise<{ usedMB: number; totalQuotaMB?: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usedMB = Math.round((est.usage || 0) / (1024 * 1024) * 10) / 10;
      const totalQuotaMB = est.quota ? Math.round(est.quota / (1024 * 1024)) : undefined;
      return { usedMB, totalQuotaMB };
    } catch {
      return { usedMB: 0 };
    }
  }
  return { usedMB: 0 };
}

/**
 * Generate video thumbnail and duration from a File
 */
export function extractVideoMeta(file: File): Promise<{ thumbnail: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to 1 second or 25% to capture an expressive frame
      const targetTime = Math.min(1.5, Math.max(0.5, video.duration * 0.25));
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = (480 / (video.videoWidth || 1)) * (video.videoHeight || 1) || 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
          const duration = video.duration || 0;
          cleanUp();
          resolve({ thumbnail, duration });
          return;
        }
      } catch (err) {
        console.warn('Thumbnail generation failed', err);
      }
      cleanUp();
      resolve({ thumbnail: '', duration: video.duration || 0 });
    };

    video.onerror = () => {
      cleanUp();
      resolve({ thumbnail: '', duration: 0 });
    };
  });
}
