import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOnlineStatus } from './use-online-status'
import {
  getQueue,
  removeOperation,
  incrementRetry,
  resetRetries,
  MAX_RETRIES,
  QUEUE_CHANGED_EVENT,
  type QueuedOperation,
} from '@/lib/offline-queue'
import { createSheetTransaction, updateSheetTransaction } from '@/lib/transaction-form-requests'
import { deleteTransaction } from '@/lib/transactions-requests'
import { createCategory, updateCategory, deleteCategory } from '@/lib/categories-requests'
import { createPaymentType, updatePaymentType, deletePaymentType } from '@/lib/payment-types-requests'
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/lib/recurring-transactions-requests'
import { updateSheet } from '@/lib/sheets-requests'
import { updateSheetCurrency } from '@/lib/sheet-settings-requests'

export type QueueReplayState = {
  isSyncing: boolean
  queuedCount: number
  failedCount: number
  retryFailed: () => void
}

async function executeOperation(op: QueuedOperation): Promise<void> {
  switch (op.type) {
    case 'CREATE_TRANSACTION':
      return createSheetTransaction(op.payload)
    case 'UPDATE_TRANSACTION':
      return updateSheetTransaction(op.payload.transactionId, op.payload.input)
    case 'DELETE_TRANSACTION':
      return deleteTransaction(op.payload.transactionId)
    case 'CREATE_CATEGORY':
      return createCategory(op.payload)
    case 'UPDATE_CATEGORY':
      return updateCategory(op.payload.categoryId, op.payload.input)
    case 'DELETE_CATEGORY':
      return deleteCategory(op.payload.categoryId)
    case 'CREATE_PAYMENT_TYPE':
      return createPaymentType(op.payload)
    case 'UPDATE_PAYMENT_TYPE':
      return updatePaymentType(op.payload.paymentTypeId, op.payload.input)
    case 'DELETE_PAYMENT_TYPE':
      return deletePaymentType(op.payload.paymentTypeId)
    case 'CREATE_RECURRING_TRANSACTION':
      return createRecurringTransaction(op.payload)
    case 'UPDATE_RECURRING_TRANSACTION':
      return updateRecurringTransaction(op.payload.recurringId, op.payload.input)
    case 'DELETE_RECURRING_TRANSACTION':
      return deleteRecurringTransaction(op.payload.recurringId)
    case 'UPDATE_SHEET':
      return updateSheet(op.payload.sheetId, op.payload.input)
    case 'UPDATE_SHEET_CURRENCY':
      return updateSheetCurrency(op.payload.sheetId, op.payload.currency, op.payload.updatedBy)
  }
}

function getInvalidationKeys(op: QueuedOperation): string[][] {
  switch (op.type) {
    case 'CREATE_TRANSACTION': {
      const { sheetId } = op.payload
      return [
        ['recent-sheet-transactions', sheetId],
        ['current-month-sheet-totals', sheetId],
        ['current-month-sheet-category-totals', sheetId],
        ['sheet-transaction-overview', sheetId],
      ]
    }
    case 'UPDATE_TRANSACTION': {
      const { transactionId, sheetId, categoryId } = op.payload
      return [
        ['transaction', transactionId],
        ['category-transactions', sheetId, categoryId],
        ['sheet-transaction-overview', sheetId],
        ['recent-sheet-transactions', sheetId],
        ['current-month-sheet-totals', sheetId],
        ['current-month-sheet-category-totals', sheetId],
      ]
    }
    case 'DELETE_TRANSACTION': {
      const { transactionId, sheetId, categoryId } = op.payload
      return [
        ['transaction', transactionId],
        ['category-transactions', sheetId, categoryId],
        ['sheet-transaction-overview', sheetId],
        ['recent-sheet-transactions', sheetId],
        ['current-month-sheet-totals', sheetId],
        ['current-month-sheet-category-totals', sheetId],
      ]
    }
    case 'CREATE_CATEGORY':
    case 'UPDATE_CATEGORY': {
      const { sheetId } = op.payload
      return [
        ['sheet-categories', sheetId],
        ['sheet-transaction-categories', sheetId],
      ]
    }
    case 'DELETE_CATEGORY': {
      const { categoryId, sheetId } = op.payload
      return [
        ['sheet-categories', sheetId],
        ['sheet-transaction-categories', sheetId],
        ['category-transactions', sheetId, categoryId],
        ['recent-sheet-transactions', sheetId],
        ['sheet-transaction-overview', sheetId],
        ['current-month-sheet-totals', sheetId],
        ['current-month-sheet-category-totals', sheetId],
      ]
    }
    case 'CREATE_PAYMENT_TYPE':
    case 'UPDATE_PAYMENT_TYPE':
    case 'DELETE_PAYMENT_TYPE': {
      const { sheetId } = op.payload
      return [['sheet-payment-types', sheetId]]
    }
    case 'CREATE_RECURRING_TRANSACTION':
    case 'UPDATE_RECURRING_TRANSACTION':
    case 'DELETE_RECURRING_TRANSACTION': {
      const sheetId =
        op.type === 'CREATE_RECURRING_TRANSACTION' ? op.payload.sheetId : op.payload.sheetId
      return [['sheet-recurring-transactions', sheetId]]
    }
    case 'UPDATE_SHEET': {
      const { userId } = op.payload
      return [['user-sheets', userId]]
    }
    case 'UPDATE_SHEET_CURRENCY': {
      const { sheetId } = op.payload
      return [['sheet-currency', sheetId]]
    }
  }
}

function computeCounts() {
  const queue = getQueue()
  return {
    queuedCount: queue.length,
    failedCount: queue.filter((op) => op.retries >= MAX_RETRIES).length,
  }
}

export function useOfflineQueueReplay(): QueueReplayState {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [counts, setCounts] = useState(computeCounts)
  const isReplayingRef = useRef(false)

  const refreshCounts = () => setCounts(computeCounts())

  const replayQueue = async () => {
    if (isReplayingRef.current) return
    const pending = getQueue().filter((op) => op.retries < MAX_RETRIES)
    if (pending.length === 0) return

    isReplayingRef.current = true
    setIsSyncing(true)

    for (const op of pending) {
      try {
        await executeOperation(op)
        removeOperation(op.id)
        for (const queryKey of getInvalidationKeys(op)) {
          queryClient.invalidateQueries({ queryKey })
        }
      } catch {
        incrementRetry(op.id)
      }
    }

    isReplayingRef.current = false
    setIsSyncing(false)
    refreshCounts()
  }

  useEffect(() => {
    if (isOnline) void replayQueue()
    else refreshCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  useEffect(() => {
    const handler = () => refreshCounts()
    window.addEventListener(QUEUE_CHANGED_EVENT, handler)
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, handler)
  }, [])

  const retryFailed = () => {
    const failed = getQueue().filter((op) => op.retries >= MAX_RETRIES)
    for (const op of failed) resetRetries(op.id)
    void replayQueue()
  }

  return { isSyncing, queuedCount: counts.queuedCount, failedCount: counts.failedCount, retryFailed }
}
