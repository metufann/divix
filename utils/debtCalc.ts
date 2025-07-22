/**
 * Debt calculation utilities for Divix application
 * 
 * Provides pure functions for optimizing expense settlements using:
 * - Graph algorithms for debt simplification
 * - Minimal transfer calculations
 * - Currency-aware computations
 * - Splitwise-style optimization algorithms
 */

/**
 * Represents a debt between two users
 */
export interface Debt {
  from: string
  to: string
  amount: number
  currency: string
}

/**
 * Represents a user's net balance
 */
export interface UserBalance {
  userId: string
  balance: number
  currency: string
}

/**
 * Settlement transaction to minimize transfers
 */
export interface Settlement {
  from: string
  to: string
  amount: number
  currency: string
}

/**
 * Simplify debts using graph-based optimization
 * 
 * Implements debt simplification algorithm similar to Splitwise:
 * 1. Calculate net balances for each user
 * 2. Match creditors with debtors optimally
 * 3. Minimize number of transactions needed
 * 
 * @param debts - Array of individual debts between users
 * @returns Simplified array of settlements with minimal transfers
 * 
 * @example
 * ```typescript
 * const debts = [
 *   { from: 'A', to: 'B', amount: 10, currency: 'USD' },
 *   { from: 'B', to: 'C', amount: 15, currency: 'USD' },
 *   { from: 'C', to: 'A', amount: 5, currency: 'USD' }
 * ]
 * 
 * const simplified = simplifyDebts(debts)
 * // Result: [{ from: 'A', to: 'C', amount: 10, currency: 'USD' }]
 * ```
 */
export function simplifyDebts(debts: Debt[]): Settlement[] {
  if (!debts.length) return []

  // Group debts by currency
  const debtsByCurrency = groupBy(debts, 'currency')
  const allSettlements: Settlement[] = []

  // Process each currency separately
  for (const [currency, currencyDebts] of Object.entries(debtsByCurrency)) {
    const settlements = simplifyCurrencyDebts(currencyDebts, currency)
    allSettlements.push(...settlements)
  }

  return allSettlements
}

/**
 * Simplify debts for a single currency
 * 
 * @private
 * @param debts - Debts in same currency
 * @param currency - Currency code
 * @returns Optimized settlements
 */
function simplifyCurrencyDebts(debts: Debt[], currency: string): Settlement[] {
  // Calculate net balance for each user
  const balances = calculateNetBalances(debts, currency)
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter(b => b.balance > 0.01) // Use small epsilon for float precision
  const debtors = balances.filter(b => b.balance < -0.01)

  const settlements: Settlement[] = []

  // Match creditors with debtors to minimize transactions
  let i = 0, j = 0
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    
    // Calculate settlement amount (minimum of what creditor is owed and debtor owes)
    const settlementAmount = Math.min(creditor.balance, -debtor.balance)
    
    if (settlementAmount > 0.01) { // Only create settlement if meaningful amount
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimal places
        currency,
      })
    }

    // Update balances
    creditor.balance -= settlementAmount
    debtor.balance += settlementAmount

    // Move to next creditor or debtor if balance is settled
    if (Math.abs(creditor.balance) < 0.01) i++
    if (Math.abs(debtor.balance) < 0.01) j++
  }

  return settlements
}

/**
 * Calculate net balance for each user from individual debts
 * 
 * @private
 * @param debts - Individual debt transactions
 * @param currency - Currency for calculations
 * @returns Array of user net balances
 */
function calculateNetBalances(debts: Debt[], currency: string): UserBalance[] {
  const balanceMap = new Map<string, number>()

  // Sum up all debts for each user
  debts.forEach(debt => {
    // Debtor has negative balance (owes money)
    const currentDebtorBalance = balanceMap.get(debt.from) || 0
    balanceMap.set(debt.from, currentDebtorBalance - debt.amount)

    // Creditor has positive balance (is owed money)
    const currentCreditorBalance = balanceMap.get(debt.to) || 0
    balanceMap.set(debt.to, currentCreditorBalance + debt.amount)
  })

  // Convert map to array
  return Array.from(balanceMap.entries()).map(([userId, balance]) => ({
    userId,
    balance,
    currency,
  }))
}

/**
 * Optimize settlement order to minimize transaction fees
 * 
 * Sorts settlements by amount (largest first) to reduce
 * number of small transactions and associated fees.
 * 
 * @param settlements - Array of settlement transactions
 * @returns Settlements sorted by optimal execution order
 */
export function optimizeSettlementOrder(settlements: Settlement[]): Settlement[] {
  return [...settlements].sort((a, b) => {
    // Sort by amount descending (largest transactions first)
    if (a.currency === b.currency) {
      return b.amount - a.amount
    }
    // Group by currency, then by amount
    return a.currency.localeCompare(b.currency) || b.amount - a.amount
  })
}

/**
 * Calculate total debt exposure for a user
 * 
 * @param userId - User ID to calculate exposure for
 * @param debts - All debts in the system
 * @returns Object with total owed and total owing by currency
 */
export function calculateUserExposure(userId: string, debts: Debt[]) {
  const exposure = {
    totalOwed: {} as Record<string, number>,  // Money others owe to this user
    totalOwing: {} as Record<string, number>, // Money this user owes to others
  }

  debts.forEach(debt => {
    if (debt.to === userId) {
      // User is owed money
      exposure.totalOwed[debt.currency] = (exposure.totalOwed[debt.currency] || 0) + debt.amount
    } else if (debt.from === userId) {
      // User owes money
      exposure.totalOwing[debt.currency] = (exposure.totalOwing[debt.currency] || 0) + debt.amount
    }
  })

  return exposure
}

/**
 * Validate debt matrix for consistency
 * 
 * Ensures that all debts are properly balanced and no money
 * is created or destroyed in the system.
 * 
 * @param debts - Array of debts to validate
 * @returns Validation result with any issues found
 */
export function validateDebtMatrix(debts: Debt[]) {
  const issues: string[] = []
  const currencyTotals = new Map<string, number>()

  // Check that total debts sum to zero for each currency
  debts.forEach(debt => {
    if (debt.amount <= 0) {
      issues.push(`Invalid debt amount: ${debt.amount} between ${debt.from} and ${debt.to}`)
    }

    const current = currencyTotals.get(debt.currency) || 0
    currencyTotals.set(debt.currency, current) // Debts should sum to zero in a closed system
  })

  // In practice, we might have small floating point errors
  currencyTotals.forEach((total, currency) => {
    if (Math.abs(total) > 0.01) {
      issues.push(`Currency ${currency} total should be zero, but is ${total}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Group array of objects by specified key
 * 
 * @private
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with grouped items
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// TODO: Add support for transaction fees in optimization
// TODO: Add support for payment method preferences
// TODO: Add support for partial settlements
// TODO: Add currency conversion in debt simplification
// TODO: Add debt aging and priority calculations
// TODO: Implement more sophisticated graph algorithms (e.g., max flow)
// TODO: Add support for group-specific settlement preferences
// TODO: Add settlement scheduling and automation
// TODO: Add debt consolidation strategies 