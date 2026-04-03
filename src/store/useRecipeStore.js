import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export const useRecipeStore = create((set, get) => ({
  recipes: [],
  loading: false,

  fetchRecipes: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('recipes')
      .select('*, ingredients(*), recipe_steps(*)')
      .eq('household_id', householdId)
      .order('name')
    if (!error) set({ recipes: data || [] })
    set({ loading: false })
  },

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
    await get().fetchRecipes(householdId)
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
    await get().fetchRecipes(householdId)
  },

  toggleFavorite: async (id, householdId) => {
    const recipe = get().recipes.find(r => r.id === id)
    if (!recipe) return
    const newVal = !recipe.is_favorite
    await supabase.from('recipes').update({ is_favorite: newVal }).eq('id', id)
    set({
      recipes: get().recipes.map(r =>
        r.id === id ? { ...r, is_favorite: newVal } : r
      )
    })
    toast.success(newVal ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt')
  },

  setRating: async (id, rating) => {
    const current = get().recipes.find(r => r.id === id)
    const newRating = current?.rating === rating ? null : rating
    await supabase.from('recipes').update({ rating: newRating }).eq('id', id)
    set({
      recipes: get().recipes.map(r =>
        r.id === id ? { ...r, rating: newRating } : r
      )
    })
    toast.success(newRating ? `Bewertet mit ${newRating} Sternen` : 'Bewertung entfernt')
  },

  deleteRecipe: async (id, householdId) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) {
      toast.error('Rezept konnte nicht gelöscht werden')
      throw error
    }
    toast.success('Rezept gelöscht')
    await get().fetchRecipes(householdId)
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