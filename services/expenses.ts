import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Expense = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export const addExpense = async (expense: ExpenseInsert) => {
  return await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
}

export const listUserExpenses = async (userId: string) => {
  return await supabase
    .from('expenses')
    .select(`
      *,
      user:users(id, email, name)
    `)
    .or(`user_id.eq.${userId},participants.cs.{${userId}}`)
    .order('created_at', { ascending: false })
}

export const updateExpense = async (id: string, updates: ExpenseUpdate) => {
  return await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const deleteExpense = async (id: string) => {
  return await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
}

// TODO: Add business logic for expense splitting calculations
// TODO: Add support for expense attachments/receipts
// TODO: Add expense categorization and tags
