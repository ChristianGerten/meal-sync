import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const CATEGORIES_ORDER = [
  'Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Kühlregal',
  'Milchprodukte', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

export const useShoppingStore = create((set, get) => ({
  list: null,
  items: [],
  loading: false,

  fetchList: async (householdId, planId) => {
    set({ loading: true })
    let { data: list } = await supabase
      .from('shopping_lists')
      .select()
      .eq('household_id', householdId)
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!list) {
      const { data } = await supabase
        .from('shopping_lists')
        .insert({ household_id: householdId, plan_id: planId })
        .select()
        .single()
      list = data
    }

    const { data: items } = await supabase
      .from('shopping_items')
      .select()
      .eq('list_id', list.id)
      .order('category')

    set({ list, items: items || [], loading: false })
  },

  generateFromPlan: async (entries, householdId, planId) => {
    const { list } = get()
    if (!list) return

    // Nur auto-generierte Items löschen, manuelle behalten
    await supabase.from('shopping_items')
      .delete()
      .eq('list_id', list.id)
      .eq('is_manual', false)

    // Zutaten zusammenfassen
    const itemMap = {}
    entries.forEach(entry => {
      if (!entry.recipes?.ingredients) return
      const factor = (entry.servings || 2) / (entry.recipes.servings || 2)
      entry.recipes.ingredients?.forEach(ing => {
        const key = `${ing.name.toLowerCase()}__${ing.unit || ''}`
        if (itemMap[key]) {
          itemMap[key].amount = (itemMap[key].amount || 0) + (ing.amount || 0) * factor
        } else {
          itemMap[key] = {
            list_id: list.id,
            name: ing.name,
            amount: ing.amount ? ing.amount * factor : null,
            unit: ing.unit || null,
            category: ing.category || 'Sonstiges',
            is_manual: false
          }
        }
      })
    })

    const newItems = Object.values(itemMap)
    if (newItems.length > 0) {
      await supabase.from('shopping_items').insert(newItems)
    }

    await get().fetchList(householdId, get().list?.plan_id)
  },

  addManualItem: async (name, amount, unit, category) => {
    const { list, items } = get()
    const { data } = await supabase.from('shopping_items').insert({
      list_id: list.id,
      name, amount: amount || null, unit: unit || null,
      category: category || 'Sonstiges',
      is_manual: true
    }).select().single()
    set({ items: [...items, data] })
  },

  toggleItem: async (itemId, checked) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('shopping_items').update({
      is_checked: checked,
      checked_by: checked ? user.id : null,
      checked_at: checked ? new Date().toISOString() : null
    }).eq('id', itemId)
    set({
      items: get().items.map(i =>
        i.id === itemId ? { ...i, is_checked: checked } : i
      )
    })
  },

  deleteItem: async (itemId) => {
    await supabase.from('shopping_items').delete().eq('id', itemId)
    set({ items: get().items.filter(i => i.id !== itemId) })
  },

  getGroupedItems: () => {
    const items = get().items
    const groups = {}
    items.forEach(item => {
      const cat = item.category || 'Sonstiges'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    // Nach definierter Reihenfolge sortieren
    return CATEGORIES_ORDER
      .filter(cat => groups[cat])
      .map(cat => ({ category: cat, items: groups[cat] }))
      .concat(
        Object.keys(groups)
          .filter(cat => !CATEGORIES_ORDER.includes(cat))
          .map(cat => ({ category: cat, items: groups[cat] }))
      )
  },

  refreshItems: async () => {
    const { list } = get()
    if (!list) return
    const { data } = await supabase
      .from('shopping_items').select().eq('list_id', list.id).order('category')
    set({ items: data || [] })
  }
}))