import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export const useRecipeStore = create((set, get) => ({
  recipes: [],
  loading: false,
  lastFetched: null,
  householdId: null,
  _deletedRecipe: null, // für Undo

  fetchRecipes: async (householdId, force = false) => {
    const { lastFetched, householdId: cachedId } = get()
    const now = Date.now()
    if (
      !force &&
      lastFetched &&
      cachedId === householdId &&
      now - lastFetched < 2 * 60 * 1000
    ) return

    set({ loading: true })
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, category, tags, image_url, is_favorite, rating, servings, source_url, description, created_at')
      .eq('household_id', householdId)
      .order('name')

    if (!error) {
      set({ recipes: data || [], loading: false, lastFetched: Date.now(), householdId })
    } else {
      set({ loading: false })
    }
  },

  fetchRecipeDetails: async (id) => {
    const existing = get().recipes.find(r => r.id === id)
    if (existing?.ingredients) return

    const { data } = await supabase
      .from('recipes')
      .select('*, ingredients(*), recipe_steps(*)')
      .eq('id', id)
      .single()

    if (data) {
      set({ recipes: get().recipes.map(r => r.id === id ? data : r) })
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
    set({ recipes: get().recipes.map(r => r.id === id ? { ...r, is_favorite: newVal } : r) })
    await supabase.from('recipes').update({ is_favorite: newVal }).eq('id', id)
    toast.success(newVal ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt')
  },

  setRating: async (id, rating) => {
    const current = get().recipes.find(r => r.id === id)
    const newRating = current?.rating === rating ? null : rating
    set({ recipes: get().recipes.map(r => r.id === id ? { ...r, rating: newRating } : r) })
    await supabase.from('recipes').update({ rating: newRating }).eq('id', id)
    toast.success(newRating ? 'Bewertet mit ' + newRating + ' Sternen' : 'Bewertung entfernt')
  },

  deleteRecipe: async (id, householdId) => {
    // Rezept für Undo merken
    const recipe = get().recipes.find(r => r.id === id)
    set({
      recipes: get().recipes.filter(r => r.id !== id),
      _deletedRecipe: recipe
    })

    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) {
      toast.error('Rezept konnte nicht gelöscht werden')
      set({
        recipes: [...get().recipes, recipe],
        _deletedRecipe: null
      })
      return
    }

    // Undo-Toast für 5 Sekunden
    toast.undo(
      recipe.name + ' gelöscht',
      async () => {
        // Undo: Rezept wiederherstellen
        try {
          const { data: restored } = await supabase
            .from('recipes')
            .insert({
              name: recipe.name,
              category: recipe.category,
              description: recipe.description,
              servings: recipe.servings,
              tags: recipe.tags,
              image_url: recipe.image_url,
              source_url: recipe.source_url,
              is_favorite: recipe.is_favorite,
              rating: recipe.rating,
              household_id: householdId
            })
            .select()
            .single()

          toast.success(recipe.name + ' wiederhergestellt')
          get().invalidateCache()
          await get().fetchRecipes(householdId, true)
        } catch {
          toast.error('Wiederherstellen fehlgeschlagen')
        }
      }
    )
  },

  uploadImage: async (file, userId) => {
    const ext = file.name.split('.').pop()
    const path = userId + '/' + Date.now() + '.' + ext
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