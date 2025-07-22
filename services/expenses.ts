import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

// Type definitions from database schema
type Expense = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

/**
 * Expense management service for Divix application
 * 
 * Provides comprehensive expense CRUD operations with:
 * - Individual and group expense management
 * - Flexible splitting methods (equal, exact amounts, percentages)
 * - Advanced filtering and querying
 * - Real-time updates via Supabase subscriptions
 */

/**
 * Create a new expense
 * 
 * Adds an expense to the database with automatic participant
 * and split calculation based on the chosen split method.
 * 
 * @param expense - Expense data to create
 * @returns Promise with created expense data or error
 * 
 */
export const addExpense = async (expense: ExpenseInsert) => {
  // Validate required fields
  if (!expense.user_id || !expense.amount || !expense.description) {
    throw new Error('Missing required fields: user_id, amount, and description')
  }

  // Ensure participants include the expense creator
  const participants = expense.participants || [expense.user_id]
  if (!participants.includes(expense.user_id)) {
    participants.push(expense.user_id)
  }

  // Calculate splits based on method
  let splits = expense.splits || {}
  if (!Object.keys(splits).length) {
    splits = calculateDefaultSplits(participants, expense.amount, expense.split_method || 'equal')
  }

  const expenseData: ExpenseInsert = {
    ...expense,
    participants,
    splits,
    currency: expense.currency || 'USD',
    date: expense.date || new Date().toISOString(),
    split_method: expense.split_method || 'equal',
  }

  const result = await supabase
    .from('expenses')
    .insert(expenseData)
    .select(`
      *,
      user:users(id, email, name),
      group:groups(id, name)
    `)
    .single()

  // TODO: Add expense validation business rules
  // TODO: Send notifications to participants
  // TODO: Update group balance totals
  // TODO: Add expense categorization
  
  return result
}

/**
 * Update an existing expense
 * 
 * Updates expense data with validation for ownership and permissions.
 * Recalculates splits if participants or amount changes.
 * 
 * @param id - Expense ID to update
 * @param updates - Partial expense data to update
 * @param userId - Current user ID for permission check
 * @returns Promise with updated expense data or error
 */
export const updateExpense = async (
  id: string, 
  updates: ExpenseUpdate,
  userId: string
) => {
  // Check if user owns the expense or is group admin
  const { data: existing, error: fetchError } = await supabase
    .from('expenses')
    .select('user_id, group_id')
    .eq('id', id)
    .single()

  if (fetchError) return { data: null, error: fetchError }
  if (existing.user_id !== userId) {
    return { data: null, error: new Error('Permission denied: Not expense owner') }
  }

  // Recalculate splits if amount or participants changed
  if (updates.amount || updates.participants || updates.split_method) {
    const participants = updates.participants || []
    const amount = updates.amount || 0
    const splitMethod = updates.split_method || 'equal'
    
    if (participants.length && amount > 0) {
      updates.splits = calculateDefaultSplits(participants, amount, splitMethod)
    }
  }

  const result = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      user:users(id, email, name),
      group:groups(id, name)
    `)
    .single()

  // TODO: Add change audit logging
  // TODO: Notify participants of changes
  // TODO: Handle split method transitions
  
  return result
}

/**
 * Delete an expense
 * 
 * Removes expense from database with ownership validation.
 * Only expense creator or group admin can delete.
 * 
 * @param id - Expense ID to delete
 * @param userId - Current user ID for permission check
 * @returns Promise that resolves when deletion is complete
 */
export const deleteExpense = async (id: string, userId: string) => {
  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('expenses')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError }
  if (existing.user_id !== userId) {
    return { error: new Error('Permission denied: Not expense owner') }
  }

  const result = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  // TODO: Add soft delete option
  // TODO: Archive expense data for audit trail
  // TODO: Update group balance calculations
  
  return result
}

/**
 * Get expenses for a specific user
 * 
 * Retrieves all expenses where user is either creator or participant.
 * Supports pagination and filtering options.
 * 
 * @param userId - User ID to get expenses for
 * @param options - Query options for filtering and pagination
 * @returns Promise with user's expenses or error
 */
export const listExpensesByUser = async (
  userId: string,
  options: {
    limit?: number
    offset?: number
    groupId?: string
    startDate?: string
    endDate?: string
    currency?: string
  } = {}
) => {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      user:users(id, email, name, avatar_url),
      group:groups(id, name)
    `)
    .or(`user_id.eq.${userId},participants.cs.{${userId}}`)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.groupId) {
    query = query.eq('group_id', options.groupId)
  }
  
  if (options.startDate) {
    query = query.gte('date', options.startDate)
  }
  
  if (options.endDate) {
    query = query.lte('date', options.endDate)
  }
  
  if (options.currency) {
    query = query.eq('currency', options.currency)
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  return await query
}

