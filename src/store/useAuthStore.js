import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  household: null,
  loading: true,

  init: async () => {
    // Listener zuerst — fängt Login-Events sofort ab
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        get()._loadOrCreateHousehold(user.id) // kein await — läuft parallel
      } else {
        set({ household: null, loading: false })
      }
    })

    // Session sofort aus lokalem Storage lesen — kein Netzwerk nötig
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user) {
      set({ user: null, loading: false })
      return
    }

    set({ user, loading: false })
    get()._loadOrCreateHousehold(user.id) // kein await — läuft parallel
  },

  _loadOrCreateHousehold: async (userId) => {
    try {
      // Erst aus lokalem Cache prüfen
      const cached = localStorage.getItem('mealsync-household')
      if (cached) {
        const parsed = JSON.parse(cached)
        set({ household: parsed })
        // Im Hintergrund trotzdem aktualisieren
        get()._fetchHouseholdFromDB(userId)
        return
      }

      await get()._fetchHouseholdFromDB(userId)
    } catch (err) {
      console.warn('Haushalt laden fehlgeschlagen:', err)
    }
  },

  _fetchHouseholdFromDB: async (userId) => {
    try {
      const { data: membership } = await supabase
        .from('household_members')
        .select('households(*)')
        .eq('user_id', userId)
        .single()

      if (membership?.households) {
        localStorage.setItem('mealsync-household', JSON.stringify(membership.households))
        set({ household: membership.households })
        return
      }

      // Haushalt nicht gefunden — suchen oder erstellen
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
        localStorage.setItem('mealsync-household', JSON.stringify(existing))
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
        localStorage.setItem('mealsync-household', JSON.stringify(newHousehold))
        set({ household: newHousehold })
      }
    } catch (err) {
      console.warn('Haushalt aus DB laden fehlgeschlagen:', err)
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = data.session?.user ?? null
    set({ user, loading: false })
    if (user) {
      get()._loadOrCreateHousehold(user.id)
    }
    return data
  },

  signOut: async () => {
    localStorage.removeItem('mealsync-household')
    await supabase.auth.signOut()
    set({ user: null, household: null })
  },

  setHousehold: (household) => set({ household })
}))