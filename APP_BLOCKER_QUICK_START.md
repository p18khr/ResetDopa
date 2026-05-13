# DopaReset App Blocker - Quick Start Guide

## What Was Fixed

Your app blocker was showing 0 Calm Points even when the user had 277 because of a **race condition in balance syncing**. 

### Three critical fixes applied:

1. **Always-Sync Pattern**: Balance now syncs even when it's 0, with a completion flag
2. **Cold-Start Retry**: Native side retries balance fetch after 1.5s if blocker beats React load
3. **Transaction Processing**: New system processes +2 (I'm Good) and -15 (Open App) transactions

## Building & Testing

### 1. Build APK
```bash
npm start  # Start Expo
expo prebuild --clean  # Clean build
expo build:android -t apk  # Build APK
```

### 2. First Test - Cold Start
- Fresh app install
- Open dashboard → note the balance (e.g., 277)
- Wait 2-3 seconds
- Open a blocked app
- **Expected:** Post-breathing screen shows correct balance (not 0)
- **If shows 0:** Waits 1.5s and retries (check native logs)

### 3. Transaction Test - Resist (+2)
- Open a blocked app → see blocking screen
- Complete 60s breathing exercise
- Click "✓ I'm Good (+2 pts)"
- Return to app
- **Expected:** Balance increases by 2 points within 3-5 seconds

### 4. Transaction Test - Open (-15, -1 Streak)
- Have 15+ points, active streak
- Open blocked app → see blocking screen
- Complete breathing
- **Hold** "🚫 HOLD 3s to Open" for 3 seconds
- App opens
- **Expected:** Balance decreases by 15, streak breaks, transactions visible in Firestore

### 5. Insufficient Points Test
- Deplete balance to < 15 points
- Open blocked app → post-breathing screen
- "🚫 HOLD 3s to Open" shows red, disabled
- Cannot hold button to open
- **Expected:** Warning shows: "⚠️ Cannot open app: Need -15 pts (have X)"

## Log Monitoring

### React Side
```
[SyncBalance] SYNCING: balance=277
[AppBlockerTransactions] Checking for pending transactions...
[AppBlockerTransactions] ✓ Added +2 points for resist
[AppBlockerTransactions] ✓ Cleared native flags
```

### Native Side (Android Studio Logcat)
```
[BlockOverlayActivity] Loaded: balance=277, hasStreak=true
[AppBlockerModule] checkAppBlockerFlags() called
[AppBlockerModule] ✓ Flags: resistPending=true, openPending=false
```

## Firestore Transactions Collection

Expected entries after testing:
```javascript
// Resist transaction (+2)
{
  type: "app_blocker_resist",
  amount: 2,
  metadata: { reason: "Completed breathing exercise and resisted app" },
  timestamp: Timestamp,
  status: "completed"
}

// Open app transaction (-15, -1 streak)
{
  type: "app_blocker_open",
  amount: -15,
  metadata: { 
    reason: "Opened blocked app: com.facebook.katana",
    appPackage: "com.facebook.katana",
    streakBroken: true
  },
  timestamp: Timestamp,
  status: "completed"
}
```

## Debugging Checklist

- [ ] Cloud Functions `createTransaction` or `addTransaction` deployed?
- [ ] Firestore rules allow user writes to transactions collection?
- [ ] User authenticated before opening app?
- [ ] App has proper permissions (Usage Stats, Overlay)?
- [ ] At least one sync cycle completed (see SyncBalance logs)?

## Files Changed

### React Native
- `src/hooks/useSyncBalanceToNative.js` - Removed skip-on-zero, always syncs  
- `src/hooks/useAppBlocker.js` - Added checkAppBlockerFlags, clearAppBlockerFlags
- `src/hooks/useAppBlockerTransactions.js` - Complete rewrite, proper polling
- `App.tsx` - Added useAppBlockerTransactions to BalanceSyncComponent

### Android (Kotlin)
- `AppBlockerModule.kt` - Added checkAppBlockerFlags, clearAppBlockerFlags, balance_synced_once flag
- `BlockOverlayActivity.kt` - Enhanced with cold-start retry logic

## Next: CloudFunctions

If not deployed yet:
```bash
firebase deploy --only functions
# Deploys createTransaction, purchaseItem, syncOfflineTransactions to Firebase
```

## Support

If balance still shows 0:
1. Check that `balance_synced_once` flag is being set in SharedPreferences
2. Verify user has Firestore transactions collection with data
3. Check app logs: "SYNCING: balance=" should appear within 2-3s of app start
4. If timing issue: Increase delay in BlockOverlayActivity loadBalanceAndStreak retry (currently 1500ms)
