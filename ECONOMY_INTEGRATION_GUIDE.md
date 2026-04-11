# Calm Points Economy - Frontend Integration Guide

## Overview
This document describes how the React Native frontend integrates with the Calm Points Economy during critical user flows.

---

## 1. App Blocker (Vagus Gate) Integration

### When User Opens a Blocked App

```
Flow: User opens blocked app (e.g., Instagram)
↓
AppAccessibilityService (Kotlin) detects window change
↓
Launches BlockOverlayActivity (full-screen barrier)
↓
React Native Dashboard subscribed via listener
```

### Option A: User Waits 60 Seconds (Success)

```typescript
// src/screens/BlockedAppGate.tsx

import { useEconomy } from '../context/EconomyContext';
import { TransactionType } from '../types/economy';

function BlockedAppGate({ appBlocked, packageName }) {
  const { addTransaction } = useEconomy();
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === 1) {
          // User survived! Award points
          onSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onSuccess = async () => {
    try {
      const response = await addTransaction(
        TransactionType.GATE_SURVIVED,  // Type: 'gate_survived'
        {
          appBlocked: packageName,      // Metadata: which app
        },
        50  // +50 points for success
      );

      if (response.success) {
        // Show celebration UI
        showConfetti();
        showToast(`+50 Calm Points! You resisted ${appBlocked} 🧘`);
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.error('Failed to record gate survival:', error);
      showToast('Error recording victory');
    }
  };

  return (
    <View style={styles.gateContainer}>
      <Text style={styles.title}>Breathe. Refocus.</Text>
      <Text style={styles.subtitle}>{appBlocked} is blocked</Text>
      <AnimatedBreathingCircle />
      <Text style={styles.timer}>{timeRemaining}s</Text>
      <Button title="Return to DopaReset" onPress={onSuccess} />
    </View>
  );
}
```

### Option B: User Closes Overlay Early (Bankruptcy Check)

```typescript
// src/screens/BlockedAppGate.tsx

const onBypass = async () => {
  try {
    // User forced access, costs -100 points
    const response = await addTransaction(
      TransactionType.GATE_BYPASSED,  // Type: 'gate_bypassed'
      {
        appBlocked: packageName,
      },
      -100  // -100 points for forcing access
    );

    if (response.success) {
      if (response.streakBroken) {
        // Show bankruptcy notification
        showAlert(
          'Streak Broken 🔴',
          'You\'ve used all your Calm Points from resisting urges. ' +
          'Complete tasks to earn points and resume your streak.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        showToast(`-100 Calm Points. Current: ${response.balance}`);
      }

      // Allow app to launch
      returnToApppropriately();
    }
  } catch (error) {
    console.error('Bypass transaction failed:', error);
    // Still allow access even if transaction fails (offline scenario)
    returnToApp();
  }
};
```

---

## 2. Daily Tasks Integration

### When Task is Completed

```typescript
// src/screens/TaskDetails.tsx or Dashboard.tsx

import { useEconomy } from '../context/EconomyContext';

function TaskCard({ task }) {
  const { addTransaction } = useEconomy();
  const [isCompleting, setIsCompleting] = useState(false);

  const completeTask = async () => {
    setIsCompleting(true);

    try {
      // Determine points based on task difficulty
      const pointMap = {
        'easy': 10,
        'medium': 25,
        'hard': 50,
      };
      const points = pointMap[task.difficulty] || 25;

      const response = await addTransaction(
        TransactionType.TASK_COMPLETE,
        {
          taskId: task.id,
          taskTitle: task.title,
        },
        points
      );

      if (response.success) {
        showConfetti();
        showToast(`+${points} Calm Points! Task complete 🎯`);

        // Mark task as complete in app state
        markTaskDone(task.id);

        // Navigate back
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error) {
      if (error.message.includes('queued')) {
        // Offline - queued for sync
        showToast('Task saved. Points will sync when online.');
        markTaskDone(task.id);
        navigation.goBack();
      } else {
        showAlert('Error', 'Failed to complete task: ' + error.message);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <TouchableOpacity onPress={completeTask} disabled={isCompleting}>
      <Text>Complete Task</Text>
    </TouchableOpacity>
  );
}
```

---

## 3. Premium Store Integration

### Browsing & Purchasing

```typescript
// src/screens/PremiumStore.tsx

import { useEconomy } from '../context/EconomyContext';

function StoreItem({ item }) {
  const { balance, purchaseItem, isLoading } = useEconomy();
  const canAfford = balance >= item.cost;

  const handlePurchase = async () => {
    if (!canAfford) {
      showAlert(
        'Insufficient Calm Points',
        `You need ${item.cost} points to buy this item. ` +
        `You have ${balance}. Complete tasks to earn more.`,
        [
          { text: 'Done' },
          { text: 'Go to Tasks', onPress: () => navigation.navigate('Home') }
        ]
      );
      return;
    }

    try {
      const response = await purchaseItem(item.id);

      if (response.success) {
        showConfetti();
        showToast(`✨ ${item.name} unlocked!`);

        // Grant capability to user (e.g., enable dark theme)
        if (item.category === 'theme') {
          activateTheme(item.metadata.theme);
        } else if (item.category === 'feature') {
          enableFeature(item.metadata.featureUnlock);
        }
      }
    } catch (error: any) {
      if (error.message.includes('monthly_limit')) {
        showAlert('Limit Reached', 'You\'ve already purchased this item 3 times this month.');
      } else if (error.message.includes('insufficient')) {
        showAlert('Insufficient Points', error.message);
      } else {
        showAlert('Purchase Failed', error.message);
      }
    }
  };

  return (
    <View style={styles.itemCard}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>{item.cost} points</Text>
      <Button
        title={canAfford ? 'Buy' : 'Locked'}
        onPress={handlePurchase}
        disabled={!canAfford || isLoading}
        color={canAfford ? 'green' : 'gray'}
      />
    </View>
  );
}
```

