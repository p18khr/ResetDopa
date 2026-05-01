import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Store items mirrored from client economyConstants — avoids needing Firestore premium_store collection
const STORE_ITEMS: Record<string, { cost: number; category: string; duration: number | null; maxPurchasesPerMonth?: number }> = {
  streak_repair:    { cost: 400,  category: 'boost',     duration: 30, maxPurchasesPerMonth: 1 },
  vantablack_theme: { cost: 1000, category: 'cosmetic',  duration: null },
};

// ========== HELPERS ==========

async function getUserBalance(userId: string): Promise<number> {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.calmPoints || 0;
}

async function transactionExists(userId: string, idempotencyKey: string): Promise<admin.firestore.DocumentSnapshot | false> {
  const snapshot = await db
    .collection('users').doc(userId).collection('transactions')
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1).get();
  return snapshot.docs.length > 0 ? snapshot.docs[0] : false;
}

async function breakStreak(userId: string, reason: string): Promise<void> {
  await db.collection('users').doc(userId).update({
    currentStreak: false,
    lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection('users').doc(userId).collection('transactions').add({
    amount: 0, type: 'streak_reset',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: { reasonForReset: reason },
    status: 'completed',
    idempotencyKey: `streak_reset_${Date.now()}`,
    processedBy: 'cloud_function',
  });
}

/**
 * Core transaction logic — used by both the onCall wrapper and purchaseItem internally
 */
async function _createTransaction(
  userId: string,
  data: { type: string; amount?: number; metadata?: any; idempotencyKey: string }
): Promise<{ success: boolean; transaction: any; balance: number; streakBroken: boolean }> {
  const { type, amount: customAmount, metadata, idempotencyKey } = data;

  const existing = await transactionExists(userId, idempotencyKey);
  if (existing) {
    return { success: true, transaction: { id: existing.id, ...existing.data() }, balance: await getUserBalance(userId), streakBroken: false };
  }

  const currentBalance = await getUserBalance(userId);
  let finalAmount = customAmount ?? 0;
  let streakBroken = false;

  if ((type === 'store_purchase' || type === 'gate_bypassed' || type === 'app_blocker_open') && finalAmount < 0) {
    if (currentBalance + finalAmount < 0) {
      finalAmount = -currentBalance;
      streakBroken = true;
      await breakStreak(userId, `${type}_bankruptcy`);
    }
  }

  const txnRef = db.collection('users').doc(userId).collection('transactions').doc();
  const txn = {
    id: txnRef.id, amount: finalAmount, type,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: metadata || {}, status: 'completed',
    idempotencyKey, processedBy: 'cloud_function',
  };
  await txnRef.set(txn);

  const newBalance = Math.max(currentBalance + finalAmount, 0);
  await db.collection('users').doc(userId).update({
    calmPoints: newBalance,
    lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
    totalPointsLifetime: admin.firestore.FieldValue.increment(Math.max(finalAmount, 0)),
  });

  return { success: true, transaction: txn, balance: newBalance, streakBroken };
}

// ========== CLOUD FUNCTIONS ==========

export const createTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const validTypes = ['task_complete','gate_survived','gate_bypassed','app_blocker_resist','app_blocker_open','store_purchase','admin_adjustment','bankruptcy_breach'];
  if (!data.type || !data.idempotencyKey) throw new functions.https.HttpsError('invalid-argument', 'Missing type or idempotencyKey');
  if (!validTypes.includes(data.type)) throw new functions.https.HttpsError('invalid-argument', `Invalid type: ${data.type}`);
  return _createTransaction(context.auth.uid, data);
});

export const purchaseItem = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');

  const userId = context.auth.uid;
  const { itemId, idempotencyKey } = data;
  if (!itemId || !idempotencyKey) throw new functions.https.HttpsError('invalid-argument', 'Missing itemId or idempotencyKey');

  const item = STORE_ITEMS[itemId];
  if (!item) throw new functions.https.HttpsError('not-found', `Item ${itemId} not found`);

  // Idempotency — already purchased with this key?
  const existingPurchase = await db.collection('users').doc(userId).collection('purchases')
    .where('_idempotencyKey', '==', idempotencyKey).limit(1).get();
  if (!existingPurchase.empty) {
    const p = existingPurchase.docs[0];
    return { success: true, purchase: { id: p.id, ...p.data() }, balance: await getUserBalance(userId) };
  }

  // Balance check
  const balance = await getUserBalance(userId);
  if (balance < item.cost) throw new functions.https.HttpsError('failed-precondition', `Need ${item.cost}, have ${balance}`);

  // Monthly limit
  if (item.maxPurchasesPerMonth) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await db.collection('users').doc(userId).collection('purchases')
      .where('itemId', '==', itemId).where('grantedAt', '>=', thirtyDaysAgo).get();
    if (recent.docs.length >= item.maxPurchasesPerMonth) {
      throw new functions.https.HttpsError('failed-precondition', 'Monthly limit exceeded');
    }
  }

  // Deduct points
  const txnResult = await _createTransaction(userId, {
    type: 'store_purchase',
    amount: -item.cost,
    metadata: { itemPurchased: itemId },
    idempotencyKey: `purchase_${itemId}_${userId}_${Date.now()}`,
  });

  // Record purchase
  const purchaseRef = db.collection('users').doc(userId).collection('purchases').doc();
  const expiresAt = item.duration ? new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000) : null;
  const purchase = { itemId, grantedAt: admin.firestore.FieldValue.serverTimestamp(), expiresAt, _idempotencyKey: idempotencyKey };
  await purchaseRef.set(purchase);

  return { success: true, item, purchase: { id: purchaseRef.id, ...purchase }, balance: txnResult.balance };
});

export const syncOfflineTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const { pendingTransactions } = data;
  if (!Array.isArray(pendingTransactions)) throw new functions.https.HttpsError('invalid-argument', 'pendingTransactions must be an array');

  const results: any[] = [];
  for (const pending of pendingTransactions) {
    try {
      const result = await _createTransaction(context.auth.uid, pending);
      results.push({ ...result, success: true });
    } catch (err: any) {
      results.push({ success: false, idempotencyKey: pending.idempotencyKey, error: err.message });
    }
  }
  return { success: true, results, balance: await getUserBalance(context.auth.uid) };
});
