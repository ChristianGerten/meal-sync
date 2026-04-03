import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
    if (error) throw error

    if (ingredients?.length) {
      const validIngredients = ingredients.filter(i => i.name?.trim())
      if (validIngredients.length) {
        await supabase.from('ingredients').insert(
          validIngredients.map(ing => ({ ...ing, recipe_id: newRecipe.id }))
        )
      }
    }

    const stepsData = steps || recipe_steps
    if (stepsData?.length) {
      const validSteps = stepsData.filter(s =>
        typeof s === 'string' ? s.trim() : s.description?.trim()
      )
      if (validSteps.length) {
        await supabase.from('recipe_steps').insert(
          validSteps.map((s, i) => ({
            recipe_id: newRecipe.id,
            step_number: typeof s === 'string' ? i + 1 : (s.step_number || i + 1),
            description: typeof s === 'string' ? s : s.description
          }))
        )
      }
    }

    await get().fetchRecipes(householdId)
    return newRecipe
  },

  updateRecipe: async (id, recipeData, householdId) => {
    const { ingredients, recipe_steps, steps, ...recipe } = recipeData
    const { error } = await supabase.from('recipes').update(recipe).eq('id', id)
    if (error) throw error

    if (ingredients) {
      await supabase.from('ingredients').delete().eq('recipe_id', id)
      const validIngredients = ingredients.filter(i => i.name?.trim())
      if (validIngredients.length) {
        await supabase.from('ingredients').insert(
          validIngredients.map(ing => ({ ...ing, recipe_id: id }))
        )
      }
    }

    const stepsData = steps || recipe_steps
    if (stepsData) {
      await supabase.from('recipe_steps').delete().eq('recipe_id', id)
      const validSteps = stepsData.filter(s =>
        typeof s === 'string' ? s.trim() : s.description?.trim()
      )
      if (validSteps.length) {
        await supabase.from('recipe_steps').insert(
          validSteps.map((s, i) => ({
            recipe_id: id,
            step_number: typeof s === 'string' ? i + 1 : (s.step_number || i + 1),
            description: typeof s === 'string' ? s : s.description
          }))
        )
      }
    }

    await get().fetchRecipes(householdId)
  },

  deleteRecipe: async (id, householdId) => {
    await supabase.from('recipes').delete().eq('id', id)
    await get().fetchRecipes(householdId)
  },

  uploadImage: async (file, userId) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(path, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(path)
    return publicUrl
  }
}))