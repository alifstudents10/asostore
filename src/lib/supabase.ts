import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database connection test
export const testDatabaseConnection = async () => {
  try {
    console.log('🔄 Testing database connection...')
    
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Database connected successfully!')
    console.log(`📊 Found ${count} students in database`)
    return { success: true, count }
  } catch (err) {
    console.error('❌ Connection test error:', err)
    return { success: false, error: 'Failed to connect to database' }
  }
}
