const DB_NAME    = 'spatial-recon-db'
const DB_VERSION = 1
const STORE_NAME = 'frames'

export const STORE = STORE_NAME

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        })
        store.createIndex('sessionId',   'sessionId',   { unique: false })
        store.createIndex('timestamp',   'timestamp',   { unique: false })
        store.createIndex('frameNumber', 'frameNumber', { unique: false })
      }
    }
  })
}
