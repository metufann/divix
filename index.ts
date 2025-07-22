/**
 * Divix Backend Services - Main Export Index
 * 
 * This file provides convenient barrel exports for all backend services,
 * hooks, and utilities. Import what you need from this single entry point.
 * 
 * @example
 * ```typescript
 * // Import specific services
 * import { signIn, addExpense, createGroup } from './index'
 * 
 * // Or import entire modules
 * import * as auth from './services/auth'
 * import * as expenses from './services/expenses'
 * ```
 */

// Core library exports
export { supabase, isSupabaseConfigured, getSupabaseUrl } from './lib/supabase'

// Authentication services
export {
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  refreshSession,
  resetPassword,
  updatePassword,
  updateEmail,
} from './services/auth'

// Expense management services
export {
  addExpense,
  updateExpense,
  deleteExpense,
  listExpensesByUser,
  listExpensesByGroup,
  getExpenseById,
  getExpenseStats,
} from './services/expenses'

// Financial account services
export {
  createAccount,
  getUserAccounts,
  getAccountById,
  updateAccount,
  updateAccountBalance,
  closeAccount,
  setPrimaryAccount,
  getAccountBalanceSummary,
  getAccountTransactions,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from './services/accounts'

// Group management services
export {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  updateMemberRole,
  deleteGroup,
  getGroupExpenseSummary,
} from './services/groups'

// Storage services
export {
  uploadReceipt,
  uploadAvatar,
  uploadAttachment,
  getSignedUrl,
  deleteFile,
  listFiles,
  getUserStorageStats,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  STORAGE_BUCKETS,
} from './services/storage'

// Edge Functions services
export {
  getGroupDebts,
  generateSettlementSuggestions,
  sendExpenseNotification,
  processPayment,
  generateExpenseAnalytics,
  importExpenses,
  processReceiptOCR,
  convertCurrency as convertCurrencyEdge,
  exportGroupData,
  healthCheck,
} from './services/edge-functions'

// React hooks
export { useUser } from './hooks/useUser'

// Utility functions
export {
  simplifyDebts,
  optimizeSettlementOrder,
  calculateUserExposure,
  validateDebtMatrix,
} from './utils/debtCalc'

export {
  convertCurrency,
  getExchangeRate,
  formatCurrency,
  getSupportedCurrencies,
  getCurrencyInfo,
  batchConvertCurrency,
  clearRateCache,
  CURRENCIES,
} from './utils/currency'

// Type exports for external use
export type { Database } from './types/db'
export type {
  GroupDebt,
  GroupDebtsResponse,
  DebtTransfer,
} from './services/edge-functions'
export type {
  Debt,
  UserBalance,
  Settlement,
} from './utils/debtCalc'
export type {
  CurrencyProvider,
  ExchangeRate,
  ConversionResult,
} from './utils/currency'
export type {
  AccountType,
  AccountStatus,
} from './services/accounts'

// TODO: Add version export for API compatibility
// TODO: Add configuration object for service defaults
// TODO: Add initialization function for setup
// TODO: Add error types and error handling utilities
// TODO: Add logging and monitoring utilities 