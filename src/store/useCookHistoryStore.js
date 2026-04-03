import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCookHistoryStore = create((set, get) => ({
  history: [],
  loading: false,

  fetchHistory: async (householdId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('cook_history')
      .select('*, recipes(id, name, image_url, category)')
      .eq('household_id', householdId)
      .order('cooked_at', { ascending: false })
      .limit(100)
    set({ history: data || [], loading: false })
  },

  addEntry: async (householdId, recipeId, recipeName, servings = 2, notes = '') => {
    const { data } = await supabase
      .from('cook_history')
      .insert({
        household_id: householdId,
        recipe_id: recipeId || null,
        recipe_name: recipeName,
        servings,
        notes: notes || null
      })
      .select('*, recipes(id, name, image_url, category)')
      .single()
    set({ history: [data, ...get().history] })
  },

  deleteEntry: async (id) => {
    await supabase.from('cook_history').delete().eq('id', id)
    set({ history: get().history.filter(h => h.id !== id) })
  },

  getStats: () => {
    const history = get().history
    if (!history.length) return null

    // Häufigstes Gericht
    const counts = {}
    history.forEach(h => {
      const key = h.recipe_name
      counts[key] = (counts[key] || 0) + 1
    })
    const mostCooked = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0]

    // Diese Woche
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeek = history.filter(h => new Date(h.cooked_at) > weekAgo).length

    return {
      total: history.length,
      mostCooked: mostCooked ? { name: mostCooked[0], count: mostCooked[1] } : null,
      thisWeek,
      uniqueRecipes: Object.keys(counts).length
    }
  }
}))