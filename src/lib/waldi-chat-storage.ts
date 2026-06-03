export type StoredWaldiChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  scope?: 'in_scope' | 'out_of_scope'
  disclaimer?: string | null
}

type StoredWaldiChatThread = {
  sheetId: string
  messages: StoredWaldiChatMessage[]
  conversationSummary: string | null
  updatedAt: string
}

const DB_NAME = 'waldas-watch-waldi-chat'
const STORE_NAME = 'threads'
const DB_VERSION = 1

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openWaldiChatDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sheetId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getWaldiChatMessages(
  sheetId: string,
): Promise<StoredWaldiChatMessage[]> {
  const thread = await getWaldiChatThread(sheetId)
  return thread.messages
}

export async function getWaldiChatThread(
  sheetId: string,
): Promise<{
  messages: StoredWaldiChatMessage[]
  conversationSummary: string | null
}> {
  if (!hasIndexedDb()) {
    return { messages: [], conversationSummary: null }
  }

  const db = await openWaldiChatDb()
  try {
    return await new Promise<{
      messages: StoredWaldiChatMessage[]
      conversationSummary: string | null
    }>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(sheetId)

      request.onsuccess = () => {
        const thread = request.result as StoredWaldiChatThread | undefined
        resolve({
          messages: thread?.messages ?? [],
          conversationSummary: thread?.conversationSummary ?? null,
        })
      }
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export async function saveWaldiChatMessages(
  sheetId: string,
  messages: StoredWaldiChatMessage[],
  conversationSummary: string | null = null,
): Promise<void> {
  if (!hasIndexedDb()) return

  const db = await openWaldiChatDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const thread: StoredWaldiChatThread = {
        sheetId,
        messages,
        conversationSummary,
        updatedAt: new Date().toISOString(),
      }

      const request = store.put(thread)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export async function clearWaldiChatMessages(sheetId: string): Promise<void> {
  if (!hasIndexedDb()) return

  const db = await openWaldiChatDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(sheetId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}
