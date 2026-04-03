import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const CATEGORIES_ORDER = [
  'Obst & Gemüse',
  'Fleisch & Fisch',
  'Kühlregal',
  'Milchprodukte',
  'Brot & Backwaren',
  'Nudeln',
  'Reis & Getreide',
  'Konserven',
  'Gewürze',
  'Backen',
  'Getränke',
  'Tiefkühl',
  'Sonstiges'
]

// Mapping alte Kategorien → neue Supermarkt-Gang Kategorien
const CATEGORY_MAP = {
  'Gemüse': 'Obst & Gemüse',
  'Obst': 'Obst & Gemüse',
  'Fleisch': 'Fleisch & Fisch',
  'Fisch': 'Fleisch & Fisch',
  'Milchprodukte': 'Milchprodukte',
  'Kühlregal': 'Kühlregal',
  'Nudeln': 'Nudeln',
  'Reis & Getreide': 'Reis & Getreide',
  'Konserven': 'Konserven',
  'Gewürze': 'Gewürze',
  'Backen': 'Backen',
  'Getränke': 'Getränke',
  'Tiefkühl': 'Tiefkühl',
  'Sonstiges': 'Sonstiges'
}

const normalizeCategory = (cat) => CATEGORY_MAP[cat] || cat || 'Sonstiges'

const BASIC_INGREDIENTS = [
  'salz', 'pfeffer', 'zucker', 'wasser', 'öl', 'olivenöl',
  'butter', 'mehl', 'essig', 'backpulver', 'natron',
  'speisestärke', 'senf', 'schwarzer pfeffer', 'weißer pfeffer',
  'salz und pfeffer', 'speiseöl', 'sonnenblumenöl', 'rapsöl',
  'pflanzenöl', 'margarine'
]

export const isBasicIngredient = (name) =>
  BASIC_INGREDIENTS.some(b =>
    name.toLowerCase().trim() === b ||
    name.toLowerCase().trim().startsWith(b + ' ')
  )

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

    await supabase.from('shopping_items')
      .delete()
      .eq('list_id', list.id)
      .eq('is_manual', false)

    // Zutaten zusammenfassen mit Portions-Skalierung
    const itemMap = {}
    entries.forEach(entry => {
      if (!entry.recipes?.ingredients) return
      const factor = (entry.servings || 2) / (entry.recipes.servings || 2)
      entry.recipes.ingredients?.forEach(ing => {
        if (!ing.name?.trim()) return
        const key = `${ing.name.toLowerCase().trim()}__${ing.unit || ''}`
        if (itemMap[key]) {
          itemMap[key].amount = itemMap[key].amount != null && ing.amount != null
            ? Math.round((itemMap[key].amount + ing.amount * factor) * 10) / 10
            : itemMap[key].amount
          // Gerichte merken für Zusammenfassung
          if (!itemMap[key].sources.includes(entry.recipes.name)) {
            itemMap[key].sources.push(entry.recipes.name)
          }
        } else {
          itemMap[key] = {
            list_id: list.id,
            name: ing.name.trim(),
            amount: ing.amount != null ? Math.round(ing.amount * factor * 10) / 10 : null,
            unit: ing.unit || null,
            category: normalizeCategory(ing.category),
            is_manual: false,
            sources: [entry.recipes.name]
          }
        }
      })
    })

    const newItems = Object.values(itemMap).map(({ sources, ...item }) => item)
    if (newItems.length > 0) {
      await supabase.from('shopping_items').insert(newItems)
    }

    await get().fetchList(householdId, get().list?.plan_id)
  },

  addManualItem: async (name, amount, unit, category) => {
    const { list, items } = get()
    const { data } = await supabase.from('shopping_items').insert({
      list_id: list.id,
      name, amount: amount || null,
      unit: unit || null,
      category: normalizeCategory(category || 'Sonstiges'),
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

  getGroupedItems: (showBasics = false) => {
    const items = get().items.filter(i =>
      showBasics || !isBasicIngredient(i.name)
    )
    const groups = {}
    items.forEach(item => {
      const cat = normalizeCategory(item.category || 'Sonstiges')
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    // Nach Supermarkt-Gang sortieren
    return [
      ...CATEGORIES_ORDER.filter(cat => groups[cat]).map(cat => ({
        category: cat,
        items: groups[cat]
      })),
      ...Object.keys(groups)
        .filter(cat => !CATEGORIES_ORDER.includes(cat))
        .map(cat => ({ category: cat, items: groups[cat] }))
    ]
  },

  refreshItems: async () => {
    const { list } = get()
    if (!list) return
    const { data } = await supabase
      .from('shopping_items').select()
      .eq('list_id', list.id).order('category')
    set({ items: data || [] })
  }
}))