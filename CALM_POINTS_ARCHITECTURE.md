# Calm Points Economy Architecture

## Overview
The Calm Points Economy is the internal currency system tying together:
- **Vagus Gate** (App Blocker) - Users earn/lose points when resisting/bypassing blocked apps
- **Daily Tasks** - Completing tasks earns calm points
- **Premium Store** - Users spend points on features, themes, and boosts
- **Streak System** - Bankruptcy (overspending) breaks streaks but doesn't prevent recovery

---

## 1. Firestore Schema

### Collection: `users/{userId}`
```firestore
{
  email: string,
  createdAt: Timestamp (server),
  onboardingCompleted: boolean,
  currentStreak: boolean = true,
  lastActivityDate: Timestamp,
  totalPointsLifetime: number = 0,
  metadata: {
    deviceId: string,
    lastDeviceTime: Timestamp
  }
}
```

### Sub-collection: `users/{userId}/transactions/{transactionId}`
```firestore
{
  id: string (same as doc ID),
  amount: number (positive = earned, negative = spent),
  type: 'task_complete' | 'gate_survived' | 'gate_bypassed' | 'store_purchase' | 'streak_reset' | 'admin_adjustment',
  timestamp: Timestamp (server, MUST be set by Cloud Function),
  metadata: {
    taskId?: string,
    taskTitle?: string,
    appBlocked?: string,
    itemPurchased?: string,
    reasonForReset?: string
  },
  status: 'completed' | 'pending' (pending for offline sync),
  idempotencyKey: string (UUID to prevent duplicate processing),
  processedBy: 'cloud_function' | 'rule' (audit trail)
}
```

### Collection: `premium_store/{itemId}`
```firestore
{
  id: string (same as doc ID),
  name: string,
  description: string,
  cost: number (calm points required),
  category: 'theme' | 'feature' | 'boost' | 'cosmetic',
  sku: string (for analytics),
  available: boolean,
  maxPurchasesPerMonth: number? (null = unlimited),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  requiresPremium: boolean
}
```

---

## 2. Edge Case Handling Rules

### Rule: Bankruptcy (Insufficient Balance)
**Scenario:** User has 20 points, tries to bypass gate (-100 cost)

**Logic:**
1. Cloud Function reads transaction request: `{ type: 'gate_bypassed', amount: -100 }`
2. Cloud Function aggregates current balance from all completed transactions
3. If `balance + amount < 0`:
   - Create transaction with `amount = -balance` (clamp to available)
   - Set `users/{userId}.currentStreak = false`
   - Set `users/{userId}.lastActivityDate = now()`
   - Emit event: `streak_broken` for UI notification
4. Final balance = 0 (never negative)
5. User can recover by completing tasks going forward

**Code Path:** See `Cloud Functions > processTransaction()`

---

### Rule: Offline Sync
**Scenario:** User completes task offline, goes online

**Logic:**
1. Client creates local transaction: `{ status: 'pending', idempotencyKey: UUID }`
2. Client queues in AsyncStorage: `@pending_transactions`
3. When online, `onNetworkStateChange()` triggers sync
4. For each pending transaction:
   - Call Cloud Function: `createTransaction({ ...transaction, idempotencyKey })`
   - Cloud Function checks: "Has this idempotencyKey been processed before?"
   - If YES: return existing transaction (idempotent)
   - If NO: create new transaction with server timestamp
5. On success, remove from `@pending_transactions`

**Code Path:** See `EconomyContext.tsx > syncOfflineTransactions()`

---

### Rule: Fraud Prevention (Time Travel)
**Scenario:** User changes device time to backdate streak

**Logic:**
1. Client submits transaction with local `timestamp`
2. Cloud Function overwrites with `FieldValue.serverTimestamp()`
3. Security Rule validates:
   - Server timestamp must be within ±30 minutes of transaction type's expected time
   - For `gate_survived`: Must align with recent app block events (via AppMonitorService logs)
   - For `task_complete`: Timestamp must be after task was assigned
4. If validation fails, transaction is rejected with `403 Unauthorized`
5. Client receives error, transaction stays pending for retry

**Code Path:** See `Firestore Rules > validateTimestamp()`

---

## 3. Point Values & Transactions

