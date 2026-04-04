import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  household: null,
  loading: true,

  init: async () => {
    // Auth State Listener zuerst registrieren
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        await get()._loadOrCreateHousehold(user.id)
      } else {
        set({ household: null })
      }
    })

    try {
      // Timeout nach 5 Sekunden — verhindert ewiges Laden auf Handy
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ])

      const user = session?.user ?? null
      set({ user, loading: false })
      if (user) {
        await get()._loadOrCreateHousehold(user.id)
      }
    } catch (err) {
      console.warn('Auth init Fehler oder Timeout:', err)
      set({ loading: false })
    }
  },

  _loadOrCreateHousehold: async (userId) => {
    try {
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
    } catch (err) {
      console.warn('Haushalt laden fehlgeschlagen:', err)
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = data.session?.user ?? null
    set({ user })
    if (user) {
      await get()._loadOrCreateHousehold(user.id)
    }
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, household: null })
  },

  setHousehold: (household) => set({ household })
}))