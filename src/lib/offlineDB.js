const DB_NAME = 'mealsync-offline'
const DB_VERSION = 1

let db = null

const openDB = () => new Promise((resolve, reject) => {
  if (db) return resolve(db)

  const request = indexedDB.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = (e) => {
    const database = e.target.result

    // Gecachte Items
    if (!database.objectStoreNames.contains('shopping_items')) {
      database.createObjectStore('shopping_items', { keyPath: 'id' })
    }

    // Pending Sync Queue
    if (!database.objectStoreNames.contains('sync_queue')) {
      const store = database.createObjectStore('sync_queue', {
        keyPath: 'id', autoIncrement: true
      })
      store.createIndex('created_at', 'created_at')
    }
  }

  request.onsuccess = (e) => {
    db = e.target.result
    resolve(db)
  }

  request.onerror = () => reject(request.error)
})

// Items cachen
export const cacheItems = async (items) => {
  const database = await openDB()
  const tx = database.transaction('shopping_items', 'readwrite')
  const store = tx.objectStore('shopping_items')
  for (const item of items) {
    store.put(item)
  }
  return new Promise((res, rej) => {
    tx.oncomplete = res
    tx.onerror = rej
  })
}

// Gecachte Items laden
export const getCachedItems = async (listId) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('shopping_items', 'readonly')
    const store = tx.objectStore('shopping_items')
    const request = store.getAll()
    request.onsuccess = () => {
      const all = request.result || []
      resolve(listId ? all.filter(i => i.list_id === listId) : all)
    }
    request.onerror = () => reject(request.error)
  })
}

// Item lokal updaten
export const updateCachedItem = async (id, changes) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('shopping_items', 'readwrite')
    const store = tx.objectStore('shopping_items')
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result
      if (item) {
        store.put({ ...item, ...changes })
      }
      tx.oncomplete = resolve
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

// Zur Sync-Queue hinzufügen
export const addToSyncQueue = async (action) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readwrite')
    const store = tx.objectStore('sync_queue')
    store.add({ ...action, created_at: Date.now() })
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

// Sync-Queue laden
export const getSyncQueue = async () => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readonly')
    const store = tx.objectStore('sync_queue')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// Eintrag aus Queue löschen
export const removeFromSyncQueue = async (id) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readwrite')
    const store = tx.objectStore('sync_queue')
    store.delete(id)
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

// Komplette Queue löschen
export const clearSyncQueue = async () => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readwrite')
    tx.objectStore('sync_queue').clear()
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}