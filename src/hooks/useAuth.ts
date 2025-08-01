import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { UserRole } from '../types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error, count } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (error) {
        console.error('Error fetching user role:', error)
        setUserRole(null)
        setLoading(false)
        return
      }

      setUserRole(data && data.length > 0 ? data[0] : null)
    } catch (err) {
      console.error('Error fetching user role:', err)
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const isAdmin = userRole?.role === 'admin'
  const isStudent = userRole?.role === 'student'

  return {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isStudent
  }
}