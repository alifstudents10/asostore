import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only throw error in development, not in production build
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn('Missing Supabase environment variables. Please connect to Supabase first.')
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)