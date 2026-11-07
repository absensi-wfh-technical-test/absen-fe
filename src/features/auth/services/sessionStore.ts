export interface StoredSession {
  version: 1
  token: string
  expiresAt: number
  privateKey: CryptoKey
  publicKey: CryptoKey
  publicKeyHeader: string
}

export class InvalidSessionError extends Error {}

const DATABASE = 'absensi-wfh-auth'
const STORE = 'session'
const ACTIVE = 'active'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Penyimpanan browser tidak tersedia.'))
      return
    }
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Penyimpanan browser sedang digunakan tab lain.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    let value: T
    try {
      const transaction = database.transaction(STORE, mode)
      const request = operation(transaction.objectStore(STORE))
      request.onsuccess = () => {
        value = request.result
      }
      transaction.oncomplete = () => {
        database.close()
        resolve(value)
      }
      transaction.onerror = () => {
        database.close()
        reject(transaction.error)
      }
      transaction.onabort = () => {
        database.close()
        reject(transaction.error)
      }
    } catch (error) {
      database.close()
      reject(error)
    }
  })
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<StoredSession>
  return (
    record.version === 1 &&
    typeof record.token === 'string' &&
    record.token.length > 0 &&
    typeof record.expiresAt === 'number' &&
    Number.isFinite(record.expiresAt) &&
    typeof record.publicKeyHeader === 'string' &&
    record.publicKeyHeader.length > 0 &&
    record.privateKey?.type === 'private' &&
    record.privateKey.extractable === false &&
    record.publicKey?.type === 'public'
  )
}

export async function loadSession(): Promise<StoredSession | null> {
  const value = await withStore('readonly', (store) => store.get(ACTIVE))
  if (value === undefined) return null
  if (!isStoredSession(value)) {
    await clearSession()
    throw new InvalidSessionError('Record sesi tidak lengkap.')
  }
  return value
}

export function saveSession(session: StoredSession): Promise<IDBValidKey> {
  return withStore('readwrite', (store) => store.put(session, ACTIVE))
}

export function clearSession(): Promise<undefined> {
  return withStore('readwrite', (store) => store.delete(ACTIVE))
}
