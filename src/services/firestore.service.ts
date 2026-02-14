// Firestore database service module
// Centralizes all Firebase Firestore operations

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Type the Firestore instance from JavaScript config
const dbInstance: Firestore = db as any;

/**
 * Firestore operation result types
 */
export interface FirestoreResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface BatchSaveOptions {
  debounceMs?: number;
  retryOnFailure?: boolean;
  retryDelayMs?: number;
}

/**
 * Default options for batch saves
 */
const DEFAULT_BATCH_OPTIONS: BatchSaveOptions = {
  debounceMs: 50,
  retryOnFailure: true,
  retryDelayMs: 1000,
};

/**
 * Get user document reference
 */
export function getUserDocRef(uid: string): DocumentReference {
  return doc(dbInstance, 'users', uid);
}

/**
 * Get user document data
 */
export async function getUserData<T = Record<string, any>>(uid: string): Promise<FirestoreResult<T>> {
  try {
    const docRef = getUserDocRef(uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        data: docSnap.data() as T,
      };
    } else {
      return {
        success: false,
        error: 'User document does not exist',
        code: 'not-found',
      };
    }
  } catch (error: any) {
    console.error('[FirestoreService] Get user data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get user data',
      code: error.code,
    };
  }
}

/**
 * Create new user document
 */
export async function createUserDocument(
  uid: string,
  data: Record<string, any>
): Promise<FirestoreResult> {
  try {
    const docRef = getUserDocRef(uid);
    await setDoc(docRef, data);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[FirestoreService] Create user document error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user document',
      code: error.code,
    };
  }
}

/**
 * Update user document
 */
export async function updateUserData(
  uid: string,
  updates: Record<string, any>
): Promise<FirestoreResult> {
  try {
    const docRef = getUserDocRef(uid);
    await updateDoc(docRef, updates);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[FirestoreService] Update user data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user data',
      code: error.code,
    };
  }
}

/**
 * Update user document with retry on failure
 */
export async function updateUserDataWithRetry(
  uid: string,
  updates: Record<string, any>,
  retryDelayMs: number = 1000
): Promise<FirestoreResult> {
  const result = await updateUserData(uid, updates);

  // Retry once on failure
  if (!result.success) {
    console.warn('[FirestoreService] Retrying updateUserData after', retryDelayMs, 'ms');
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    return await updateUserData(uid, updates);
  }

  return result;
}

/**
 * Delete user document
 */
export async function deleteUserDocument(uid: string): Promise<FirestoreResult> {
  try {
    const docRef = getUserDocRef(uid);
    await deleteDoc(docRef);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[FirestoreService] Delete user document error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user document',
      code: error.code,
    };
  }
}

/**
 * Set specific field in user document
 */
export async function setUserField(
  uid: string,
  fieldPath: string,
  value: any
): Promise<FirestoreResult> {
  try {
    const docRef = getUserDocRef(uid);
    await updateDoc(docRef, { [fieldPath]: value });
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[FirestoreService] Set user field error:', error);
    return {
      success: false,
      error: error.message || 'Failed to set user field',
      code: error.code,
    };
  }
}

/**
 * Batch save queue manager for context-level batching
 */
export class BatchSaveManager {
  private saveQueue: Promise<void> = Promise.resolve();
  private pendingUpdates: Record<string, any> = {};
  private saveBatchTimeout: NodeJS.Timeout | null = null;
  private options: BatchSaveOptions;
  private uid: string;

  constructor(uid: string, options: Partial<BatchSaveOptions> = {}) {
    this.uid = uid;
    this.options = { ...DEFAULT_BATCH_OPTIONS, ...options };
  }

  /**
   * Queue updates for batched save
   */
  queueUpdates(updates: Record<string, any>): void {
    // Prevent queuing if no user ID (safety check)
    if (!this.uid) {
      if (__DEV__) console.warn('[BatchSaveManager] Attempted to queue updates without user ID');
      return;
    }

    Object.assign(this.pendingUpdates, updates);

    if (this.saveBatchTimeout) {
      clearTimeout(this.saveBatchTimeout);
    }

    this.saveBatchTimeout = setTimeout(() => {
      this.flush();
    }, this.options.debounceMs);
  }

  /**
   * Flush pending updates immediately
   */
  async flush(): Promise<void> {
    if (Object.keys(this.pendingUpdates).length === 0) {
      return;
    }

    // Safety check: prevent flush if no user ID
    if (!this.uid) {
      if (__DEV__) console.warn('[BatchSaveManager] Attempted to flush without user ID');
      this.pendingUpdates = {}; // Clear pending updates
      return;
    }

    const batchedUpdates = { ...this.pendingUpdates };
    this.pendingUpdates = {};

    this.saveQueue = this.saveQueue.then(async () => {
      try {
        // Use mergeUserData (setDoc with merge) instead of updateUserData (updateDoc)
        // This creates the document if it doesn't exist, preventing permission errors
        const result = await mergeUserData(this.uid, batchedUpdates);

        // Retry on failure if enabled
        if (!result.success && this.options.retryOnFailure) {
          if (__DEV__) console.warn('[BatchSaveManager] Retrying after', this.options.retryDelayMs, 'ms');
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelayMs));
          const retryResult = await mergeUserData(this.uid, batchedUpdates);
          if (!retryResult.success && __DEV__) {
            console.error('[BatchSaveManager] Retry failed:', retryResult.error);
          }
        } else if (!result.success && __DEV__) {
          console.error('[BatchSaveManager] Failed to save batch:', result.error);
        }
      } catch (error) {
        if (__DEV__) console.error('[BatchSaveManager] Unexpected error:', error);
      }
    });

    await this.saveQueue;
  }

  /**
   * Destroy the manager and clear pending updates
   * Call this when the user logs out to prevent orphaned writes
   */
  destroy(): void {
    this.clear();
    this.saveQueue = Promise.resolve();
  }

  /**
   * Clear pending updates without saving
   */
  clear(): void {
    this.pendingUpdates = {};
    if (this.saveBatchTimeout) {
      clearTimeout(this.saveBatchTimeout);
      this.saveBatchTimeout = null;
    }
  }

  /**
   * Get pending updates count
   */
  getPendingCount(): number {
    return Object.keys(this.pendingUpdates).length;
  }
}

/**
 * Helper: Check if document exists
 */
export async function documentExists(uid: string): Promise<boolean> {
  try {
    const docRef = getUserDocRef(uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('[FirestoreService] Document exists check error:', error);
    return false;
  }
}

/**
 * Helper: Merge data into user document (creates if doesn't exist)
 */
export async function mergeUserData(
  uid: string,
  data: Record<string, any>
): Promise<FirestoreResult> {
  try {
    const docRef = getUserDocRef(uid);
    await setDoc(docRef, data, { merge: true });
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[FirestoreService] Merge user data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to merge user data',
      code: error.code,
    };
  }
}
