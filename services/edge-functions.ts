import { supabase } from '../lib/supabase'

interface GroupDebt {
  user_id: string
  user_name: string
  user_email: string
  total_owed: number
  total_owes: number
  net_balance: number
}

interface GroupDebtsResponse {
  group_id: string
  debts: GroupDebt[]
  total_expenses: number
  currency: string
}

export const getGroupDebts = async (groupId: string): Promise<GroupDebtsResponse> => {
  const { data, error } = await supabase.functions.invoke('group-debts', {
    body: { groupId }
  })

  if (error) {
    throw error
  }

  return data
}

// TODO: Add settlement suggestions endpoint
// TODO: Add expense optimization calculations
// TODO: Add payment tracking integration
