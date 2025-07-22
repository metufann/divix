import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileInsert = Database['public']['Tables']['users']['Insert']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

export const createUserProfile = async (profile: UserProfileInsert) => {
  return await supabase
    .from('users')
    .insert(profile)
    .select()
    .single()
}

export const getUserProfile = async (userId: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
}

export const updateUserProfile = async (userId: string, updates: UserProfileUpdate) => {
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
}

export const getUsersByEmail = async (emails: string[]) => {
  return await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .in('email', emails)
}

// TODO: Add friend/contact management
// TODO: Add user settings and preferences
// TODO: Add user balance calculations
