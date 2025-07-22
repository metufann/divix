import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Group = Database['public']['Tables']['groups']['Row']
type GroupInsert = Database['public']['Tables']['groups']['Insert']
type GroupUpdate = Database['public']['Tables']['groups']['Update']
type GroupMember = Database['public']['Tables']['group_members']['Row']
type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert']

export const createGroup = async (group: GroupInsert) => {
  return await supabase
    .from('groups')
    .insert(group)
    .select()
    .single()
}

export const getUserGroups = async (userId: string) => {
  return await supabase
    .from('group_members')
    .select(`
      *,
      group:groups(
        *,
        expenses(count)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
}

export const getGroupDetails = async (groupId: string) => {
  return await supabase
    .from('groups')
    .select(`
      *,
      members:group_members(
        *,
        user:users(id, email, name, avatar_url)
      ),
      expenses(*)
    `)
    .eq('id', groupId)
    .single()
}

export const addGroupMember = async (member: GroupMemberInsert) => {
  return await supabase
    .from('group_members')
    .insert(member)
    .select()
    .single()
}

export const updateGroup = async (id: string, updates: GroupUpdate) => {
  return await supabase
    .from('groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const leaveGroup = async (groupId: string, userId: string) => {
  return await supabase
    .from('group_members')
    .update({ status: 'left' })
    .eq('group_id', groupId)
    .eq('user_id', userId)
}

// TODO: Add group invitation system
// TODO: Add group expense summary and totals
// TODO: Add group settings and permissions
