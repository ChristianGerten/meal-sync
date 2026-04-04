import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const SUPERMARKET_ORDER = [
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

const DRUGSTORE_CATEGORIES = [
  'Körperpflege',
  'Haushalt',
  'Gesundheit',
  'Baby',
  'Sonstiges (Drogerie)'
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

// Erweiterte Basisliste — Gewürze, Öle, Hilfsmittel
const BASIC_INGREDIENTS = [
  // Salz & Pfeffer
  'salz', 'pfeffer', 'schwarzer pfeffer', 'weißer pfeffer', 'meersalz',
  'salz und pfeffer', 'pfefferkörner',
  // Öle & Fette
  'öl', 'olivenöl', 'sonnenblumenöl', 'rapsöl', 'pflanzenöl', 'speiseöl',
  'kokosöl', 'sesamöl', 'butter', 'margarine', 'schmalz',
  // Essig
  'essig', 'weißweinessig', 'rotweinessig', 'apfelessig', 'balsamico',
  'balsamicoessig',
  // Zucker & Süßungsmittel
  'zucker', 'brauner zucker', 'puderzucker', 'honig', 'ahornsirup',
  'vanillezucker', 'stevia',
  // Mehl & Backhilfsmittel
  'mehl', 'weizenmehl', 'backpulver', 'natron', 'speisestärke', 'stärke',
  'hefe', 'trockenhefe',
  // Gewürze allgemein
  'paprika', 'paprikapulver', 'geräuchertes paprikapulver', 'edelsüß paprika',
  'kurkuma', 'curry', 'currypulver', 'cumin', 'kreuzkümmel',
  'zimt', 'zimt gemahlen', 'muskat', 'muskatnuss',
  'oregano', 'thymian', 'rosmarin', 'basilikum', 'petersilie',
  'koriander', 'lorbeer', 'lorbeerblatt', 'majoran',
  'chili', 'chilipulver', 'chiliflocken', 'cayennepfeffer',
  'knoblauchpulver', 'zwiebelpulver', 'ingwerpulver',
  'kümmel', 'nelken', 'kardamom', 'sternanis',
  'italienische kräuter', 'herbes de provence', 'ras el hanout',
  // Wasser
  'wasser', 'mineralwasser',
  // Senf & Saucen
  'senf', 'dijonsenf', 'mittelscharfer senf',
  'worcestersauce', 'worcestershire sauce', 'sojasauce',
  'tabasco', 'sriracha',
  // Sonstiges
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
  items: [],
  drugstoreItems: [],
  loading: false,

  fetchList: async (householdId, planId) => {
    set({ loading: true })

    // Supermarkt Liste
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
      .eq('store', 'supermarket')
      .order('category')

    // Drogerie Liste — ohne plan_id
    let { data: drugList } = await supabase
      .from('shopping_lists')
      .select()
      .eq('household_id', householdId)
      .eq('plan_id', null)
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

    set({
      list,
      drugList,
      items: items || [],
      drugstoreItems: drugItems || [],
      loading: false
    })
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

    set({ items: data || [] })
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

    if (store === 'drugstore') {
      set({ drugstoreItems: [...drugstoreItems, data] })
    } else {
      set({ items: [...items, data] })
    }
  },

  toggleItem: async (itemId, checked, store = 'supermarket') => {
    await supabase.from('shopping_items').update({
      is_checked: checked,
      checked_at: checked ? new Date().toISOString() : null
    }).eq('id', itemId)

    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    set({
      [key]: get()[key].map(i =>
        i.id === itemId ? { ...i, is_checked: checked } : i
      )
    })
  },

  deleteItem: async (itemId, store = 'supermarket') => {
    await supabase.from('shopping_items').delete().eq('id', itemId)
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    set({ [key]: get()[key].filter(i => i.id !== itemId) })
  },

  clearChecked: async (store = 'supermarket') => {
    const key = store === 'drugstore' ? 'drugstoreItems' : 'items'
    const checked = get()[key].filter(i => i.is_checked)
    for (const item of checked) {
      await supabase.from('shopping_items').delete().eq('id', item.id)
    }
    set({ [key]: get()[key].filter(i => !i.is_checked) })
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
      set({ items: data || [] })
    }
    if (drugList) {
      const { data } = await supabase
        .from('shopping_items').select()
        .eq('list_id', drugList.id).order('category')
      set({ drugstoreItems: data || [] })
    }
  }
}))