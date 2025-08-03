import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { UserRole } from '../types/database'
import toast from 'react-hot-toast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 Initializing authentication...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Session error:', error.message)
        console.log('ℹ️ No active session found')
      }
      
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('✅ User session found:', session.user.email)
        fetchUserRole(session.user.id)
      } else {
        console.log('ℹ️ No active session')
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        
        setUser(session?.user ?? null)
        if (session?.user) {
          console.log('✅ User signed in:', session.user.email)
          await fetchUserRole(session.user.id)
        } else {
          console.log('ℹ️ User signed out')
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔄 Fetching user role...')
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No role found for user')
          setUserRole(null)
        } else {
          console.error('❌ Role fetch error:', error.message)
          toast.error('Error fetching user role')
        }
      } else {
        console.log('✅ User role found:', data.role)
        setUserRole(data)
      }
    } catch (err) {
      console.error('❌ Role fetch error:', err)
      toast.error('Error fetching user role')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔄 Signing in user:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Sign in error:', error.message)
    } else {
      console.log('✅ Sign in successful')
    }
    
    return { data, error }
  }

  const signOut = async () => {
    console.log('🔄 Signing out user...')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Sign out error:', error.message)
    } else {
      console.log('✅ Sign out successful')
    }
    
    return { error }
  }

  const isAdmin = userRole?.role === 'admin'

  return {
    user,
    userRole,
    loading,
    signIn,
    signOut,
    isAdmin
  }
}