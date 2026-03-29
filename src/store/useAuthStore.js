import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  household: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    set({ user, loading: false })

    if (user) {
      // Haushalt des Users laden
      const { data } = await supabase
        .from('household_members')
        .select('households(*)')
        .eq('user_id', user.id)
        .single()
      set({ household: data?.households ?? null })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        const { data } = await supabase
          .from('household_members')
          .select('households(*)')
          .eq('user_id', user.id)
          .single()
        set({ household: data?.households ?? null })
      } else {
        set({ household: null })
      }
    })
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

  createHousehold: async (name) => {
    const { data: { user } } = await supabase.auth.getUser()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: household, error } = await supabase
      .from('households')
      .insert({ name, code })
      .select()
      .single()
    if (error) throw error
    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner'
    })
    set({ household })
    return household
  },

  joinHousehold: async (code) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: household, error } = await supabase
      .from('households')
      .select()
      .eq('code', code.toUpperCase())
      .single()
    if (error || !household) throw new Error('Haushaltscode nicht gefunden')
    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'member'
    })
    set({ household })
    return household
  },

  setHousehold: (household) => set({ household })
}))