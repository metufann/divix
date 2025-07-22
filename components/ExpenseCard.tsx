import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Database } from '../types/db'

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  user?: {
    id: string
    email: string
    name: string | null
  }
}

interface ExpenseCardProps {
  expense: Expense
  onPress?: () => void
}

export default function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getUserDisplayName = () => {
    if (expense.user?.name) {
      return expense.user.name
    }
    if (expense.user?.email) {
      return expense.user.email.split('@')[0]
    }
    return 'Unknown User'
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={20} color="#007AFF" />
          </View>
          <View style={styles.mainInfo}>
            <Text style={styles.description} numberOfLines={1}>
              {expense.description}
            </Text>
            <Text style={styles.metadata}>
              {getUserDisplayName()} • {formatDate(expense.date)}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {formatAmount(expense.amount, expense.currency)}
            </Text>
          </View>
        </View>

        {/* Show split info if there are multiple participants */}
        {expense.participants.length > 1 && (
          <View style={styles.splitInfo}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.splitText}>
              Split between {expense.participants.length} people
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mainInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metadata: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  splitText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
})

// TODO: Add expense category icons
// TODO: Add settlement status indicators
// TODO: Add swipe actions for quick edit/delete 