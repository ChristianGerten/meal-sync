import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { usePlanStore } from '../store/usePlanStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useShoppingStore } from '../store/useShoppingStore'

export function useRealtime(householdId) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!householdId) return

    // Alten Channel aufräumen
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('household-' + householdId)

      // Wochenplan Einträge
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meal_plan_entries'
      }, () => {
        usePlanStore.getState().refreshEntries()
      })

      // Einkaufsliste
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items'
      }, () => {
        useShoppingStore.getState().refreshItems()
      })

      // Rezepte
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recipes',
        filter: 'household_id=eq.' + householdId
      }, () => {
        useRecipeStore.getState().invalidateCache()
        useRecipeStore.getState().fetchRecipes(householdId, true)
      })

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime verbunden')
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime getrennt:', status)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [householdId])
}