import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useShoppingStore } from '../store/useShoppingStore'

export function useShoppingRealtime(listId, drugListId) {
  const { refreshItems } = useShoppingStore()

  useEffect(() => {
    if (!listId && !drugListId) return

    const channel = supabase
      .channel('shopping-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: listId ? 'list_id=eq.' + listId : undefined
      }, () => {
        refreshItems()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: drugListId ? 'list_id=eq.' + drugListId : undefined
      }, () => {
        refreshItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, drugListId])
}