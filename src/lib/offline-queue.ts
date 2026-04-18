import type { CreateSheetTransactionInput, UpdateSheetTransactionInput } from './transaction-form-requests'
import type { CreateCategoryInput, UpdateCategoryInput } from './categories-requests'
import type { CreatePaymentTypeInput, UpdatePaymentTypeInput } from './payment-types-requests'
import type { CreateRecurringTransactionInput, UpdateRecurringTransactionInput } from './recurring-transactions-requests'
import type { UpdateSheetInput } from './sheets-requests'

export const QUEUE_CHANGED_EVENT = 'waldas-watch:queue-changed'

export const MAX_RETRIES = 3

const QUEUE_KEY = 'waldas-watch-offline-queue'

export type QueuedOperation =
  // Transactions
  | {
      id: string
      type: 'CREATE_TRANSACTION'
      payload: CreateSheetTransactionInput
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'UPDATE_TRANSACTION'
      payload: { transactionId: string; sheetId: string; categoryId: string; input: UpdateSheetTransactionInput }
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'DELETE_TRANSACTION'
      payload: { transactionId: string; sheetId: string; categoryId: string }
      timestamp: number
      retries: number
    }
  // Categories
  | {
      id: string
      type: 'CREATE_CATEGORY'
      payload: CreateCategoryInput
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'UPDATE_CATEGORY'
      payload: { categoryId: string; sheetId: string; input: UpdateCategoryInput }
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'DELETE_CATEGORY'
      payload: { categoryId: string; sheetId: string }
      timestamp: number
      retries: number
    }
  // Payment types
  | {
      id: string
      type: 'CREATE_PAYMENT_TYPE'
      payload: CreatePaymentTypeInput
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'UPDATE_PAYMENT_TYPE'
      payload: { paymentTypeId: string; sheetId: string; input: UpdatePaymentTypeInput }
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'DELETE_PAYMENT_TYPE'
      payload: { paymentTypeId: string; sheetId: string }
      timestamp: number
      retries: number
    }
  // Recurring transactions
  | {
      id: string
      type: 'CREATE_RECURRING_TRANSACTION'
      payload: CreateRecurringTransactionInput
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'UPDATE_RECURRING_TRANSACTION'
      payload: { recurringId: string; sheetId: string; input: UpdateRecurringTransactionInput }
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'DELETE_RECURRING_TRANSACTION'
      payload: { recurringId: string; sheetId: string }
      timestamp: number
      retries: number
    }
  // Sheet settings
  | {
      id: string
      type: 'UPDATE_SHEET'
      payload: { sheetId: string; userId: string; input: UpdateSheetInput }
      timestamp: number
      retries: number
    }
  | {
      id: string
      type: 'UPDATE_SHEET_CURRENCY'
      payload: { sheetId: string; currency: string; updatedBy: string }
      timestamp: number
      retries: number
    }

export function getQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as QueuedOperation[]
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedOperation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT))
}

export function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): QueuedOperation {
  const entry = {
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  } as QueuedOperation
  saveQueue([...getQueue(), entry])
  return entry
}

export function removeOperation(id: string): void {
  saveQueue(getQueue().filter((op) => op.id !== id))
}

export function incrementRetry(id: string): void {
  saveQueue(getQueue().map((op) => (op.id === id ? { ...op, retries: op.retries + 1 } : op)))
}

export function resetRetries(id: string): void {
  saveQueue(getQueue().map((op) => (op.id === id ? { ...op, retries: 0 } : op)))
}
