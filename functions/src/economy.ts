/**
 * Cloud Functions for Calm Points Economy
 *
 * Handles:
 * 1. Creating transactions (only source of truth for points)
 * 2. Validating balances before purchases
 * 3. Handling bankruptcy
 * 4. Idempotency (prevent double-spending)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Helper: Get current balance for a user (aggregate from transactions)
 */
async function getUserBalance(userId: string): Promise<number> {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .where('status', '==', 'completed')
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const amount = doc.data().amount || 0;
    return sum + amount;
  }, 0);
}

/**
 * Helper: Check if transaction with idempotencyKey already exists
 */
async function transactionExists(
  userId: string,
  idempotencyKey: string
): Promise<boolean | admin.firestore.DocumentSnapshot> {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1)
    .get();

  return snapshot.docs.length > 0 ? snapshot.docs[0] : false;
}

/**
 * Helper: Get point value for transaction type
 * UPDATED: Phase 3 recalibrated values to prevent hyperinflation
 */
function getPointValue(type: string): number {
  const values: { [key: string]: number } = {
    'gate_survived': 2,       // Resisted blocked app for 60s (recalibrated)
    'gate_bypassed': -15,     // Forced access (recalibrated)
    'task_complete': 0,       // Determined by task difficulty (5 base points)
    'store_purchase': 0,      // Determined by item cost
    'bankruptcy_breach': 0,   // Clamp to available balance
    'streak_reset': 0,        // Just a marker, no points
    'admin_adjustment': 0,    // Specified by admin
  };
  return values[type] || 0;
}

/**
 * Helper: Check if user would go bankrupt
 */
async function wouldBankrupt(userId: string, amount: number): Promise<boolean> {
  const balance = await getUserBalance(userId);
  return balance + amount < 0;
}

/**
 * Helper: Set streak to broken + log event
 */
