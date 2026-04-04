import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  cacheItems,
  getCachedItems,
  updateCachedItem,
  addToSyncQueue
} from '../lib/offlineDB'

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
      // Offline: aus IndexedDB laden
      const cachedItems = await getCachedItems()
      const superItems = cachedItems.filter(i => i.store === 'supermarket' || !i.store)
      const drugItems = cachedItems.filter(i => i.store === 'drugstore')
      set({
        items: superItems,
        drugstoreItems: drugItems,
        loading: false,
        isOffline: true
      })
      return
    }

    // Online: von Supabase laden
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

      const allItems = [...(items || []), ...(drugItems || [])]

      // In IndexedDB cachen für Offline-Nutzung
      await cacheItems(allItems.map(i => ({
        ...i,
        store: drugItems?.find(d => d.id === i.id) ? 'drugstore' : 'supermarket'
      })))

      set({
        list,
        drugList,
        items: items || [],
        drugstoreItems: drugItems || [],
        loading: false,
        isOffline: false
      })
    } catch (err) {
      // Fallback auf Cache
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
      .map(i => i.name.toLowerCase().trim())

    const itemMap = {}
    entries.forEach(entry => {
      if (!entry.recipes?.ingredients) return
      const factor = (entry.servings || 2) / (entry.recipes.servings || 2)
      entry.recipes.ingredients?.forEach(ing => {
        if (!ing.name?.trim()) return
        if (isBasicIngredient(ing.name)) return
        if (manualNames.includes(ing.name.toLowerCase().trim())) return

        const key = ing.name.toLowerCase().trim() + '__' + (ing.unit || '')
        if (itemMap[key]) {
          itemMap[key].amount = itemMap[key].amount != null && ing.amount != null
            ? Math.round((itemMap[key].amount + ing.amount * factor) * 10) / 10
            : itemMap[key].amount
        } else {
          itemMap[key] = {
            list_id: list.id,
            name: ing.name.trim(),
            amount: ing.amount != null ? Math.round(ing.amount * factor * 10) / 10 : null,
            unit: ing.unit || null,
            category: normalizeCategory(ing.category),
            is_manual: false,
            store: 'supermarket'
          }
        }
      })
    })

    const newItems = Object.values(itemMap)
    if (newItems.length > 0) {
      await supabase.from('shopping_items').insert(newItems)
    }

    const { data } = await supabase
      .from('shopping_items')
      .select()
      .eq('list_id', list.id)
      .order('category')

    const allItems = data || []
    await cacheItems(allItems.map(i => ({ ...i, store: 'supermarket' })))
    set({ items: allItems })
  },

  addManualItem: async (name, amount, unit, category, store = 'supermarket') => {
    const { list, drugList, items, drugstoreItems } = get()
    const targetList = store === 'drugstore' ? drugList : list
    if (!targetList) return

    const { data } = await supabase.from('shopping_items').insert({
      list_id: targetList.id,
      name, amount: amount || null,
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

  // Offline-fähiges Abhaken
  toggleItem: async (itemId, checked, store = 'supermarket') => {
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'

    // 1. Sofort im UI und IndexedDB updaten (optimistic)
    set({
      [key]: get()[key].map(i =>
        i.id === itemId ? { ...i, is_checked: checked } : i
      )
    })
    await updateCachedItem(itemId, { is_checked: checked })

    if (navigator.onLine) {
      // 2a. Online: direkt zu Supabase
      try {
        await supabase
          .from('shopping_items')
          .update({
            is_checked: checked,
            checked_at: checked ? new Date().toISOString() : null
          })
          .eq('id', itemId)
      } catch (err) {
        // Supabase fehlgeschlagen → zur Queue
        await addToSyncQueue({
          action: 'toggle',
          item_id: itemId,
          is_checked: checked
        })
      }
    } else {
      // 2b. Offline: zur Sync-Queue
      await addToSyncQueue({
        action: 'toggle',
        item_id: itemId,
        is_checked: checked
      })
    }
  },

  deleteItem: async (itemId, store = 'supermarket') => {
  const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
  const item = get()[key].find(i => i.id === itemId)

  // Optimistic Update
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

  // Undo nur für manuelle Artikel
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
      if (data) {
        set({ [key]: [...get()[key], data] })
      }
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