import { supabase } from '../lib/supabase'
import type { 
  AuthResponse, 
  AuthTokenResponse, 
  Session, 
  User,
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials 
} from '@supabase/supabase-js'

/**
 * Authentication service for Divix application
 * 
 * Provides secure user authentication using Supabase Auth with:
 * - Email/password authentication
 * - Session management
 * - Automatic token refresh
 * - User profile integration
 */

/**
 * Sign up a new user with email and password
 * 
 * Creates a new user account and sends email verification.
 * User will need to confirm their email before they can sign in.
 * 
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @param options - Additional user metadata
 * @returns Promise with user data or error
 * 
 */
export const signUp = async (
  email: string, 
  password: string,
  options?: {
    firstName?: string
    lastName?: string
    data?: Record<string, any>
  }
): Promise<AuthResponse> => {
  const credentials: SignUpWithPasswordCredentials = {
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: {
        first_name: options?.firstName,
        last_name: options?.lastName,
        full_name: options?.firstName && options?.lastName 
          ? `${options.firstName} ${options.lastName}` 
          : undefined,
        ...options?.data,
      },
    },
  }

  const result = await supabase.auth.signUp(credentials)
  
  // TODO: Add user profile creation in public.users table
  // TODO: Add analytics tracking for signup events
  // TODO: Add email validation and sanitization
  
  return result
}

/**
 * Sign in existing user with email and password
 * 
 * Authenticates user and establishes session.
 * Returns user data and session information on success.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with session data or error
 * 
 */
export const signIn = async (
  email: string, 
  password: string
): Promise<AuthResponse> => {
  const credentials: SignInWithPasswordCredentials = {
    email: email.toLowerCase().trim(),
    password,
  }

  const result = await supabase.auth.signInWithPassword(credentials)
  
  // TODO: Add last login timestamp update
  // TODO: Add device/session tracking
  // TODO: Add failed login attempt tracking
  
  return result
}

/**
 * Sign out current user
 * 
 * Clears user session and removes all authentication tokens.
 * User will need to sign in again to access protected resources.
 * 
 * @returns Promise that resolves when sign out is complete
 */
export const signOut = async () => {
  const result = await supabase.auth.signOut()
  
  // TODO: Clear local cache/storage
  // TODO: Add analytics for signout events
  // TODO: Invalidate any cached user data
  
  return result
}

/**
 * Get current user session
 * 
 * Retrieves the current user session if user is authenticated.
 * Session includes user data and JWT tokens.
 * 
 * @returns Promise with current session or null
 * 
 */
export const getSession = async () => {
  return await supabase.auth.getSession()
}

/**
 * Get current authenticated user
 * 
 * Retrieves current user data from JWT token.
 * Does not make network request - reads from local session.
 * 
 * @returns Promise with current user or null
 */
export const getCurrentUser = async (): Promise<{ data: { user: User | null }, error: any }> => {
  return await supabase.auth.getUser()
}

/**
 * Refresh current session
 * 
 * Manually refresh the user's session and JWT tokens.
 * Usually handled automatically by Supabase client.
 * 
 * @returns Promise with refreshed session data
 */
export const refreshSession = async () => {
  return await supabase.auth.refreshSession()
}

/**
 * Reset password for user email
 * 
 * Sends password reset email to user.
 * User will receive link to reset their password.
 * 
 * @param email - User's email address
 * @returns Promise that resolves when reset email is sent
 */
export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

/**
 * Update user password
 * 
 * Updates the current user's password.
 * User must be authenticated to perform this action.
 * 
 * @param newPassword - New password (minimum 6 characters)
 * @returns Promise that resolves when password is updated
 */
export const updatePassword = async (newPassword: string) => {
  return await supabase.auth.updateUser({ password: newPassword })
}

/**
 * Update user email
 * 
 * Updates the current user's email address.
 * User will need to verify the new email address.
 * 
 * @param newEmail - New email address
 * @returns Promise that resolves when email update is initiated
 */
export const updateEmail = async (newEmail: string) => {
  return await supabase.auth.updateUser({ email: newEmail.toLowerCase().trim() })
}

// TODO: Add OAuth providers (Google, Apple, Facebook)
// TODO: Add phone/SMS authentication
// TODO: Add multi-factor authentication (MFA)
// TODO: Add session management utilities
// TODO: Add password strength validation
// TODO: Add rate limiting for auth attempts
// TODO: Add audit logging for security events
