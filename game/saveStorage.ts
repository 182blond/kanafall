export interface DurableSave {
  raw: string
  savedAt: number
}

const DB_NAME = 'kanafall-progress'
const STORE_NAME = 'saves'
const LATEST_KEY = 'latest'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readDurableSave(): Promise<DurableSave | undefined> {
  if (typeof indexedDB === 'undefined') return
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(LATEST_KEY)
      request.onsuccess = () => resolve(request.result as DurableSave | undefined)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export async function writeDurableSave(value: DurableSave): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(value, LATEST_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}
