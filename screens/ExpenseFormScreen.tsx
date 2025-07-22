import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { useUser } from '../hooks/useUser'
import { addExpense, updateExpense } from '../services/expenses'
import type { RootStackParamList } from '../navigation/AppNavigator'
import type { Database } from '../types/db'

type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type NavigationProp = StackNavigationProp<RootStackParamList, 'ExpenseForm'>
type RouteProp_ = RouteProp<RootStackParamList, 'ExpenseForm'>

const currencies = ['USD', 'EUR', 'GBP', 'TRY', 'CAD', 'AUD']

export default function ExpenseFormScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProp_>()
  const { user } = useUser()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
  })

  const isEditing = !!route.params?.expenseId

  useEffect(() => {
    // TODO: Load existing expense data if editing
    if (isEditing) {
      // Placeholder for loading existing expense data
      console.log('Loading expense:', route.params.expenseId)
    }
  }, [isEditing, route.params?.expenseId])

  const handleSave = async () => {
    if (!user) return

    // Validation
    if (!formData.amount.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const expenseData: ExpenseInsert = {
        user_id: user.id,
        amount,
        description: formData.description.trim(),
        currency: formData.currency,
        date: formData.date,
        participants: [user.id], // For now, just the current user
        split_method: 'equal',
        splits: { [user.id]: amount }
      }

      const { error } = isEditing
        ? await updateExpense(route.params.expenseId!, expenseData)
        : await addExpense(expenseData)

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert(
          'Success',
          `Expense ${isEditing ? 'updated' : 'added'} successfully`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        )
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            value={formData.amount}
            onChangeText={(value: string) => updateFormData('amount', value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(value: string) => updateFormData('description', value)}
            placeholder="What was this expense for?"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Currency</Text>
          <TextInput
            style={styles.input}
            value={formData.currency}
            onChangeText={(value: string) => updateFormData('currency', value)}
            placeholder="USD, EUR, GBP, etc."
          />
          <Text style={styles.hint}>Supported: {currencies.join(', ')}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value: string) => updateFormData('date', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

// TODO: Add date picker component
// TODO: Add participant selection for group expenses
// TODO: Add expense split configuration
// TODO: Add photo/receipt attachment
// TODO: Add expense categories 