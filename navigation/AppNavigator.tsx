import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useUser } from '../hooks/useUser'
import { ActivityIndicator, View } from 'react-native'

// Import screens
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import ExpenseFormScreen from '../screens/ExpenseFormScreen'

// Stack type definitions
export type RootStackParamList = {
  Login: undefined
  Home: undefined
  ExpenseForm: { expenseId?: string }
}

const Stack = createStackNavigator<RootStackParamList>()

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
)

// Auth Stack for unauthenticated users
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
)

// Main Stack for authenticated users
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'Divix - Expenses' }}
    />
    <Stack.Screen 
      name="ExpenseForm" 
      component={ExpenseFormScreen}
      options={({ route }) => ({
        title: route.params?.expenseId ? 'Edit Expense' : 'Add Expense'
      })}
    />
  </Stack.Navigator>
)

// Main App Navigator with Auth Gate
export default function AppNavigator() {
  const { user, loading } = useUser()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  )
}

// TODO: Add deep linking support
// TODO: Add tab navigation for different sections
// TODO: Add modal navigation for forms 