// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import type { Database } from '../types/db'

/**
 * Typed Supabase client singleton for Divix application
 * 
 * Provides a fully typed interface to Supabase backend services including:
 * - Authentication (Auth)
 * - Database operations (PostgREST API) 
 * - Storage operations
 * - Edge Functions (Deno serverless functions)
 * - Real-time subscriptions
 * 
 */

// Extract configuration from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
  )
}

/**
 * Typed Supabase client instance
 * 
 * This client is configured with:
 * - Database schema types from types/db.ts
 * - Auth persistence enabled
 * - Automatic token refresh
 * - Real-time subscriptions support
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Enable auth persistence across app sessions
      persistSession: true,
      // Detect session from URL (useful for web)
      detectSessionInUrl: false,
      // Auto refresh tokens before expiry
      autoRefreshToken: true,
    },
    // TODO: Add custom headers for analytics/telemetry
    // TODO: Configure retry logic for network failures
    // TODO: Add request/response interceptors for logging
  }
)

/**
 * Utility function to check if Supabase client is properly initialized
 * 
 * @returns {boolean} True if client has valid configuration
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Get current Supabase project URL
 * 
 * @returns {string} The configured Supabase project URL
 */
export const getSupabaseUrl = (): string => supabaseUrl

// TODO: Add connection health check utility
// TODO: Add offline detection and queuing
// TODO: Add performance monitoring hooks
