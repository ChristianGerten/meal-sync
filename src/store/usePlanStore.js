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

  setWeek: (date) => {
    const weekStart = getWeekStart(date)
    set({ currentWeekStart: weekStart })
    const { currentPlan } = get()
    if (currentPlan?.household_id) {
      get().fetchPlan(currentPlan.household_id, weekStart)
    }
  },

  fetchPlan: async (householdId, weekStart) => {
    set({ loading: true })
    weekStart = weekStart || get().currentWeekStart

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

    set({ currentPlan: plan, entries: entries || [], loading: false })
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

    set({
      entries: [
        ...get().entries.filter(e => e.id !== existing?.id),
        entry
      ]
    })
  },

  updateServings: async (entryId, servings) => {
    await supabase
      .from('meal_plan_entries')
      .update({ servings })
      .eq('id', entryId)

    set({
      entries: get().entries.map(e =>
        e.id === entryId ? { ...e, servings } : e
      )
    })
  },

  removeEntry: async (entryId) => {
    await supabase.from('meal_plan_entries').delete().eq('id', entryId)
    set({ entries: get().entries.filter(e => e.id !== entryId) })
  },

  refreshEntries: async () => {
    const { currentPlan } = get()
    if (!currentPlan) return
    const { data } = await supabase
      .from('meal_plan_entries')
      .select('*, recipes(id, name, category, image_url, servings, ingredients(*))')
      .eq('plan_id', currentPlan.id)
    set({ entries: data || [] })
  }
}))