import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue
} from '../lib/offlineDB'
import { useShoppingStore } from '../store/useShoppingStore'

export function useOfflineSync() {
  const isSyncing = useRef(false)
  const { refreshItems } = useShoppingStore()

  const processQueue = useCallback(async () => {
    if (isSyncing.current) return
    isSyncing.current = true

    try {
      const queue = await getSyncQueue()
      if (!queue.length) return

      console.log('Sync Queue verarbeiten:', queue.length, 'Einträge')

      for (const entry of queue) {
        try {
          if (entry.action === 'toggle') {
            await supabase
              .from('shopping_items')
              .update({
                is_checked: entry.is_checked,
                checked_at: entry.is_checked ? new Date().toISOString() : null
              })
              .eq('id', entry.item_id)
          } else if (entry.action === 'delete') {
            await supabase
              .from('shopping_items')
              .delete()
              .eq('id', entry.item_id)
          }
          await removeFromSyncQueue(entry.id)
        } catch (err) {
          console.warn('Sync fehlgeschlagen für Eintrag:', entry.id, err)
        }
      }

      // Nach Sync UI aktualisieren
      await refreshItems()

    } finally {
      isSyncing.current = false
    }
  }, [refreshItems])

  useEffect(() => {
    // Beim Start sofort versuchen zu synchronisieren
    if (navigator.onLine) {
      processQueue()
    }

    // Wenn wieder online → Queue verarbeiten
    const handleOnline = () => {
      console.log('Wieder online — synchronisiere...')
      processQueue()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [processQueue])

  return { processQueue }
}