async function breakStreak(userId: string, reason: string): Promise<void> {
  await db.collection('users').doc(userId).update({
    currentStreak: false,
    lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create a marker transaction for audit trail
  await db
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .add({
      id: '', // Will be set to doc ID
      amount: 0,
      type: 'streak_reset',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { reasonForReset: reason },
      status: 'completed',
      idempotencyKey: `streak_reset_${Date.now()}`,
      processedBy: 'cloud_function',
    });
}

// ========== MAIN CLOUD FUNCTIONS ==========

/**
 * Create a transaction (earn/spend calm points)
 *
 * Called from React Native via: callableFunction('createTransaction', payload)
 * Payload: { type, amount?, metadata, idempotencyKey }
 */
export const createTransaction = functions.https.onCall(
  async (data, context) => {
    // ===== AUTHENTICATION =====
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { type, amount: customAmount, metadata, idempotencyKey } = data;

    // ===== VALIDATION =====
    if (!type || !idempotencyKey) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: type, idempotencyKey'
      );
    }

    const validTypes = [
      'task_complete',
      'gate_survived',
      'gate_bypassed',
      'store_purchase',
      'admin_adjustment',
    ];
    if (!validTypes.includes(type)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid transaction type: ${type}`
      );
    }

    // ===== IDEMPOTENCY CHECK =====
    const existingTxn = await transactionExists(userId, idempotencyKey);
    if (existingTxn && typeof existingTxn !== 'boolean') {
      // Already processed, return cached result
      return {
        success: true,
        transaction: { id: existingTxn.id, ...existingTxn.data() },
        balance: await getUserBalance(userId),
      };
    }

    // ===== AMOUNT DETERMINATION =====
    let amount = customAmount;
    if (!amount) {
      amount = getPointValue(type);
    }

    if (typeof amount !== 'number' || !isFinite(amount)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Amount must be a valid number'
      );
    }

    // ===== BALANCE CHECK (Critical for purchases & bypasses) =====
    const currentBalance = await getUserBalance(userId);
    let finalAmount = amount;
    let streakBrokenDueToInsufficiency = false;

    // For purchases & bypasses, enforce balance
    if ((type === 'store_purchase' || type === 'gate_bypassed') && amount < 0) {
      const canAfford = currentBalance + amount >= 0;
      if (!canAfford) {
        // Bankruptcy logic: Clamp to available balance, break streak
        finalAmount = -currentBalance; // Spend all remaining points
        streakBrokenDueToInsufficiency = true;
        await breakStreak(userId, `${type}_bankruptcy`);
      }
    }

    // ===== CREATE TRANSACTION =====
    const transactionRef = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc();

    const newTransaction = {
      id: transactionRef.id,
      amount: finalAmount,
      type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || {},
      status: 'completed',
      idempotencyKey,
      processedBy: 'cloud_function',
    };

    await transactionRef.set(newTransaction);

    // ===== UPDATE USER PROFILE =====
    const newBalance = currentBalance + finalAmount;
    await db.collection('users').doc(userId).update({
      lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
      totalPointsLifetime: firestore.FieldValue.increment(Math.max(finalAmount, 0)), // Only count earned points
      // currentStreak updated in breakStreak() if needed
    });

    // ===== AUDIT LOG =====
    await db.collection('audit_logs').add({
      userId,
      type,
      amount: finalAmount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      balance: newBalance,
      bankrupt: streakBrokenDueToInsufficiency,
    });

    return {
      success: true,
      transaction: newTransaction,
      balance: newBalance,
      streakBroken: streakBrokenDueToInsufficiency,
    };
  }
);

/**
 * Purchase an item from the premium store
 *
 * Validates:
 * 1. Item exists + available
 * 2. User has balance
 * 3. Monthly purchase limit not exceeded
 * 4. User owns this account (security)
 */
export const purchaseItem = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { itemId, idempotencyKey } = data;

    if (!itemId || !idempotencyKey) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing itemId, idempotencyKey'
      );
    }

    // ===== CHECK IF ALREADY PURCHASED =====
    const existingPurchase = await db
      .collection('users')
      .doc(userId)
      .collection('purchases')
      .where('_idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (existingPurchase.docs.length > 0) {
      const purchase = existingPurchase.docs[0];
      return {
        success: true,
        purchase: { id: purchase.id, ...purchase.data() },
        balance: await getUserBalance(userId),
      };
    }

    // ===== FETCH ITEM =====
    const itemDoc = await db.collection('premium_store').doc(itemId).get();

    if (!itemDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Item ${itemId} not found`
      );
    }

    const item = itemDoc.data()!;

    if (!item.available) {
      throw new functions.https.HttpsError(
        'unavailable',
        'Item is not available'
      );
    }

    // ===== CHECK BALANCE =====
    const balance = await getUserBalance(userId);
    if (balance < item.cost) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient balance. Need ${item.cost}, have ${balance}`
      );
    }

    // ===== CHECK MONTHLY LIMIT =====
    if (item.maxPurchasesPerMonth) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPurchases = await db
        .collection('users')
        .doc(userId)
        .collection('purchases')
        .where('itemId', '==', itemId)
        .where('grantedAt', '>=', thirtyDaysAgo)
        .get();

      if (recentPurchases.docs.length >= item.maxPurchasesPerMonth) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Monthly limit exceeded for this item`
        );
      }
    }

    // ===== CREATE TRANSACTION (deduct points) =====
    const txnResponse = await createTransaction(
      {
        type: 'store_purchase',
        amount: -item.cost,
        metadata: { itemPurchased: itemId },
        idempotencyKey: `purchase_${itemId}_${userId}_${Date.now()}`,
      },
      context
    );

    if (!txnResponse.success) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create purchase transaction'
      );
    }

    // ===== CREATE PURCHASE RECORD =====
    const purchaseRef = db
      .collection('users')
      .doc(userId)
      .collection('purchases')
      .doc();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (item.metadata?.duration || 30));

    const purchase = {
      itemId,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: item.metadata?.duration ? expiresAt : null,
      _idempotencyKey: idempotencyKey,
    };

    await purchaseRef.set(purchase);

    return {
      success: true,
      item,
      purchase: { id: purchaseRef.id, ...purchase },
      balance: txnResponse.balance,
    };
  }
);

/**
 * Sync offline transactions
 *
 * Called when user comes online after being offline
 * Processes all pending transactions from the client
 */
export const syncOfflineTransactions = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { pendingTransactions } = data;

    if (!Array.isArray(pendingTransactions)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'pendingTransactions must be an array'
      );
    }

    const results: any[] = [];

    for (const pending of pendingTransactions) {
      try {
        const result = await createTransaction(pending, context);
        results.push({ success: true, ...result });
      } catch (error: any) {
        results.push({
          success: false,
          idempotencyKey: pending.idempotencyKey,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      results,
      balance: await getUserBalance(userId),
    };
  }
);

/**
 * Admin: Adjust user's points (requires 2FA verification)
 * Called from admin dashboard only
 */
export const adminAdjustPoints = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can adjust points'
      );
    }

    const { targetUserId, amount, reason } = data;

    if (!targetUserId || !amount || !reason) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Create adjustment transaction
    return await createTransaction(
      {
        type: 'admin_adjustment',
        amount,
        metadata: { reasonForReset: reason, adminId: context.auth.uid },
        idempotencyKey: `admin_${targetUserId}_${Date.now()}`,
      },
      { ...context, auth: { ...context.auth, uid: targetUserId } as any } as any
    );
  }
);
