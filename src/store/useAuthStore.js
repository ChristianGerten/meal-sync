import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  household: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    set({ user, loading: false })

    if (user) {
      await get()._loadOrCreateHousehold(user.id)
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        await get()._loadOrCreateHousehold(user.id)
      } else {
        set({ household: null })
      }
    })
  },

  _loadOrCreateHousehold: async (userId) => {
    const { data: membership } = await supabase
      .from('household_members')
      .select('households(*)')
      .eq('user_id', userId)
      .single()

    if (membership?.households) {
      set({ household: membership.households })
      return
    }

    const { data: existing } = await supabase
      .from('households')
      .select()
      .eq('name', 'Haushalt')
      .single()

    if (existing) {
      await supabase.from('household_members').insert({
        household_id: existing.id,
        user_id: userId,
        role: 'member'
      })
      set({ household: existing })
    } else {
      const { data: newHousehold } = await supabase
        .from('households')
        .insert({ name: 'Haushalt', code: 'HAUS01' })
        .select()
        .single()
      await supabase.from('household_members').insert({
        household_id: newHousehold.id,
        user_id: userId,
        role: 'owner'
      })
      set({ household: newHousehold })
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, household: null })
  },

  setHousehold: (household) => set({ household })
}))