// Authentication service module
// Centralizes all Firebase Auth operations

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
// @ts-expect-error - auth is imported from JavaScript config file
import { auth } from '../config/firebase';

// @ts-expect-error - Explicitly type the auth instance
const authInstance: Auth = auth as any;

/**
 * Authentication service result types
 */
export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  code?: string;
}

export interface AuthStateCallback {
  (user: FirebaseUser | null): void;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('[AuthService] Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in',
      code: error.code,
    };
  }
}

/**
 * Create new user account
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('[AuthService] Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create account',
      code: error.code,
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    await firebaseSendPasswordResetEmail(authInstance, email);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[AuthService] Password reset error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
      code: error.code,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await firebaseSignOut(authInstance);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[AuthService] Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out',
      code: error.code,
    };
  }
}

/**
 * Re-authenticate user with email and password
 * Required before sensitive operations like account deletion
 */
export async function reauthenticate(email: string, password: string): Promise<AuthResult> {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in',
        code: 'auth/no-current-user',
      };
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error('[AuthService] Re-authentication error:', error);
    return {
      success: false,
      error: error.message || 'Failed to re-authenticate',
      code: error.code,
    };
  }
}

/**
 * Delete current user account
 */
export async function deleteAccount(user: FirebaseUser): Promise<AuthResult> {
  try {
    await firebaseDeleteUser(user);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[AuthService] Delete account error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete account',
      code: error.code,
    };
  }
}

/**
 * Listen to authentication state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(callback: AuthStateCallback): () => void {
  return onAuthStateChanged(authInstance, callback);
}

/**
 * Get currently signed-in user
 */
export function getCurrentUser(): FirebaseUser | null {
  return authInstance.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authInstance.currentUser !== null;
}

/**
 * Get user UID
 */
export function getUserId(): string | null {
  return authInstance.currentUser?.uid || null;
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  return authInstance.currentUser?.email || null;
}
