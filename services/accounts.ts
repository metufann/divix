import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

// Type definitions for financial accounts
type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

/**
 * Financial account management service for Divix application
 * 
 * Manages user's financial accounts including:
 * - Bank accounts and credit cards
 * - Digital wallets (PayPal, Venmo, etc.)
 * - Cryptocurrency wallets
 * - Balance tracking and currency management
 * - Transaction history and reconciliation
 */

/**
 * Supported account types
 */
export const ACCOUNT_TYPES = {
  BANK_ACCOUNT: 'bank_account',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  VENMO: 'venmo',
  CASH_APP: 'cash_app',
  CRYPTO_WALLET: 'crypto_wallet',
  CASH: 'cash',
} as const

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES]

/**
 * Account status options
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  CLOSED: 'closed',
} as const

export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS]

/**
 * Create a new financial account
 * 
 * Adds a financial account for a user to track payments and balances.
 * Supports various account types from bank accounts to digital wallets.
 * 
 * @param account - Account data to create
 * @returns Promise with created account data or error
 */
export const createAccount = async (account: AccountInsert) => {
  // Validate required fields
  if (!account.user_id || !account.name || !account.account_type) {
    throw new Error('Missing required fields: user_id, name, and account_type')
  }

  // Set default values
  const accountData: AccountInsert = {
    ...account,
    balance: account.balance || 0,
    currency: account.currency || 'USD',
    status: account.status || ACCOUNT_STATUS.ACTIVE,
    is_primary: account.is_primary || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const result = await supabase
    .from('accounts')
    .insert(accountData)
    .select('*')
    .single()

  // TODO: Add account verification workflow
  // TODO: Integrate with external banking APIs for real-time balances
  // TODO: Add account linking and authentication
  // TODO: Set up automatic transaction importing

  return result
}

/**
 * Get all accounts for a user
 * 
 * Retrieves all financial accounts associated with a user,
 * optionally filtered by account type or status.
 * 
 * @param userId - User ID to get accounts for
 * @param options - Filtering and sorting options
 * @returns Promise with user's accounts or error
 */
export const getUserAccounts = async (
  userId: string,
  options: {
    accountType?: AccountType
    status?: AccountStatus
    includeInactive?: boolean
    sortBy?: 'name' | 'balance' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  } = {}
) => {
  const { 
    accountType, 
    status, 
    includeInactive = false, 
    sortBy = 'name', 
    sortOrder = 'asc' 
  } = options

  let query = supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)

  // Apply filters
  if (accountType) {
    query = query.eq('account_type', accountType)
  }

  if (status) {
    query = query.eq('status', status)
  } else if (!includeInactive) {
    query = query.eq('status', ACCOUNT_STATUS.ACTIVE)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  const result = await query

  // TODO: Add balance aggregation by currency
  // TODO: Add account health indicators
  // TODO: Add last transaction information

  return result
}

/**
 * Get account by ID
 * 
 * Retrieves detailed information for a specific account
 * including recent transaction summary.
 * 
 * @param accountId - Account ID to retrieve
 * @param userId - User ID for permission check
 * @returns Promise with account details or error
 */
export const getAccountById = async (accountId: string, userId: string) => {
  const { data: account, error } = await supabase
    .from('accounts')
    .select(`
      *,
      recent_transactions:transactions(
        id,
        amount,
        description,
        created_at
      )
    `)
    .eq('id', accountId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false, foreignTable: 'recent_transactions' })
    .limit(10, { foreignTable: 'recent_transactions' })
    .single()

  if (error) return { data: null, error }
  if (!account) return { data: null, error: new Error('Account not found') }

  return { data: account, error: null }
}

/**
 * Update account information
 * 
 * Updates account details like name, balance, or status.
 * Balance updates should typically go through transaction records.
 * 
 * @param accountId - Account ID to update
 * @param updates - Account updates to apply
 * @param userId - User ID for permission check
 * @returns Promise with updated account data or error
 */
export const updateAccount = async (
  accountId: string,
  updates: AccountUpdate,
  userId: string
) => {
  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('accounts')
    .select('user_id')
    .eq('id', accountId)
    .single()

  if (fetchError) return { data: null, error: fetchError }
  if (existing.user_id !== userId) {
    return { data: null, error: new Error('Permission denied: Not account owner') }
  }

  // Add updated timestamp
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  const result = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', accountId)
    .select('*')
    .single()

  // TODO: Add balance change audit logging
  // TODO: Notify user of account changes
  // TODO: Sync with external account providers

  return result
}

/**
 * Update account balance
 * 
 * Updates account balance and creates a transaction record.
 * This is the preferred way to modify account balances.
 * 
 * @param accountId - Account ID to update balance for
 * @param amount - Amount to add/subtract (positive for credit, negative for debit)
 * @param description - Description of the transaction
 * @param userId - User ID for permission check
 * @returns Promise with updated account and transaction record
 */
