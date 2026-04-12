/**
 * Economy Context (Calm Points Management)
 *
 * Manages:
 * 1. Current balance (derived from ledger)
 * 2. Streak status
 * 3. Pending offline transactions
 * 4. Real-time updates from Firestore
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  httpsCallable,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import {
  EconomyState,
  Transaction,
  TransactionType,
  TransactionMetadata,
  CreateTransactionRequest,
  CreateTransactionResponse,
  PendingTransaction,
} from '../types/economy';
import { v4 as uuidv4 } from 'uuid';

// ========== CONTEXT INTERFACE ==========

interface EconomyContextValue {
  // State
  balance: number;
  currentStreak: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransactions: Transaction[];

  // Methods
  addTransaction(
    type: TransactionType,
    metadata: TransactionMetadata,
    customAmount?: number
  ): Promise<CreateTransactionResponse>;

  purchaseItem(itemId: string): Promise<any>;
  getBalance(): Promise<number>;
  syncOffline(): Promise<void>;
  executeBankruptcy(appBlocked: string): Promise<void>;
}

// ========== CONTEXT CREATION ==========

const EconomyContext = createContext<EconomyContextValue | undefined>(undefined);

// ========== PROVIDER COMPONENT ==========

interface EconomyProviderProps {
  children: React.ReactNode;
}

export function EconomyProvider({ children }: EconomyProviderProps) {
  const { user, authState } = useAuth();

  // ===== STATE =====
  const [balance, setBalance] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransactions, setLastTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);

  // ===== INITIALIZATION & SYNC =====

  /**
   * Load pending transactions from local storage
   */
  const loadPendingTransactions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@pending_transactions');
      if (stored) {
        setPendingTransactions(JSON.parse(stored));
      }
    } catch (err) {
      console.error('[Economy] Error loading pending transactions:', err);
    }
  }, []);

  /**
   * Fetch current balance from Firestore (aggregate transactions)
   */
  const fetchBalance = useCallback(async (userId: string) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Query all completed transactions
      const transactionsQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('status', '==', 'completed'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(transactionsQuery);

      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Transaction));

      // Derive balance from transactions
      const derivedBalance = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
      setBalance(Math.max(derivedBalance, 0)); // Never negative

      // Get last 10 for display
      setLastTransactions(transactions.slice(0, 10));

      // Get user profile for streak status
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setCurrentStreak(userData.currentStreak ?? true);
      }
    } catch (err: any) {
      console.error('[Economy] Error fetching balance:', err);
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set up real-time listener for transactions
   */
  const subscribeToTransactions = useCallback((userId: string) => {
    const transactionsQuery = query(
      collection(db, 'users', userId, 'transactions'),
      where('status', '==', 'completed'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Transaction));

        setLastTransactions(transactions);

        // Recalculate balance
        const newBalance = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
        setBalance(Math.max(newBalance, 0));
      },
      (err) => {
        console.error('[Economy] Snapshot listener error:', err);
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Subscribe to user profile changes (for streak)
   */
  const subscribeToUserProfile = useCallback((userId: string) => {
    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const userData = snapshot.data();
        if (userData) {
          setCurrentStreak(userData.currentStreak ?? true);
        }
      },
      (err) => {
        console.error('[Economy] User profile listener error:', err);
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Initialize on auth state change
   */
  useEffect(() => {
    if (!user?.uid) {
      setBalance(0);
      setCurrentStreak(true);
      setLastTransactions([]);
      return;
    }

    // Load initial state
    fetchBalance(user.uid);
    loadPendingTransactions();

    // Subscribe to real-time updates
    const unsubTxns = subscribeToTransactions(user.uid);
    const unsubUser = subscribeToUserProfile(user.uid);

    return () => {
      unsubTxns();
      unsubUser();
    };
  }, [user?.uid, fetchBalance, loadPendingTransactions, subscribeToTransactions, subscribeToUserProfile]);

  // ===== METHODS =====

  /**
   * Add a transaction (earn/lose points)
   *
   * Flow:
   * 1. Create idempotencyKey for deduplication
   * 2. Call Cloud Function
   * 3. Update local state
   * 4. If offline, queue locally
   */
  const addTransaction = useCallback(
    async (
      type: TransactionType,
      metadata: TransactionMetadata,
      customAmount?: number
    ): Promise<CreateTransactionResponse> => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const idempotencyKey = uuidv4();

      const payload: CreateTransactionRequest = {
        type,
        metadata,
        idempotencyKey,
      };

      if (customAmount) {
        payload.amount = customAmount;
      }

      try {
        // Call Cloud Function
        const createTransactionFn = httpsCallable(db.app as any, 'createTransaction');
        const response = (await createTransactionFn(payload)) as any;

        if (response.data.success) {
          setBalance(response.data.balance);
          if (response.data.streakBroken) {
            setCurrentStreak(false);
          }
          return response.data;
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (err: any) {
        // If offline or error, queue locally
        console.warn('[Economy] Transaction failed, queuing locally:', err.message);

        const pending: PendingTransaction = {
          ...payload,
          localId: uuidv4(),
          createdAtLocal: Date.now(),
          retryCount: 0,
        };

        const updated = [...pendingTransactions, pending];
        setPendingTransactions(updated);
        await AsyncStorage.setItem('@pending_transactions', JSON.stringify(updated));

        return {
          success: false,
          error: 'Transaction queued for sync when online',
        };
      }
    },
    [user?.uid, pendingTransactions]
  );

  /**
   * Purchase an item from premium store
   */
  const purchaseItem = useCallback(
    async (itemId: string) => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      try {
        const purchaseItemFn = httpsCallable(db.app as any, 'purchaseItem');
        const response = (await purchaseItemFn({
          itemId,
          idempotencyKey: uuidv4(),
        })) as any;

        if (response.data.success) {
          setBalance(response.data.balance);
          return response.data;
        } else {
          throw new Error(response.data.error || 'Purchase failed');
        }
      } catch (err: any) {
        console.error('[Economy] Purchase error:', err);
        throw err;
      }
    },
    [user?.uid]
  );

  /**
   * Get current balance (derive from transactions)
   */
  const getBalance = useCallback(async (): Promise<number> => {
    // Return current balance immediately (it's already synchronous in state)
    return balance;
  }, [balance]);

  /**
   * Sync offline transactions when coming online
   */
  const syncOffline = useCallback(async () => {
    if (!user?.uid || pendingTransactions.length === 0) {
      return;
    }

    console.log(`[Economy] Syncing ${pendingTransactions.length} offline transactions...`);

    try {
      const syncOfflineFn = httpsCallable(db.app as any, 'syncOfflineTransactions');
      const response = (await syncOfflineFn({
        pendingTransactions: pendingTransactions.map(
          ({ localId, createdAtLocal, retryCount, ...rest }) => rest
        ),
      })) as any;

      if (response.data.success) {
        // Clear successful pending transactions
        const failedKeys = new Set(
          response.data.results
            .filter((r: any) => !r.success)
            .map((r: any) => r.idempotencyKey)
        );

        const remaining = pendingTransactions.filter(
          (t) => failedKeys.has(t.idempotencyKey)
        );

        setPendingTransactions(remaining);
        await AsyncStorage.setItem('@pending_transactions', JSON.stringify(remaining));

        // Update balance
        setBalance(response.data.balance);

        console.log(`[Economy] Sync complete. ${response.data.results.filter((r: any) => r.success).length} synced.`);
      }
    } catch (err: any) {
      console.error('[Economy] Offline sync failed:', err);
      // Will retry on next network change
    }
  }, [user?.uid, pendingTransactions]);

  /**
   * Execute bankruptcy when user confirms in BankruptcyModal
   *
   * Consequences (IRREVERSIBLE):
   * 1. Set balance to 0 (wipe all points)
   * 2. Set currentStreak to 0 (break streak)
   * 3. Create 'bankruptcy_breach' transaction (audit trail)
   * 4. Unlock the requested app
   */
  const executeBankruptcy = useCallback(
    async (appBlocked: string) => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      try {
        console.log('[Economy] Executing bankruptcy for user...');

        // Create bankruptcy transaction via Cloud Function
        const bankruptcyTxn = await addTransaction(
          'bankruptcy_breach' as any,
          {
            appBlocked,
            reasonForReset: 'insufficient_balance_at_gate_bypass',
          },
          -balance // Deduct entire remaining balance
        );

        if (!bankruptcyTxn.success) {
          throw new Error('Failed to create bankruptcy transaction');
        }

        // Update local state
        setBalance(0);
        setCurrentStreak(false);

        console.log('[Economy] Bankruptcy executed successfully');
      } catch (err: any) {
        console.error('[Economy] Bankruptcy execution error:', err);
        throw err;
      }
    },
    [user?.uid, balance, addTransaction]
  );

  // ===== RETURN CONTEXT =====

  const value: EconomyContextValue = {
    balance,
    currentStreak,
    isLoading,
    error,
    lastTransactions,
    addTransaction,
    purchaseItem,
    getBalance,
    syncOffline,
    executeBankruptcy,
  };

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}

// ========== HOOK ==========

/**
 * Use Economy Context
 */
export function useEconomy(): EconomyContextValue {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within EconomyProvider');
  }
  return context;
}
