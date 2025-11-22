import { defineStore } from 'pinia'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async init() {
      this.loading = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        this.user = user
      } catch (error) {
        console.error('Auth init error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        this.user = data.user
        return { success: true }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async register(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        // Note: In production, you might want to redirect to email confirmation
        this.user = data.user
        return { success: true }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await supabase.auth.signOut()
        this.user = null
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.loading = false
      }
    },

    listenToAuthState() {
      supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user ?? null
      })
    }
  }
})
