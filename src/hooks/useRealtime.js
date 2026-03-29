import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { usePlanStore } from '../store/usePlanStore'
import { useShoppingStore } from '../store/useShoppingStore'

export const useRealtime = (householdId) => {
  const refreshEntries = usePlanStore(s => s.refreshEntries)
  const refreshItems = useShoppingStore(s => s.refreshItems)

  useEffect(() => {
    if (!householdId) return

    const channel = supabase
      .channel(`household-${householdId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meal_plan_entries'
      }, () => refreshEntries())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items'
      }, () => refreshItems())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId])
}