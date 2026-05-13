# App Blocker Balance Sync Fix - Complete Implementation

## Problem Diagnosis

**Root Cause:** Race condition where BlockOverlayActivity displayed 0 Calm Points even though user had 277.

### Timeline of the Bug:
1. User opens blocked app
2. AppMonitorService detects it → launches BlockOverlayActivity immediately
3. BlockOverlayActivity.onCreate() calls loadBalanceAndStreak() → reads SharedPreferences (shows 0)
4. Meanwhile, EconomyContext is still loading balance from Firestore (async operation)
5. useSyncBalanceToNative had skip logic: "only sync if balance > 0"
6. Result: Balance 0 gets written to SharedPreferences, then when Firestore finishes loading, blocker already showed 0

## Solution Architecture

### Three-Layer Fix:

#### 1. **Always-Sync Pattern** (useSyncBalanceToNative.js)
- **Old behavior:** Skip syncing when balance === 0 (to avoid syncing initial state)
- **New behavior:** Always sync, even on 0, because:
  - Native needs to know when loading is complete (flag set)
  - Race condition can make 0 appear before balance loads
  - Cold start scenario needs reliable state communication

**File:** `src/hooks/useSyncBalanceToNative.js`
```javascript
// REMOVED the skip-on-zero logic
// NOW: Always sync balance (even if 0), because native needs confirmation
```

#### 2. **Cold Start Retry** (BlockOverlayActivity.kt)
- When balance = 0 AND sync hasn't occurred yet (`balance_synced_once` flag)
- Waits 1.5 seconds and retries loadBalanceAndStreak()
- This allows Firestore to complete initial load before blocker shows

**File:** `android/app/src/main/java/com/dopareset/app/appblocker/BlockOverlayActivity.kt`
```kotlin
// NEW: Checks balance_synced_once flag
if (userBalance == 0 && !hasSyncedOnce) {
    // Cold start detected - retry after delay
    handler.postDelayed({ loadBalanceAndStreak() }, 1500)
}
```

#### 3. **Transaction Processing System** (useAppBlockerTransactions.js + AppBlockerModule.kt)
- New native methods: `checkAppBlockerFlags()`, `clearAppBlockerFlags()`
- React polls native every 3 seconds for pending transactions
- Transactions processed: "I'm Good" (+2) and "Open App" (-15 + -1 streak)

**Files:**
- `src/hooks/useAppBlockerTransactions.js` - React transaction listener
- `android/app/src/main/java/com/dopareset/app/appblocker/AppBlockerModule.kt` - Native flag methods

## Changes Made

### React Native Changes:

#### 1. `src/hooks/useSyncBalanceToNative.js`
**Change:** Removed the `if (balance === 0) return` skip logic
**Reason:** Always sync to avoid race conditions
```javascript
// ❌ OLD: if (balance === 0) { return; }
// ✅ NEW: Always sync, native tracks sync completion with flag
```

#### 2. `src/hooks/useAppBlocker.js`
**Added Methods:**
- `checkAppBlockerFlags()` - Get resist/open pending status from native
- `clearAppBlockerFlags()` - Clear transaction flags after processing

#### 3. `src/hooks/useAppBlockerTransactions.js`
**Complete Rewrite:**
- Uses proper native methods instead of AsyncStorage workaround
- Polls every 3 seconds for pending transactions
- Processes: resist (+2) and open (-15 + streak break)
- Only clears flags after successful transaction

#### 4. `App.tsx`
**Added:** Import and use of `useAppBlockerTransactions` in BalanceSyncComponent

### Android Native Changes:

#### 1. `AppBlockerModule.kt`
**Added Methods:**
- `syncBalanceAndStreak()` - Now sets `balance_synced_once` flag
- `checkAppBlockerFlags()` - Returns resistPending, openPending, openPackage
- `clearAppBlockerFlags()` - Clears all transaction flags

#### 2. `BlockOverlayActivity.kt`
**Change:** Enhanced `loadBalanceAndStreak()` with cold-start retry logic
```kotlin
// NEW: Detects cold start with balance_synced_once flag
if (userBalance == 0 && !hasSyncedOnce) {
    // Retry after 1.5 seconds for Firestore to load
}
```

## Data Flow Diagram

### Balance Sync Flow:
```
Firestore 
    ↓ (fetchBalance)
EconomyContext (state = balance:277)
    ↓ (onChange)
useSyncBalanceToNative (calls syncBalanceToNative)
    ↓
AppBlockerModule (writes to SharedPreferences)
    ↓
BlockOverlayActivity (reads balance, shows on UI)
```

