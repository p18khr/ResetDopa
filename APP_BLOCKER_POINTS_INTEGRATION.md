# App Blocker Points System - Integration Guide

## ✅ Completed Native Implementation

### AppBlockerModule Methods
```kotlin
// ✓ Sync balance/streak to native storage
AppBlocker.syncBalanceAndStreak(balance: Int, hasStreak: Boolean)

// ✓ Get current balance/streak from native
AppBlocker.getBalanceAndStreak() → {balance, hasStreak}
```

### BlockOverlayActivity Features
- ✓ Loads balance/streak from SharedPreferences
- ✓ Shows current balance and streak status on post-breathing screen
- ✓ Displays warning if insufficient balance (-15) or streak
- ✓ **Nuclear button**: "Open App" requires 3-second hold
- ✓ "I'm Good" flags +2 points reward for React
- ✓ "Open App" flags -15 points and -1 streak for React
- ✓ Temporarily allows app for rest of session (no re-blocking)

---

## 🔧 React Native Integration (3 Steps)

### **STEP 1: Sync Balance on Economy Changes**

In any screen that has `useEconomy()` (Dashboard, VagusGatekeeper, etc.):

```javascript
import { useEconomy } from '../context/EconomyContext';
import { useAppBlocker } from '../hooks/useAppBlocker';

export function MyScreen() {
  const { balance, currentStreak } = useEconomy();
  const { syncBalanceToNative } = useAppBlocker();

  // Sync balance whenever it changes
  useEffect(() => {
    syncBalanceToNative(balance, currentStreak);
  }, [balance, currentStreak, syncBalanceToNative]);

  return (
    // ... your component
  );
}
```

### **STEP 2: Use the Transaction Hook (RECOMMEND: Add to Dashboard.tsx)**

```javascript
import { useAppBlockerTransactions } from '../hooks/useAppBlockerTransactions';
import { useEconomy } from '../context/EconomyContext';

export function Dashboard() {
  const { balance } = useEconomy();
  
  // This hook automatically:
  // - Checks for pending transactions from native side
  // - Processes +2 when user clicked "I'm Good"
  // - Processes -15 and -1 streak when user opened app
  useAppBlockerTransactions();

  return (
    // ... dashboard UI
  );
}
```

### **STEP 3: Test the Flow**

1. **Positive Flow (Resist):**
   - Set balance to 20 pts, streak active
   - Block an app
   - Complete 60s breathing
   - Click "✓ I'm Good"
   - ✅ Should see +2 points reward

2. **Negative Flow (Open App):**
   - Set balance to 20 pts, streak active
   - Block same app again
   - Complete 60s breathing
   - Hold "🚫 HOLD 3s to Open" for 3 seconds
   - ✅ Should deduct -15 points and break streak
   - ✅ App should open and not get blocked again in session

3. **Insufficient Balance:**
   - Set balance to 5 pts (less than 15 needed)
   - Block an app, complete breathing
   - ❌ "Open App" button disabled
   - Shows warning: "Need -15 pts (have 5)"

4. **No Streak:**
   - Balance 20 pts but `currentStreak = false`
   - ❌ "Open App" button disabled
   - Shows warning: "Need -1 ⚡ streak (lost)"

---

## 🔄 Flow Diagram

```
User Opens Blocked App
         ↓
   [BlockOverlayActivity loads balance/streak from SharedPrefs]
         ↓
   [60s Breathing Exercise]
         ↓
   Post-Survival Screen:
   ├─ "✓ I'm Good" → flags app_blocker_resist_ready = true
   └─ "🚫 HOLD 3s to Open" (if balance ≥ 15 && streak active)
                ↓
            Nuclear Hold Timer (3s)
                ↓
            flags app_blocker_open_pending = true
                ↓
         [App opens, gets temporarily allowed]
         ↓
   [React side polls for pending flags every 2s]
         ↓
   Process Transactions:
   ├─ app_blocker_resist_ready → addTransaction(+2)
   └─ app_blocker_open_pending → addTransaction(-15) + break streak
         ↓
   [Update Dashboard balance, UI refreshes]
```

---

## 📝 Transaction Types

### Resist Transaction
```javascript
addTransaction('app_blocker_resist', {
  reason: 'Completed breathing exercise and resisted app',
}, 2);  // +2 points
```

### Open App Transaction
```javascript
addTransaction('app_blocker_open', {
  reason: 'Opened blocked app: com.example.app',
  appPackage: 'com.example.app',
  streakBroken: true,
}, -15);  // -15 points, streakBroken breaks streak
```

---

## ⚠️ Important Notes

1. **Balance Before Blocking:** Native side checks balance. If insufficient, blocker still appears but "Open App" is disabled. This is intentional - user must resist or earn points first.

2. **Streak Breaks on Open:** Opening a blocked app always breaks the current day's streak. This is a harsh penalty.

3. **Temporary Allow:** Once user opens an app in a session, it's temporarily allowed and won't trigger blocker again FOR THAT SESSION. Restarting the app resets the temporary list.

4. **Nuclear Button:** The 3-second hold is enforced at Android level. User must physically hold for 3 full seconds. Good UX for preventing accidental opens.

5. **Race Condition:** Small race condition possible if:
   - User opens app
   - App immediately crashes
   - Balance sync might not complete
   - **Mitigation:** Transactions stored in SharedPrefs, checked every 2s

---

## 🐛 Debugging

### Check Native Balance Storage:
```
adb shell am broadcast -a android.intent.action.VIEW -d "file:///data/data/com.dopareset.app/shared_prefs/AppBlockerPrefs.xml"
```

### View Logs:
```
adb logcat | grep "BlockOverlayActivity\|AppBlockerModule"
```

### Clear AppBlockerPrefs:
```
adb shell pm clear com.dopareset.app  # ⚠️ Clears all app data
```

---

## 🚀 Future Improvements

1. **Better Event System:** Replace 2s polling with proper NativeEventEmitter
2. **Offline Support:** Queue transactions if network unavailable
3. **Analytics:** Track which apps are most blocked, resistance rates
4. **Customizable Costs:** Make -15 pts / -1 streak configurable in AI config
5. **Grace Period:** Add 5-min grace period after opening before re-blocking same app

---

## ✨ Done!

All native code is complete. Just need React to:
1. Call `syncBalanceToNative()` when balance changes
2. Use `useAppBlockerTransactions()` in Dashboard to process pending transactions

