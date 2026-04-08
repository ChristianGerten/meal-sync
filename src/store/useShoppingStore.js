import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  cacheItems,
  getCachedItems,
  updateCachedItem,
  addToSyncQueue
} from '../lib/offlineDB'
import { toast } from '../components/Toast'
import { deduplicateIngredients, normalizeIngredientName } from '../data/ingredientNormalizer'

const SUPERMARKET_ORDER = [
  'Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Milchprodukte',
  'Brot & Backwaren', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

const DRUGSTORE_CATEGORIES = [
  'Körperpflege', 'Haushalt', 'Gesundheit', 'Baby', 'Sonstiges (Drogerie)'
]

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

const BASIC_INGREDIENTS = [
  'salz', 'pfeffer', 'schwarzer pfeffer', 'weißer pfeffer', 'meersalz',
  'salz und pfeffer', 'pfefferkörner',
  'öl', 'olivenöl', 'sonnenblumenöl', 'rapsöl', 'pflanzenöl', 'speiseöl',
  'kokosöl', 'sesamöl', 'butter', 'margarine', 'schmalz',
  'essig', 'weißweinessig', 'rotweinessig', 'apfelessig', 'balsamico',
  'balsamicoessig',
  'zucker', 'brauner zucker', 'puderzucker', 'honig', 'ahornsirup',
  'vanillezucker', 'stevia',
  'mehl', 'weizenmehl', 'backpulver', 'natron', 'speisestärke', 'stärke',
  'hefe', 'trockenhefe',
  'paprika', 'paprikapulver', 'geräuchertes paprikapulver', 'edelsüß paprika',
  'kurkuma', 'curry', 'currypulver', 'cumin', 'kreuzkümmel',
  'zimt', 'zimt gemahlen', 'muskat', 'muskatnuss',
  'oregano', 'thymian', 'rosmarin', 'basilikum', 'petersilie',
  'koriander', 'lorbeer', 'lorbeerblatt', 'majoran',
  'chili', 'chilipulver', 'chiliflocken', 'cayennepfeffer',
  'knoblauchpulver', 'zwiebelpulver', 'ingwerpulver',
  'kümmel', 'nelken', 'kardamom', 'sternanis',
  'italienische kräuter', 'herbes de provence', 'ras el hanout',
  'wasser', 'mineralwasser',
  'senf', 'dijonsenf', 'mittelscharfer senf',
  'worcestersauce', 'worcestershire sauce', 'sojasauce',
  'tabasco', 'sriracha',
  'gelatine', 'agar agar', 'xanthan',
]

export const isBasicIngredient = (name) => {
  const lower = name.toLowerCase().trim()
  return BASIC_INGREDIENTS.some(b =>
    lower === b ||
    lower.startsWith(b + ' ') ||
    lower.endsWith(' ' + b)
  )
}

const normalizeCategory = (cat) => CATEGORY_MAP[cat] || cat || 'Sonstiges'

export const useShoppingStore = create((set, get) => ({
  list: null,
  drugList: null,
  items: [],
  drugstoreItems: [],
  loading: false,
  isOffline: false,

  fetchList: async (householdId, planId) => {
    set({ loading: true })
    const online = navigator.onLine

    if (!online) {
      const cachedItems = await getCachedItems()
      set({
        items: cachedItems.filter(i => i.store !== 'drugstore'),
        drugstoreItems: cachedItems.filter(i => i.store === 'drugstore'),
        loading: false,
        isOffline: true
      })
      return
    }

    try {
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

      let { data: drugList } = await supabase
        .from('shopping_lists')
        .select()
        .eq('household_id', householdId)
        .is('plan_id', null)
        .eq('name', 'Drogerie')
        .single()

      if (!drugList) {
        const { data } = await supabase
          .from('shopping_lists')
          .insert({ household_id: householdId, name: 'Drogerie' })
          .select()
          .single()
        drugList = data
      }

      const { data: drugItems } = await supabase
        .from('shopping_items')
        .select()
        .eq('list_id', drugList.id)
        .order('category')

      const allItems = [
        ...(items || []).map(i => ({ ...i, store: 'supermarket' })),
        ...(drugItems || []).map(i => ({ ...i, store: 'drugstore' }))
      ]
      await cacheItems(allItems)

      set({
        list,
        drugList,
        items: items || [],
        drugstoreItems: drugItems || [],
        loading: false,
        isOffline: false
      })
    } catch {
      const cachedItems = await getCachedItems()
      set({
        items: cachedItems.filter(i => i.store !== 'drugstore'),
        drugstoreItems: cachedItems.filter(i => i.store === 'drugstore'),
        loading: false,
        isOffline: true
      })
    }
  },

  generateFromPlan: async (entries, householdId, planId) => {
    const { list, items } = get()
    if (!list) return

    await supabase.from('shopping_items')
      .delete()
      .eq('list_id', list.id)
      .eq('is_manual', false)

    const manualNames = items
      .filter(i => i.is_manual)
      .map(i => normalizeIngredientName(i.name).toLowerCase())

    // Alle Zutaten sammeln
    const allIngredients = []
    entries.forEach(entry => {
      if (!entry.recipes?.ingredients) return
      const factor = (entry.servings || 2) / (entry.recipes.servings || 2)
      entry.recipes.ingredients.forEach(ing => {
        if (!ing.name?.trim()) return
        if (isBasicIngredient(ing.name)) return
        const normalizedName = normalizeIngredientName(ing.name)
        if (manualNames.includes(normalizedName.toLowerCase())) return
        allIngredients.push({
          name: normalizedName,
          amount: ing.amount != null
            ? Math.round(ing.amount * factor * 10) / 10
            : null,
          unit: ing.unit || null,
          category: normalizeCategory(ing.category),
          list_id: list.id,
          is_manual: false,
          store: 'supermarket'
        })
      })
    })

    // Deduplizieren + Mengen addieren
    const deduplicated = deduplicateIngredients(allIngredients)

    if (deduplicated.length > 0) {
      await supabase.from('shopping_items').insert(deduplicated)
    }

    const { data } = await supabase
      .from('shopping_items')
      .select()
      .eq('list_id', list.id)
      .order('category')

    const allItems = (data || []).map(i => ({ ...i, store: 'supermarket' }))
    await cacheItems(allItems)
    set({ items: data || [] })
  },

  addManualItem: async (name, amount, unit, category, store = 'supermarket') => {
    const { list, drugList, items, drugstoreItems } = get()
    const targetList = store === 'drugstore' ? drugList : list
    if (!targetList) return

    const normalizedName = normalizeIngredientName(name)

    const { data } = await supabase.from('shopping_items').insert({
      list_id: targetList.id,
      name: normalizedName,
      amount: amount || null,
      unit: unit || null,
      category: store === 'drugstore'
        ? (category || 'Körperpflege')
        : normalizeCategory(category || 'Sonstiges'),
      is_manual: true,
      store
    }).select().single()

    if (data) {
      await cacheItems([data])
      if (store === 'drugstore') {
        set({ drugstoreItems: [...drugstoreItems, data] })
      } else {
        set({ items: [...items, data] })
      }
    }
  },

  toggleItem: async (itemId, checked, store = 'supermarket') => {
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    set({
      [key]: get()[key].map(i =>
        i.id === itemId ? { ...i, is_checked: checked } : i
      )
    })
    await updateCachedItem(itemId, { is_checked: checked })

    if (navigator.onLine) {
      try {
        await supabase.from('shopping_items').update({
          is_checked: checked,
          checked_at: checked ? new Date().toISOString() : null
        }).eq('id', itemId)
      } catch {
        await addToSyncQueue({ action: 'toggle', item_id: itemId, is_checked: checked })
      }
    } else {
      await addToSyncQueue({ action: 'toggle', item_id: itemId, is_checked: checked })
    }
  },

  deleteItem: async (itemId, store = 'supermarket') => {
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    const item = get()[key].find(i => i.id === itemId)
    set({ [key]: get()[key].filter(i => i.id !== itemId) })

    if (navigator.onLine) {
      try {
        await supabase.from('shopping_items').delete().eq('id', itemId)
      } catch {
        await addToSyncQueue({ action: 'delete', item_id: itemId })
      }
    } else {
      await addToSyncQueue({ action: 'delete', item_id: itemId })
    }

    if (item?.is_manual) {
      toast.undo(item.name + ' entfernt', async () => {
        const { data } = await supabase.from('shopping_items').insert({
          list_id: item.list_id,
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          is_manual: true,
          store: item.store || store
        }).select().single()
        if (data) set({ [key]: [...get()[key], data] })
      })
    }
  },

  clearChecked: async (store = 'supermarket') => {
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    const checked = get()[key].filter(i => i.is_checked)
    set({ [key]: get()[key].filter(i => !i.is_checked) })

    for (const item of checked) {
      if (navigator.onLine) {
        try {
          await supabase.from('shopping_items').delete().eq('id', item.id)
        } catch {
          await addToSyncQueue({ action: 'delete', item_id: item.id })
        }
      } else {
        await addToSyncQueue({ action: 'delete', item_id: item.id })
      }
    }
  },

  getGroupedItems: (store = 'supermarket', showBasics = false) => {
    const items = store === 'drugstore'
      ? get().drugstoreItems
      : get().items.filter(i => showBasics || !isBasicIngredient(i.name))

    const ORDER = store === 'drugstore' ? DRUGSTORE_CATEGORIES : SUPERMARKET_ORDER

    const groups = {}
    items.forEach(item => {
      const cat = item.category || 'Sonstiges'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })

    return [
      ...ORDER.filter(cat => groups[cat]).map(cat => ({
        category: cat, items: groups[cat]
      })),
      ...Object.keys(groups)
        .filter(cat => !ORDER.includes(cat))
        .map(cat => ({ category: cat, items: groups[cat] }))
    ]
  },

  refreshItems: async () => {
    const { list, drugList } = get()
    if (list) {
      const { data } = await supabase
        .from('shopping_items').select()
        .eq('list_id', list.id).order('category')
      if (data) {
        await cacheItems(data.map(i => ({ ...i, store: 'supermarket' })))
        set({ items: data })
      }
    }
    if (drugList) {
      const { data } = await supabase
        .from('shopping_items').select()
        .eq('list_id', drugList.id).order('category')
      if (data) {
        await cacheItems(data.map(i => ({ ...i, store: 'drugstore' })))
        set({ drugstoreItems: data })
      }
    }
  }
}))