### Transaction Flow:
```
User Action (I'm Good / Hold 3s)
    ↓
BlockOverlayActivity (sets flags: app_blocker_resist_ready or app_blocker_open_pending)
    ↓
SharedPreferences (native writes)
    ↓
useAppBlockerTransactions (polls every 3s)
    ↓ (if flags found)
EconomyContext.addTransaction()
    ↓
Firestore (transaction recorded)
    ↓
AppBlockerModule.clearAppBlockerFlags()
```

## Key Improvements

### 1. Race Condition Fixed
- **Before:** Blocker showed 0 because useSyncBalanceToNative skipped on 0
- **After:** Always syncs, native flags when complete, blocker retries if needed

### 2. Transaction Processing Implemented
- **Before:** Native side set flags but nothing processed them
- **After:** React polls every 3s, processes transactions, clears flags

### 3. Cold Start Handling
- **Before:** Blocker showed 0 at app startup
- **After:** Detects cold start, waits 1.5s for Firestore load, retries

### 4. Balance Validation
- BlockOverlayActivity shows:
  - `💰 Current: 277 pts | Streak: ✓`
  - Warning if insufficient balance/streak
  - Disables "Open App" button if balance < 15 or no streak

## Testing Checklist

### On Cold Start:
- [ ] Open app for first time (no prior balance sync)
- [ ] Open Dashboard → balance shows (e.g., 277)
- [ ] Wait 2-3 seconds for EconomyContext to load from Firestore
- [ ] Trigger blocked app
  - Expected: Shows balance on post-breathing screen
  - If shows 0: Waits 1.5s and retries (check logs)

### Transaction Testing:
- [ ] Click "✓ I'm Good" → User returns to app
  - Expected: +2 points added to balance in next few seconds
  - Check Dashboard balance updates
  - Check Firestore transactions collection for new entry
  
- [ ] Have sufficient points (≥15, streak active) and hold "🚫 HOLD 3s to Open"
  - Expected: App opens, user returned to app
  - Expected: -15 points deducted, streak broken
  - Check Firestore transactions collection for new entry

- [ ] Have insufficient points (< 15) and try to open app
  - Expected: "❌ Cannot Open (insufficient)" button shown, disabled
  - Cannot hold button to open

### Balance Display:
- [ ] Post-breathing screen shows:
  - `💰 Current: X pts | Streak: ✓/✗`
  - Cost warning: "Opening app costs: -15 pts, -1 ⚡ streak"
  - Or if insufficient: "⚠️ Cannot open app: Need -15 pts (have X)"

## Debugging

### Check Logs:
```bash
# Watch for balance sync
[SyncBalance] SYNCING: balance=277

# Watch for native sync
[AppBlockerModule] syncBalanceAndStreak: balance=277, hasStreak=true

# Watch for relay to blocker
[BlockOverlayActivity] Loaded: balance=277

# Watch for transactions
[AppBlockerTransactions] ✓ Added +2 points for resist
```

### If Balance Still Shows 0:
1. Check share: `balance_synced_once` flag not set (cold start issue triggered)
2. Verify `syncBalanceToNative()` is being called (check logs)
3. Check Firestore: Does user document have balance in transactions?
4. Verify FirebaseAuth is working (user.uid present)

### If Transactions Don't Process:
1. Verify flags are being set in SharedPreferences (native logs)
2. Check `useAppBlockerTransactions` is called in BalanceSyncComponent
3. Verify Cloud Function `createTransaction` is deployed and accessible
4. Check if user has edit permissions on Firestore

## Files Modified Summary

```
React Native:
✅ src/hooks/useSyncBalanceToNative.js - Remove skip-on-zero logic
✅ src/hooks/useAppBlocker.js - Add flag checking methods
✅ src/hooks/useAppBlockerTransactions.js - Complete rewrite with proper flags
✅ App.tsx - Add useAppBlockerTransactions to BalanceSyncComponent

Android:
✅ android/app/src/main/java/com/dopareset/app/appblocker/AppBlockerModule.kt
   - Add balance_synced_once flag to syncBalanceAndStreak()
   - Add checkAppBlockerFlags() method
   - Add clearAppBlockerFlags() method

✅ android/app/src/main/java/com/dopareset/app/appblocker/BlockOverlayActivity.kt
   - Enhanced loadBalanceAndStreak() with cold-start retry logic
   - Detects and handles initial Firestore load race condition
```

## Next Steps

1. **Test on Device:**
   ```bash
   npm start
   expo prebuild
   expo build:android -t apk  # or use eas build
   ```

2. **Deploy Cloud Functions:** (if not already deployed)
   ```bash
   firebase deploy --only functions
   ```

3. **Monitor Firestore:**
   - Check transactions collection for new entries
   - Verify balance updates in real-time

4. **Validate Security Rules:** 
   - Ensure Firestore rules allow transaction creation (already set in Phase 3)
