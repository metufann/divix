import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'

import { useUser } from '../hooks/useUser'
import { listUserExpenses } from '../services/expenses'
import { signOut } from '../services/auth'
import ExpenseCard from '../components/ExpenseCard'
import type { RootStackParamList } from '../navigation/AppNavigator'
import type { Database } from '../types/db'

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  user?: {
    id: string
    email: string
    name: string | null
  }
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { user } = useUser()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadExpenses = async (isRefresh = false) => {
    if (!user) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const { data, error } = await listUserExpenses(user.id)
      
      if (error) {
        Alert.alert('Error', 'Failed to load expenses')
      } else {
        setExpenses(data || [])
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadExpenses()
    }, [user])
  )

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOut()
          }
        }
      ]
    )
  }

  const renderExpense = ({ item }: { item: Expense }) => (
    <ExpenseCard 
      expense={item}
      onPress={() => navigation.navigate('ExpenseForm', { expenseId: item.id })}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No expenses yet</Text>
      <Text style={styles.emptyText}>Tap the + button to add your first expense</Text>
    </View>
  )

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadExpenses(true)}
          />
        }
        contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ExpenseForm', {})}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  signOutButton: {
    marginRight: 16,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
})

// TODO: Add expense filtering and search
// TODO: Add group expenses view
// TODO: Add balance summary section 