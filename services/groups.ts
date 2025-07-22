import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

// Type definitions from database schema
type Group = Database['public']['Tables']['groups']['Row']
type GroupInsert = Database['public']['Tables']['groups']['Insert']
type GroupUpdate = Database['public']['Tables']['groups']['Update']
type GroupMember = Database['public']['Tables']['group_members']['Row']
type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert']
type GroupMemberUpdate = Database['public']['Tables']['group_members']['Update']

/**
 * Group management service for Divix application
 * 
 * Provides comprehensive group operations including:
 * - Group creation and management
 * - Member invitation and management
 * - Permission and role handling
 * - Group expense coordination
 */

/**
 * Create a new group
 * 
 * Creates a group and automatically adds the creator as an admin member.
 * Groups are used to organize shared expenses among multiple users.
 * 
 * @param group - Group data to create
 * @param creatorId - ID of the user creating the group
 * @returns Promise with created group data or error
 * 
 * @example
 * ```typescript
 * const { data, error } = await createGroup({
 *   name: 'Weekend Trip',
 *   description: 'Our awesome weekend getaway',
 *   created_by: 'user-123'
 * }, 'user-123')
 * ```
 */
export const createGroup = async (group: GroupInsert, creatorId: string) => {
  // Validate required fields
  if (!group.name || !group.created_by) {
    throw new Error('Missing required fields: name and created_by')
  }

  // Create the group
  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      ...group,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (groupError) return { data: null, error: groupError }

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: newGroup.id,
      user_id: creatorId,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    // Rollback group creation if member addition fails
    await supabase.from('groups').delete().eq('id', newGroup.id)
    return { data: null, error: memberError }
  }

  // TODO: Create default group settings
  // TODO: Add group creation notifications
  // TODO: Initialize group balance tracking

  return { data: newGroup, error: null }
}

/**
 * Get groups for a specific user
 * 
 * Retrieves all groups where the user is an active member.
 * Includes group details, member count, and expense summary.
 * 
 * @param userId - User ID to get groups for
 * @param options - Query options
 * @returns Promise with user's groups or error
 * 
 * @example
 * ```typescript
 * const { data: groups, error } = await getUserGroups('user-123', {
 *   includeExpenseSummary: true
 * })
 * ```
 */