---

## 4. Dashboard Balance Display

### Real-time Balance Updates

```typescript
// src/screens/Dashboard.tsx

import { useEconomy } from '../context/EconomyContext';

function DashboardHeader() {
  const { balance, currentStreak, lastTransactions, isLoading } = useEconomy();

  return (
    <View style={styles.header}>
      {/* Streak Badge */}
      <View style={[styles.streaakBadge, { opacity: currentStreak ? 1 : 0.5 }]}>
        <Text style={styles.streakIcon}>{currentStreak ? '🔥' : '🔴'}</Text>
        <Text>Streak: {streakDays} days</Text>
      </View>

      {/* Calm Points Display */}
      <View style={styles.pointsDisplay}>
        <Text style={styles.balanceLabel}>Calm Points</Text>
        <Text style={styles.balanceAmount}>{balance}</Text>
      </View>

      {/* Last Transaction (recent activity) */}
      {lastTransactions.length > 0 && (
        <View style={styles.lastTxn}>
          <Text>{lastTransactions[0].metadata?.taskTitle || 'Activity'}</Text>
          <Text style={{ color: lastTransactions[0].amount > 0 ? 'green' : 'red' }}>
            {lastTransactions[0].amount > 0 ? '+' : ''}{lastTransactions[0].amount}
          </Text>
        </View>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineWarning}>
          <Text>📡 Offline - transactions will sync when online</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 5. Offline Mode Handling

### Network State Listener

```typescript
// src/context/NetworkContext.tsx or in Dashboard

import NetInfo from '@react-native-community/netinfo';
import { useEconomy } from '../context/EconomyContext';

function useNetworkSync() {
  const { syncOffline } = useEconomy();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('🔌 Came online, syncing offline transactions...');
        syncOffline();
      }
    });

    return unsubscribe;
  }, [syncOffline]);
}

// Use in App.tsx
function App() {
  useNetworkSync();
  return <AppNavigator />;
}
```

---

## 6. Bankruptcy Notification

### When User Hits 0 Points (Streak Broken)

```typescript
// Triggered automatically by addTransaction if response.streakBroken = true

const showBankruptcyNotification = () => {
  showAlert(
    'Streak Broken 🔴',
    'You\'ve spent all your Calm Points. ' +
    'The good news: you can recover by completing tasks today.',
    [
      {
        text: 'View Tasks',
        onPress: () => {
          navigation.navigate('Home');
          // Highlight easy tasks that award points
        },
      },
      { text: 'OK' },
    ]
  );
};
```

---

## 7. Error Handling & Edge Cases

### Handle Insufficient Balance

```typescript
try {
  await addTransaction(...);
} catch (error) {
  if (error.message.includes('insufficient_balance')) {
    // User tried to purchase but doesn't have points
    // Show upgrade suggestions
    showAlert(
      'Need More Points',
      'Complete tasks or survive more urges to earn points.',
      [{ text: 'View Tasks', onPress: () => nav.navigate('Home') }]
    );
  }
}
```

### Handle Offline Transactions

```typescript
// If network error occurs, transaction is queued locally
// Clear notification after 5s showing the transaction is queued
showToast('Saved offline. Will sync when online.', { duration: 5000 });

// syncOffline() is called automatically when network returns
```

---

## 8. Integration Checklist

- [x] **App Blocker** → `GATE_SURVIVED` (+50) when user waits 60s
- [x] **App Blocker** → `GATE_BYPASSED` (-100) when user forces access
- [x] **Daily Tasks** → `TASK_COMPLETE` (+10-50) when user completes task
- [x] **Premium Store** → `STORE_PURCHASE` (-cost) when user buys item
- [x] **Real-time Balance** → Subscribe to transactions collection
- [x] **Offline Mode** → Queue pending transactions, sync on network return
- [x] **Bankruptcy** → Break streak when balance < 0
- [x] **UI Notifications** → Show toast/alerts for all point changes
- [x] **Error Messages** → Clear error feedback (insufficient balance, monthly limits, offline, etc.)

---

## 9. Performance Optimizations

**Real-Time Listeners:**
- Limit to last 10 transactions (don't fetch all history on every screen)
- Use `where('status', '==', 'completed')` to avoid pending transactions

**Balance Derivation:**
- Cached in memory (React state)
- Only recalculate on transaction changes
- Do NOT query on every render

**Offline Sync:**
- Debounce network state changes (wait 1s before syncing)
- Retry failed transactions with exponential backoff (1s, 2s, 4s, etc.)
- Max 3 retries before user notification

---

## 10. Analytics Events to Track

```typescript
// Track in analytics service
analytics.logEvent('points_earned', {
  type: 'gate_survived',
  amount: 50,
  app: 'com.instagram.android',
});

analytics.logEvent('points_spent', {
  type: 'store_purchase',
  itemId: 'dark_theme',
  cost: 150,
});

analytics.logEvent('streak_broken', {
  balance_before: 20,
  attempted_cost: 100,
});
```

---

This integration ensures a seamless, secure, offline-capable points economy while maintaining a positive UX.
