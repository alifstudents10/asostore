import { supabase } from '../lib/supabase'

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('Supabase connection successful')
    return { success: true, data }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: 'Failed to connect to Supabase' }
  }
}

export const createAdminUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Admin user creation error:', error)
      return { success: false, error: error.message }
    }

    console.log('Admin user created successfully:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Admin user creation failed:', err)
    return { success: false, error: 'Failed to create admin user' }
  }
}