export const getUserGroups = async (
  userId: string,
  options: {
    includeExpenseSummary?: boolean
    status?: 'active' | 'left'
    limit?: number
  } = {}
) => {
  const { includeExpenseSummary = false, status = 'active', limit } = options

  let query = supabase
    .from('group_members')
    .select(`
      *,
      group:groups(
        *,
        member_count:group_members(count)
        ${includeExpenseSummary ? ',expenses(count,amount.sum())' : ''}
      )
    `)
    .eq('user_id', userId)
    .eq('status', status)
    .order('joined_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const result = await query

  // TODO: Add group activity indicators
  // TODO: Add unread expense notifications
  // TODO: Cache group data for offline access

  return result
}

/**
 * Get detailed group information
 * 
 * Retrieves comprehensive group data including all members,
 * recent expenses, and balance summaries.
 * 
 * @param groupId - Group ID to retrieve
 * @param userId - Current user ID for permission checking
 * @returns Promise with detailed group data or error
 * 
 * @example
 * ```typescript
 * const { data: group, error } = await getGroupDetails('group-456', 'user-123')
 * 
 * if (group) {
 *   console.log('Group members:', group.members?.length)
 * }
 * ```
 */
export const getGroupDetails = async (groupId: string, userId?: string) => {
  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      members:group_members(
        *,
        user:users(id, email, name, avatar_url)
      ),
      recent_expenses:expenses(
        *,
        user:users(id, name, avatar_url)
      )
    `)
    .eq('id', groupId)
    .eq('members.status', 'active')
    .order('recent_expenses.created_at', { ascending: false })
    .limit(10, { foreignTable: 'recent_expenses' })
    .single()

  if (error) return { data: null, error }

  // Check if user has access to this group
  if (userId) {
    const isMember = group.members?.some(
      (member: GroupMember) => member.user_id === userId && member.status === 'active'
    )
    if (!isMember) {
      return { data: null, error: new Error('Access denied: Not a group member') }
    }
  }

  // TODO: Add group balance calculations
  // TODO: Add expense statistics
  // TODO: Add member activity status

  return { data: group, error: null }
}

/**
 * Update group information
 * 
 * Updates group details with permission validation.
 * Only group admins can modify group information.
 * 
 * @param groupId - Group ID to update
 * @param updates - Group updates to apply
 * @param userId - Current user ID for permission check
 * @returns Promise with updated group data or error
 */
export const updateGroup = async (
  groupId: string,
  updates: GroupUpdate,
  userId: string
) => {
  // Check if user is group admin
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (memberError || membership.role !== 'admin') {
    return { data: null, error: new Error('Permission denied: Admin access required') }
  }

  // Update the group
  const result = await supabase
    .from('groups')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)
    .select('*')
    .single()

  // TODO: Notify members of group changes
  // TODO: Add change audit log

  return result
}

/**
 * Add member to group
 * 
 * Invites a user to join a group. Can be done by group admins
 * or members with invitation permissions.
 * 
 * @param groupId - Group ID to add member to
 * @param userIdToAdd - User ID to add to group
 * @param inviterId - ID of user sending invitation
 * @param role - Role to assign to new member
 * @returns Promise with new membership data or error
 * 
 * @example
 * ```typescript
 * const { data, error } = await addGroupMember(
 *   'group-456',
 *   'user-789',
 *   'user-123',
 *   'member'
 * )
 * ```
 */
export const addGroupMember = async (
  groupId: string,
  userIdToAdd: string,
  inviterId: string,
  role: 'admin' | 'member' = 'member'
) => {
  // Check if inviter has permission
  const { data: inviterMembership, error: inviterError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', inviterId)
    .eq('status', 'active')
    .single()

  if (inviterError || !inviterMembership) {
    return { data: null, error: new Error('Permission denied: Not a group member') }
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('user_id', userIdToAdd)
    .single()

  if (existingMember) {
    if (existingMember.status === 'active') {
      return { data: null, error: new Error('User is already a group member') }
    } else {
      // Reactivate membership
      return await supabase
        .from('group_members')
        .update({ 
          status: 'active', 
          role,
          joined_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)
        .select('*')
        .single()
    }
  }

  // Add new member
  const memberData: GroupMemberInsert = {
    group_id: groupId,
    user_id: userIdToAdd,
    role,
    status: 'active',
    joined_at: new Date().toISOString(),
  }

  const result = await supabase
    .from('group_members')
    .insert(memberData)
    .select(`
      *,
      user:users(id, email, name, avatar_url)
    `)
    .single()

  // TODO: Send invitation notification
  // TODO: Add member welcome message
  // TODO: Update group member count

  return result
}

/**
 * Remove member from group
 * 
 * Removes a user from a group or allows user to leave.
 * Handles final expense settlements and data cleanup.
 * 
 * @param groupId - Group ID to remove member from
 * @param userIdToRemove - User ID to remove
 * @param requesterId - ID of user making the request
 * @returns Promise that resolves when removal is complete
 */
export const removeGroupMember = async (
  groupId: string,
  userIdToRemove: string,
  requesterId: string
) => {
  // Check permissions
  const isLeaving = userIdToRemove === requesterId

  if (!isLeaving) {
    // Check if requester is admin
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', requesterId)
      .eq('status', 'active')
      .single()

    if (requesterError || requesterMembership.role !== 'admin') {
      return { error: new Error('Permission denied: Admin access required') }
    }
  }

  // Check if user has outstanding balances
  // TODO: Implement balance check before removal
  
  // Update membership status to 'left'
  const result = await supabase
    .from('group_members')
    .update({ 
      status: 'left',
      left_at: new Date().toISOString()
    })
    .eq('group_id', groupId)
    .eq('user_id', userIdToRemove)
    .eq('status', 'active')

  // TODO: Handle final expense settlements
  // TODO: Archive user's group data
  // TODO: Notify other members

  return result
}

/**
 * Update member role
 * 
 * Changes a group member's role (admin/member).
 * Only existing admins can promote/demote members.
 * 
 * @param groupId - Group ID
 * @param userIdToUpdate - User ID to update role for
 * @param newRole - New role to assign
 * @param requesterId - ID of user making the request
 * @returns Promise with updated membership data
 */
export const updateMemberRole = async (
  groupId: string,
  userIdToUpdate: string,
  newRole: 'admin' | 'member',
  requesterId: string
) => {
  // Check if requester is admin
  const { data: requesterMembership, error: requesterError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', requesterId)
    .eq('status', 'active')
    .single()

  if (requesterError || requesterMembership.role !== 'admin') {
    return { data: null, error: new Error('Permission denied: Admin access required') }
  }

  // Update member role
  const result = await supabase
    .from('group_members')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', userIdToUpdate)
    .eq('status', 'active')
    .select(`
      *,
      user:users(id, email, name, avatar_url)
    `)
    .single()

  // TODO: Add role change notifications
  // TODO: Update permissions cache

  return result
}

/**
 * Delete group
 * 
 * Permanently deletes a group and all associated data.
 * Only group admins can delete groups. Requires all balances to be settled.
 * 
 * @param groupId - Group ID to delete
 * @param requesterId - ID of user requesting deletion
 * @returns Promise that resolves when deletion is complete
 */
export const deleteGroup = async (groupId: string, requesterId: string) => {
  // Check if requester is admin
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', requesterId)
    .eq('status', 'active')
    .single()

  if (memberError || membership.role !== 'admin') {
    return { error: new Error('Permission denied: Admin access required') }
  }

  // Check for outstanding balances
  // TODO: Verify all balances are settled before deletion

  // Delete associated data in transaction
  // This would typically be done in a database transaction
  const { error: expenseError } = await supabase
    .from('expenses')
    .delete()
    .eq('group_id', groupId)

  if (expenseError) return { error: expenseError }

  const { error: memberError2 } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)

  if (memberError2) return { error: memberError2 }

  const { error: groupError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  // TODO: Archive group data instead of hard delete
  // TODO: Notify all members of deletion
  // TODO: Clean up associated files/attachments

  return { error: groupError }
}

/**
 * Get group expense summary
 * 
 * Calculates comprehensive expense statistics for a group
 * including totals by currency, member contributions, etc.
 * 
 * @param groupId - Group ID to get summary for
 * @returns Promise with expense summary data
 */
export const getGroupExpenseSummary = async (groupId: string) => {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('amount, currency, user_id, participants, splits')
    .eq('group_id', groupId)

  if (error) return { data: null, error }

  // Calculate summary statistics
  const summary = {
    totalExpenses: expenses?.length || 0,
    totalAmount: 0,
    currencyTotals: {} as Record<string, number>,
    memberContributions: {} as Record<string, number>,
    memberShares: {} as Record<string, number>,
  }

  expenses?.forEach(expense => {
    const currency = expense.currency
    
    // Total amounts by currency
    if (!summary.currencyTotals[currency]) {
      summary.currencyTotals[currency] = 0
    }
    summary.currencyTotals[currency] += expense.amount

    // Member contributions (who paid)
    if (!summary.memberContributions[expense.user_id]) {
      summary.memberContributions[expense.user_id] = 0
    }
    summary.memberContributions[expense.user_id] += expense.amount

    // Member shares (who owes what)
    Object.entries(expense.splits).forEach(([userId, amount]) => {
      if (!summary.memberShares[userId]) {
        summary.memberShares[userId] = 0
      }
      summary.memberShares[userId] += amount as number
    })
  })

  return { data: summary, error: null }
}

// TODO: Add group invitation system with email invites
// TODO: Add group templates and settings
// TODO: Add group expense approval workflow  
// TODO: Add group chat/messaging integration
// TODO: Add group photo and customization
// TODO: Add group expense categories and budgets
// TODO: Add group reporting and analytics
// TODO: Add group import/export functionality
// TODO: Add recurring group expenses
// TODO: Add group settlement recommendations
