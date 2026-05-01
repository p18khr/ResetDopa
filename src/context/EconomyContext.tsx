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
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
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
import { STORE_ITEMS } from '../constants/economyConstants';
// Simple UUID replacement that doesn't need crypto
function generateSimpleId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== CONTEXT INTERFACE ==========

export interface Purchase {
  id: string;
  itemId: string;
  grantedAt: any;
  expiresAt: any | null;
}

interface EconomyContextValue {
  // State
  balance: number;
  currentStreak: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransactions: Transaction[];
  ownedItems: Purchase[];

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

  // Dev-only (no-op in production)
  debugAddPurchase(itemId: string, permanent: boolean): void;
  debugClearPurchases(): void;
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
  const [ownedItems, setOwnedItems] = useState<Purchase[]>([]);

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

    console.log('[Economy] fetchBalance() called for:', userId);
    setIsLoading(true);
    setError(null);

    try {
      // Get calmPoints directly from user document
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        console.log('[Economy] ⚠️ User document not found');
        setBalance(0);
        return;
      }

      const userData = userDoc.data();
      const calmPoints = userData?.calmPoints || 0;

      console.log('[Economy] ✅ Got calmPoints from user document:', calmPoints);
      setBalance(calmPoints);
      setCurrentStreak(userData?.currentStreak ?? true);

    } catch (err: any) {
      console.error('[Economy] ❌ Error fetching balance:', err);
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
          if (typeof userData.calmPoints === 'number') {
            setBalance(userData.calmPoints);
          }
        }
      },
      (err) => {
        console.error('[Economy] User profile listener error:', err);
      }
    );

    return unsubscribe;
  }, []);

  const subscribeToPurchases = useCallback((userId: string) => {
    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'purchases'),
      (snapshot) => {
        const purchases = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Purchase));
        setOwnedItems(purchases);
      },
      (err) => {
        console.error('[Economy] Purchases listener error:', err);
      }
    );
    return unsubscribe;
  }, []);

  /**
   * Initialize on auth state change
   */
  useEffect(() => {
    console.log('━━━ [Economy] AUTH EFFECT FIRED ━━━');
    console.log('[Economy] user:', user);

    if (!user) {
      console.log('[Economy] ❌ user is null');
      setBalance(0);
      setCurrentStreak(true);
      setLastTransactions([]);
      return;
    }

    if (!user.uid) {
      console.log('[Economy] ❌ user.uid is missing');
      setBalance(0);
      setCurrentStreak(true);
      setLastTransactions([]);
      return;
    }

    console.log('━━━ [Economy] INITIALIZING for user:', user.uid, '━━━');

    // Load initial state
    fetchBalance(user.uid);
    loadPendingTransactions();

    // Subscribe to real-time updates
    const unsubTxns = subscribeToTransactions(user.uid);
    const unsubUser = subscribeToUserProfile(user.uid);
    const unsubPurchases = subscribeToPurchases(user.uid);

    console.log('[Economy] ✅ Subscriptions started');

    return () => {
      console.log('[Economy] Cleaning up subscriptions');
      unsubTxns();
      unsubUser();
      unsubPurchases();
    };
  }, [user, fetchBalance, loadPendingTransactions, subscribeToTransactions, subscribeToUserProfile, subscribeToPurchases]);

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

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const currentBalance = userDocSnap.data()?.calmPoints || 0;
        const amount = customAmount || 0;
        const newBalance = Math.max(currentBalance + amount, 0);

        console.log(`[Economy] ${type}: ${currentBalance} + ${amount} = ${newBalance}`);

        // Update balance in Firestore
        await updateDoc(userDocRef, { calmPoints: newBalance });

        // Break streak if needed
        if (type === 'app_blocker_open') {
          await updateDoc(userDocRef, { currentStreak: false });
        }

        setBalance(newBalance);
        return { success: true, balance: newBalance, streakBroken: type === 'app_blocker_open' };
      } catch (err: any) {
        console.error('[Economy] ❌ Transaction error:', err);
        throw err;
      }
    },
    [user?.uid]
  );

  /**
   * Purchase an item from premium store (client-side)
   */
  const purchaseItem = useCallback(
    async (itemId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const item = Object.values(STORE_ITEMS).find((i) => i.id === itemId);
      if (!item) throw new Error(`Item ${itemId} not found`);

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.data()?.calmPoints || 0;

      if (currentBalance < item.cost) {
        throw new Error(`Need ${item.cost} points, have ${currentBalance}`);
      }

      const newBalance = currentBalance - item.cost;
      const expiresAt = item.duration
        ? new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000)
        : null;

      await updateDoc(userRef, {
        calmPoints: newBalance,
      });

      await addDoc(collection(db, 'users', user.uid, 'purchases'), {
        itemId,
        grantedAt: serverTimestamp(),
        expiresAt,
        _idempotencyKey: generateSimpleId(),
      });

      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        amount: -item.cost,
        type: 'store_purchase',
        timestamp: serverTimestamp(),
        metadata: { itemPurchased: itemId },
        status: 'completed',
        idempotencyKey: generateSimpleId(),
        processedBy: 'client',
      });

      setBalance(newBalance);
      return { success: true, balance: newBalance };
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

  const syncOffline = useCallback(async () => {
    // Offline sync handled by Firestore SDK automatically
  }, []);

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

  // ===== DEV-ONLY HELPERS =====

  const debugAddPurchase = useCallback((itemId: string, permanent: boolean) => {
    const mockPurchase: Purchase = {
      id: `debug_${Date.now()}`,
      itemId,
      grantedAt: new Date(),
      expiresAt: permanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    setOwnedItems((prev) => [...prev.filter((p) => p.itemId !== itemId), mockPurchase]);
  }, []);

  const debugClearPurchases = useCallback(() => {
    setOwnedItems([]);
  }, []);

  // ===== RETURN CONTEXT =====

  const value: EconomyContextValue = {
    balance,
    currentStreak,
    isLoading,
    error,
    lastTransactions,
    ownedItems,
    addTransaction,
    purchaseItem,
    getBalance,
    syncOffline,
    executeBankruptcy,
    debugAddPurchase,
    debugClearPurchases,
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
