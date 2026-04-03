import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export const useRecipeStore = create((set, get) => ({
  recipes: [],
  loading: false,
  lastFetched: null,
  householdId: null,

  fetchRecipes: async (householdId, force = false) => {
    const { lastFetched, householdId: cachedId } = get()
    const now = Date.now()

    // Cache: nicht neu laden wenn < 2 Minuten alt und gleicher Haushalt
    if (
      !force &&
      lastFetched &&
      cachedId === householdId &&
      now - lastFetched < 2 * 60 * 1000
    ) return

    set({ loading: true })

    // Erst Basis-Daten laden (schnell)
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, category, tags, image_url, is_favorite, rating, servings, source_url, description, created_at')
      .eq('household_id', householdId)
      .order('name')

    if (!error) {
      set({
        recipes: data || [],
        loading: false,
        lastFetched: now,
        householdId
      })
    } else {
      set({ loading: false })
    }
  },

  // Einzelnes Rezept mit allen Details laden (nur bei Bedarf)
  fetchRecipeDetails: async (id) => {
    const existing = get().recipes.find(r => r.id === id)
    if (existing?.ingredients) return // bereits geladen

    const { data } = await supabase
      .from('recipes')
      .select('*, ingredients(*), recipe_steps(*)')
      .eq('id', id)
      .single()

    if (data) {
      set({
        recipes: get().recipes.map(r => r.id === id ? data : r)
      })
    }
  },

  invalidateCache: () => set({ lastFetched: null }),

  addRecipe: async (recipeData, householdId) => {
    const { ingredients, recipe_steps, steps, ...recipe } = recipeData
    const { data: newRecipe, error } = await supabase
      .from('recipes')
      .insert({ ...recipe, household_id: householdId })
      .select()
      .single()
    if (error) {
      toast.error('Rezept konnte nicht gespeichert werden')
      throw error
    }

    if (ingredients?.length) {
      const valid = ingredients.filter(i => i.name?.trim())
      if (valid.length) {
        await supabase.from('ingredients').insert(
          valid.map(ing => ({ ...ing, recipe_id: newRecipe.id }))
        )
      }
    }

    const stepsData = steps || recipe_steps
    if (stepsData?.length) {
      const valid = stepsData.filter(s =>
        typeof s === 'string' ? s.trim() : s.description?.trim()
      )
      if (valid.length) {
        await supabase.from('recipe_steps').insert(
          valid.map((s, i) => ({
            recipe_id: newRecipe.id,
            step_number: typeof s === 'string' ? i + 1 : (s.step_number || i + 1),
            description: typeof s === 'string' ? s : s.description
          }))
        )
      }
    }

    toast.success('Rezept gespeichert')
    get().invalidateCache()
    await get().fetchRecipes(householdId, true)
    return newRecipe
  },

  updateRecipe: async (id, recipeData, householdId) => {
    const { ingredients, recipe_steps, steps, ...recipe } = recipeData
    const { error } = await supabase.from('recipes').update(recipe).eq('id', id)
    if (error) {
      toast.error('Rezept konnte nicht aktualisiert werden')
      throw error
    }

    if (ingredients) {
      await supabase.from('ingredients').delete().eq('recipe_id', id)
      const valid = ingredients.filter(i => i.name?.trim())
      if (valid.length) {
        await supabase.from('ingredients').insert(
          valid.map(ing => ({ ...ing, recipe_id: id }))
        )
      }
    }

    const stepsData = steps || recipe_steps
    if (stepsData) {
      await supabase.from('recipe_steps').delete().eq('recipe_id', id)
      const valid = stepsData.filter(s =>
        typeof s === 'string' ? s.trim() : s.description?.trim()
      )
      if (valid.length) {
        await supabase.from('recipe_steps').insert(
          valid.map((s, i) => ({
            recipe_id: id,
            step_number: typeof s === 'string' ? i + 1 : (s.step_number || i + 1),
            description: typeof s === 'string' ? s : s.description
          }))
        )
      }
    }

    toast.success('Rezept aktualisiert')
    get().invalidateCache()
    await get().fetchRecipes(householdId, true)
  },

  toggleFavorite: async (id, householdId) => {
    const recipe = get().recipes.find(r => r.id === id)
    if (!recipe) return
    const newVal = !recipe.is_favorite
    // Optimistic Update — sofort im UI ändern
    set({ recipes: get().recipes.map(r => r.id === id ? { ...r, is_favorite: newVal } : r) })
    await supabase.from('recipes').update({ is_favorite: newVal }).eq('id', id)
    toast.success(newVal ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt')
  },

  setRating: async (id, rating) => {
    const current = get().recipes.find(r => r.id === id)
    const newRating = current?.rating === rating ? null : rating
    // Optimistic Update
    set({ recipes: get().recipes.map(r => r.id === id ? { ...r, rating: newRating } : r) })
    await supabase.from('recipes').update({ rating: newRating }).eq('id', id)
    toast.success(newRating ? `Bewertet mit ${newRating} Sternen` : 'Bewertung entfernt')
  },

  deleteRecipe: async (id, householdId) => {
    // Optimistic Update
    set({ recipes: get().recipes.filter(r => r.id !== id) })
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) {
      toast.error('Rezept konnte nicht gelöscht werden')
      await get().fetchRecipes(householdId, true)
      throw error
    }
    toast.success('Rezept gelöscht')
  },

  uploadImage: async (file, userId) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(path, file)
    if (error) {
      toast.error('Bild konnte nicht hochgeladen werden')
      throw error
    }
    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(path)
    return publicUrl
  }
}))