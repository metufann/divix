// This file is auto-generated from Supabase CLI
// Run: npx supabase gen types typescript --linked --schema public > types/db.ts

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          account_type: 'bank_account' | 'credit_card' | 'debit_card' | 'paypal' | 'venmo' | 'cash_app' | 'crypto_wallet' | 'cash'
          account_number: string | null
          routing_number: string | null
          balance: number
          currency: string
          is_primary: boolean
          status: 'active' | 'inactive' | 'suspended' | 'closed'
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          account_type: 'bank_account' | 'credit_card' | 'debit_card' | 'paypal' | 'venmo' | 'cash_app' | 'crypto_wallet' | 'cash'
          account_number?: string | null
          routing_number?: string | null
          balance?: number
          currency?: string
          is_primary?: boolean
          status?: 'active' | 'inactive' | 'suspended' | 'closed'
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          account_type?: 'bank_account' | 'credit_card' | 'debit_card' | 'paypal' | 'venmo' | 'cash_app' | 'crypto_wallet' | 'cash'
          account_number?: string | null
          routing_number?: string | null
          balance?: number
          currency?: string
          is_primary?: boolean
          status?: 'active' | 'inactive' | 'suspended' | 'closed'
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          account_id: string
          user_id: string
          amount: number
          description: string
          transaction_type: 'credit' | 'debit'
          balance_after: number
          reference_id: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          user_id: string
          amount: number
          description: string
          transaction_type: 'credit' | 'debit'
          balance_after: number
          reference_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          user_id?: string
          amount?: number
          description?: string
          transaction_type?: 'credit' | 'debit'
          balance_after?: number
          reference_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          status: 'active' | 'left'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          status?: 'active' | 'left'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          status?: 'active' | 'left'
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string | null
          user_id: string
          amount: number
          currency: string
          description: string
          date: string
          participants: string[]
          split_method: 'equal' | 'exact' | 'percentage'
          splits: Record<string, number>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          user_id: string
          amount: number
          currency?: string
          description: string
          date?: string
          participants?: string[]
          split_method?: 'equal' | 'exact' | 'percentage'
          splits?: Record<string, number>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          user_id?: string
          amount?: number
          currency?: string
          description?: string
          date?: string
          participants?: string[]
          split_method?: 'equal' | 'exact' | 'percentage'
          splits?: Record<string, number>
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          from_account_id: string | null
          to_account_id: string | null
          amount: number
          currency: string
          description: string | null
          group_id: string | null
          expense_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          from_account_id?: string | null
          to_account_id?: string | null
          amount: number
          currency?: string
          description?: string | null
          group_id?: string | null
          expense_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          from_account_id?: string | null
          to_account_id?: string | null
          amount?: number
          currency?: string
          description?: string | null
          group_id?: string | null
          expense_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 