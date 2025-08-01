import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'asostore-app'
    }
  }
})

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('Database connection successful')
    return true
  } catch (err) {
    console.error('Connection error:', err)
    return false
  }
}