export const updateAccountBalance = async (
  accountId: string,
  amount: number,
  description: string,
  userId: string,
  metadata?: Record<string, any>
) => {
  // Get current account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (accountError || !account) {
    return { data: null, error: accountError || new Error('Account not found') }
  }

  const newBalance = account.balance + amount

  // Update account balance
  const { data: updatedAccount, error: updateError } = await supabase
    .from('accounts')
    .update({ 
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select('*')
    .single()

  if (updateError) return { data: null, error: updateError }

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      user_id: userId,
      amount,
      description,
      balance_after: newBalance,
      transaction_type: amount > 0 ? 'credit' : 'debit',
      metadata,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (transactionError) {
    // Rollback balance update if transaction creation fails
    await supabase
      .from('accounts')
      .update({ balance: account.balance })
      .eq('id', accountId)
    
    return { data: null, error: transactionError }
  }

  return { 
    data: { 
      account: updatedAccount, 
      transaction 
    }, 
    error: null 
  }
}

/**
 * Delete/close account
 * 
 * Marks an account as closed rather than deleting to preserve
 * transaction history. Account must have zero balance.
 * 
 * @param accountId - Account ID to close
 * @param userId - User ID for permission check
 * @returns Promise that resolves when account is closed
 */
export const closeAccount = async (accountId: string, userId: string) => {
  // Get account details
  const { data: account, error: fetchError } = await supabase
    .from('accounts')
    .select('balance, user_id')
    .eq('id', accountId)
    .single()

  if (fetchError) return { error: fetchError }
  if (account.user_id !== userId) {
    return { error: new Error('Permission denied: Not account owner') }
  }

  // Check if account has zero balance
  if (Math.abs(account.balance) > 0.01) {
    return { error: new Error('Cannot close account with non-zero balance') }
  }

  // Mark account as closed
  const result = await supabase
    .from('accounts')
    .update({ 
      status: ACCOUNT_STATUS.CLOSED,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)

  // TODO: Archive account data
  // TODO: Notify user of account closure
  // TODO: Clean up scheduled transactions

  return result
}

/**
 * Set primary account
 * 
 * Sets an account as the user's primary account for payments.
 * Only one account per currency can be primary.
 * 
 * @param accountId - Account ID to set as primary
 * @param userId - User ID for permission check
 * @returns Promise with updated account
 */
export const setPrimaryAccount = async (accountId: string, userId: string) => {
  // Get the account to set as primary
  const { data: account, error: fetchError } = await supabase
    .from('accounts')
    .select('currency, user_id')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (fetchError) return { data: null, error: fetchError }

  // Remove primary flag from other accounts with same currency
  await supabase
    .from('accounts')
    .update({ is_primary: false })
    .eq('user_id', userId)
    .eq('currency', account.currency)

  // Set this account as primary
  const result = await supabase
    .from('accounts')
    .update({ 
      is_primary: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select('*')
    .single()

  return result
}

/**
 * Get account balance summary
 * 
 * Calculates total balances across all accounts by currency.
 * 
 * @param userId - User ID to calculate balances for
 * @returns Promise with balance summary by currency
 */
export const getAccountBalanceSummary = async (userId: string) => {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('balance, currency, account_type, status')
    .eq('user_id', userId)
    .eq('status', ACCOUNT_STATUS.ACTIVE)

  if (error) return { data: null, error }

  // Calculate totals by currency
  const summary = accounts?.reduce((acc, account) => {
    const currency = account.currency
    
    if (!acc[currency]) {
      acc[currency] = {
        total_balance: 0,
        account_count: 0,
        by_type: {} as Record<string, { balance: number, count: number }>,
      }
    }

    acc[currency].total_balance += account.balance
    acc[currency].account_count += 1

    const type = account.account_type
    if (!acc[currency].by_type[type]) {
      acc[currency].by_type[type] = { balance: 0, count: 0 }
    }
    acc[currency].by_type[type].balance += account.balance
    acc[currency].by_type[type].count += 1

    return acc
  }, {} as Record<string, any>)

  return { data: summary || {}, error: null }
}

/**
 * Get account transaction history
 * 
 * Retrieves paginated transaction history for an account.
 * 
 * @param accountId - Account ID to get transactions for
 * @param userId - User ID for permission check
 * @param options - Pagination and filtering options
 * @returns Promise with transaction history
 */
export const getAccountTransactions = async (
  accountId: string,
  userId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
    transactionType?: 'credit' | 'debit'
  } = {}
) => {
  // Verify account ownership
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('user_id')
    .eq('id', accountId)
    .single()

  if (accountError || account.user_id !== userId) {
    return { data: null, error: new Error('Account not found or access denied') }
  }

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }
  if (options.transactionType) {
    query = query.eq('transaction_type', options.transactionType)
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

// TODO: Add account linking with external providers (Plaid, Yodlee)
// TODO: Add automatic transaction categorization
// TODO: Add overdraft and credit limit management
// TODO: Add account notifications and alerts
// TODO: Add multi-currency exchange rate handling
// TODO: Add account reconciliation tools
// TODO: Add scheduled/recurring transaction support
// TODO: Add account sharing for joint accounts
// TODO: Add account backup and export functionality
// TODO: Add fraud detection and security monitoring