| Transaction Type | Points | Trigger | Fraud Risk |
|---|---|---|---|
| `gate_survived` | +50 | User resists blocked app for 60s | Low (server timestamps) |
| `gate_bypassed` | -100 | User closes overlay to access app | Medium (can be triggered frequently) |
| `task_complete` | +10 to +50 | User completes assigned task | Low (task has deadline) |
| `store_purchase` | (-cost) | User buys item from store | Low (balance check enforced) |
| `streak_reset` | 0 | Automatic on bankruptcy | N/A |
| `admin_adjustment` | ±N | Support/Admin override | High (requires 2FA) |

---

## 4. Current Balance Derivation

**Why not store `balance` directly?**
- Risk: Direct writes can be manipulated
- Risk: Floating-point precision errors accumulate
- Safe: Aggregate from immutable ledger

**Calculation:**
```
currentBalance = sum(
  SELECT amount FROM transactions
  WHERE userId = {userId} AND status = 'completed'
)
```

**Performance:** Indexed on `(userId, status, timestamp)` for fast aggregation

---

## 5. Frontend Interaction Flow

### App Blocker (Vagus Gate) → Points
```
User opens blocked app
  ↓
AppAccessibilityService detects + launches BlockOverlayActivity
  ↓
User waits 60s OR taps "Return to DopaReset"
  ↓
[IF waited 60s]
  → Call: EconomyContext.addTransaction('gate_survived', +50, { appBlocked: 'com.instagram.android' })
  → Cloud Function creates transaction
  → Balance updates in real-time
  → UI shows: "+50 Calm Points! 🧘"

[IF bypassed (tapped close)]
  → Check balance before deducting
  → Call: EconomyContext.addTransaction('gate_bypassed', -100, { appBlocked: '...' })
  → Cloud Function creates transaction + checks bankruptcy
  → If bankrupt: currentStreak = false, show notification
  → Balance updates, streak broken if needed
```

### Premium Store → Points
```
User opens Store → selects item ($50 cost)
  ↓
Call: EconomyContext.purchaseItem('ai_protocol')
  ↓
Cloud Function:
  1. Check balance >= cost
  2. Check maxPurchases (if monthly limit)
  3. Create transaction: { type: 'store_purchase', amount: -50 }
  4. Grant item to user: users/{userId}/purchases/{itemId} = { grantedAt, expiresAt? }
  ↓
On success: Show success toast, disable button
On failure: Show "Insufficient Calm Points" + suggest tasks
```

### Daily Tasks → Points
```
User completes assigned task
  ↓
Dashboard calls updateTaskCompletion(taskId)
  ↓
EconomyContext.addTransaction('task_complete', points, { taskId, taskTitle })
  ↓
Cloud Function validates:
  - Task exists + is assigned to user
  - Not already completed
  - Timestamp is reasonable (within task deadline + 24h grace)
  ↓
Transaction created, balance updates
  UI shows: "+25 Calm Points! Task complete."
```

---

## 6. Current Streak Management

**When does `currentStreak` break?**
- User's balance goes below 0 (bankruptcy on gate bypass or purchase)
- Manual reset via admin
- User explicitly quits challenge

**Recovery:**
- Complete any task (no minimum balance required)
- Each completed task = +10 baseline points
- No special "streak recovery" needed—just resume normal activity

**Visualization:**
```
Dashboard shows:
  Streak: 5 days ✅ (green, currentStreak = true)
  Calm Points: 250

After bankruptcy:
  Streak: 5 days 🔴 (red, currentStreak = false)
  Calm Points: 0
  Hint: "Complete a task to resume your streak"
```

---

## 7. Security Considerations

### Firestore Rules
- ❌ Users CANNOT directly write to transactions
- ✅ Cloud Functions are the ONLY writer to transactions
- ❌ Users CANNOT modify timestamps
- ✅ Timestamps MUST be server-generated
- ✅ Users CAN read their own transactions
- ❌ Users CANNOT read other users' transactions

### Cloud Function Validation
- Idempotency keys prevent double-spending
- Server timestamps prevent time-travel cheating
- Balance checks prevent overspending
- Rate limiting: max 100 transactions per user per hour

### Offline Sync Security
- Pending transactions are stored locally only (not synced to cloud)
- Idempotency keys ensure duplicates are ignored
- If sync fails, user is prompted to retry with clear error message

---

## 8. Monitoring & Analytics

**Key Metrics:**
- Average transaction value by type
- Bankruptcy rate (% of users who hit 0 balance)
- Store conversion rate (% of users making purchases)
- Streak duration distribution
- Offline sync failure rate

**Alerts:**
- User creates >50 transactions in 1 hour (fraud detection)
- User's balance inconsistency (query aggregate ≠ stored value)
- Cloud Function error rate >5%