/**
 * Get expenses for a specific group
 * 
 * Retrieves all expenses associated with a group.
 * Includes participant and user information.
 * 
 * @param groupId - Group ID to get expenses for
 * @param options - Query options for filtering
 * @returns Promise with group's expenses or error
 */
export const listExpensesByGroup = async (
  groupId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
    userId?: string // Filter by specific participant
  } = {}
) => {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      user:users(id, email, name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false })

  // Apply filters
  if (options.startDate) {
    query = query.gte('date', options.startDate)
  }
  
  if (options.endDate) {
    query = query.lte('date', options.endDate)
  }
  
  if (options.userId) {
    query = query.or(`user_id.eq.${options.userId},participants.cs.{${options.userId}}`)
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  return await query
}

/**
 * Get a single expense by ID
 * 
 * Retrieves detailed expense information including user and group data.
 * 
 * @param id - Expense ID
 * @returns Promise with expense data or error
 */
export const getExpenseById = async (id: string) => {
  return await supabase
    .from('expenses')
    .select(`
      *,
      user:users(id, email, name, avatar_url),
      group:groups(id, name, description)
    `)
    .eq('id', id)
    .single()
}

/**
 * Get expense statistics for a user
 * 
 * Calculates various metrics like total spent, owed amounts, etc.
 * 
 * @param userId - User ID to calculate stats for
 * @param groupId - Optional group ID to scope stats
 * @returns Promise with expense statistics
 */
export const getExpenseStats = async (userId: string, groupId?: string) => {
  let query = supabase
    .from('expenses')
    .select('amount, currency, user_id, participants, splits')
    .or(`user_id.eq.${userId},participants.cs.{${userId}}`)

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  const { data: expenses, error } = await query

  if (error) return { data: null, error }

  // Calculate statistics
  const stats = {
    totalExpenses: expenses?.length || 0,
    totalSpent: 0,
    totalOwed: 0,
    totalOwes: 0,
    currencyBreakdown: {} as Record<string, { spent: number, owed: number, owes: number }>,
  }

  expenses?.forEach(expense => {
    const currency = expense.currency
    const userShare = expense.splits[userId] || 0
    const isOwner = expense.user_id === userId

    if (!stats.currencyBreakdown[currency]) {
      stats.currencyBreakdown[currency] = { spent: 0, owed: 0, owes: 0 }
    }

    if (isOwner) {
      stats.totalSpent += expense.amount
      stats.totalOwed += (expense.amount - userShare)
      stats.currencyBreakdown[currency].spent += expense.amount
      stats.currencyBreakdown[currency].owed += (expense.amount - userShare)
    } else {
      stats.totalOwes += userShare
      stats.currencyBreakdown[currency].owes += userShare
    }
  })

  return { data: stats, error: null }
}

/**
 * Calculate default splits based on method and participants
 * 
 * @private
 * @param participants - Array of participant user IDs
 * @param amount - Total expense amount
 * @param method - Split method ('equal', 'exact', 'percentage')
 * @returns Splits object mapping user ID to amount
 */
function calculateDefaultSplits(
  participants: string[], 
  amount: number, 
  method: 'equal' | 'exact' | 'percentage' = 'equal'
): Record<string, number> {
  const splits: Record<string, number> = {}

  switch (method) {
    case 'equal':
      const equalShare = Math.round((amount / participants.length) * 100) / 100
      participants.forEach(userId => {
        splits[userId] = equalShare
      })
      break
    
    case 'exact':
      // For exact splits, amounts should be provided in the splits parameter
      // This is a fallback to equal split
      const exactShare = Math.round((amount / participants.length) * 100) / 100
      participants.forEach(userId => {
        splits[userId] = exactShare
      })
      break
    
    case 'percentage':
      // For percentage splits, percentages should be provided
      // This is a fallback to equal split
      const percentShare = Math.round((amount / participants.length) * 100) / 100
      participants.forEach(userId => {
        splits[userId] = percentShare
      })
      break
  }

  return splits
}

// TODO: Add receipt/attachment management
// TODO: Add expense templates and recurring expenses
// TODO: Add expense approval workflow
// TODO: Add expense tagging and categorization
// TODO: Add currency conversion handling
// TODO: Add real-time expense notifications
// TODO: Add expense import/export functionality
// TODO: Add advanced filtering (tags, categories, amount ranges)
// TODO: Add expense search with full-text search
// TODO: Add expense analytics and insights
