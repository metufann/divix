import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Custom React hook for managing user authentication state
 * 
 * Provides reactive access to current user authentication status with:
 * - Real-time auth state synchronization
 * - Session management and persistence
 * - Loading states for auth operations
 * - Automatic cleanup and unsubscription
 * 
 * @returns Object containing user, session, and loading state
 * 
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session and user data
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error)
          } else {
            setSession(session)
            setUser(session?.user ?? null)
          }
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Error in getInitialSession:', err)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)

          // TODO: Handle different auth events
          // TODO: Update user profile data on session changes
          // TODO: Clear cached data on sign out
          // TODO: Analytics tracking for auth events
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return { 
    user, 
    session, 
    loading,
    // TODO: Add helper methods like isAuthenticated, hasRole, etc.
    // TODO: Add user profile data from database
    // TODO: Add user preferences and settings
  }
}

// TODO: Create UserProvider context to avoid prop drilling
// TODO: Add user profile caching and synchronization
// TODO: Add offline support and state persistence
// TODO: Add user role and permission management
// TODO: Add user activity tracking
