import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { startOfWeek, addDays, format } from 'date-fns'

const getWeekStart = (date = new Date()) => {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export const usePlanStore = create((set, get) => ({
  currentPlan: null,
  entries: [],
  currentWeekStart: getWeekStart(),
  loading: false,
  planCache: {}, // weekStart → { plan, entries, fetchedAt }

  setWeek: (date) => {
    const weekStart = getWeekStart(date)
    set({ currentWeekStart: weekStart })
    const { currentPlan } = get()
    if (currentPlan?.household_id) {
      get().fetchPlan(currentPlan.household_id, weekStart)
    }
  },

  fetchPlan: async (householdId, weekStart) => {
    weekStart = weekStart || get().currentWeekStart
    const cacheKey = `${householdId}_${weekStart}`
    const cached = get().planCache[cacheKey]
    const now = Date.now()

    // Cache: 60 Sekunden gültig
    if (cached && now - cached.fetchedAt < 60 * 1000) {
      set({
        currentPlan: cached.plan,
        entries: cached.entries,
        loading: false
      })
      return
    }

    set({ loading: true })

    let { data: plan } = await supabase
      .from('meal_plans')
      .select()
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
      .single()

    if (!plan) {
      const { data: newPlan } = await supabase
        .from('meal_plans')
        .insert({ household_id: householdId, week_start: weekStart })
        .select()
        .single()
      plan = newPlan
    }

    const { data: entries } = await supabase
      .from('meal_plan_entries')
      .select('*, recipes(id, name, category, image_url, servings, ingredients(*))')
      .eq('plan_id', plan.id)

    const result = { plan, entries: entries || [], fetchedAt: now }

    set({
      currentPlan: plan,
      entries: entries || [],
      loading: false,
      planCache: { ...get().planCache, [cacheKey]: result }
    })
  },

  addEntry: async (day, mealType, recipeId, recipeName, servings = 2) => {
    const { currentPlan, entries } = get()

    const existing = entries.find(
      e => e.day_of_week === day && e.meal_type === mealType
    )
    if (existing) {
      await supabase.from('meal_plan_entries').delete().eq('id', existing.id)
    }

    const { data: entry } = await supabase
      .from('meal_plan_entries')
      .insert({
        plan_id: currentPlan.id,
        recipe_id: recipeId || null,
        day_of_week: day,
        meal_type: mealType,
        servings,
        custom_name: recipeId ? null : recipeName
      })
      .select('*, recipes(id, name, category, image_url, servings, ingredients(*))')
      .single()

    const newEntries = [
      ...get().entries.filter(e => e.id !== existing?.id),
      entry
    ]
    set({ entries: newEntries })
    get()._updatePlanCache(newEntries)
  },

  updateServings: async (entryId, servings) => {
    // Optimistic Update
    const newEntries = get().entries.map(e =>
      e.id === entryId ? { ...e, servings } : e
    )
    set({ entries: newEntries })
    get()._updatePlanCache(newEntries)
    await supabase.from('meal_plan_entries').update({ servings }).eq('id', entryId)
  },

  removeEntry: async (entryId) => {
    // Optimistic Update
    const newEntries = get().entries.filter(e => e.id !== entryId)
    set({ entries: newEntries })
    get()._updatePlanCache(newEntries)
    await supabase.from('meal_plan_entries').delete().eq('id', entryId)
  },

  _updatePlanCache: (entries) => {
    const { currentPlan, currentWeekStart, planCache } = get()
    if (!currentPlan) return
    const cacheKey = `${currentPlan.household_id}_${currentWeekStart}`
    const cached = planCache[cacheKey]
    if (cached) {
      set({
        planCache: {
          ...planCache,
          [cacheKey]: { ...cached, entries }
        }
      })
    }
  },

  refreshEntries: async () => {
    const { currentPlan } = get()
    if (!currentPlan) return
    const { data } = await supabase
      .from('meal_plan_entries')
      .select('*, recipes(id, name, category, image_url, servings, ingredients(*))')
      .eq('plan_id', currentPlan.id)
    const entries = data || []
    set({ entries })
    get()._updatePlanCache(entries)
  }
}))