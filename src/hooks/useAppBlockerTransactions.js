import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useEconomy } from '../context/EconomyContext';
import { useAppBlocker } from './useAppBlocker';

/**
 * useAppBlockerTransactions - Handles economy transactions from app blocker
 *
 * Listens for app blocker events and processes transactions:
 * - "app_blocker_resist" → +2 Calm Points (when user completes breathing and clicks "I'm Good")
 * - "app_blocker_open" → -15 Calm Points, -1 Streak (when user holds button and opens app)
 *
 * Checks native SharedPreferences flags periodically and syncs to React transactions
 */
export function useAppBlockerTransactions() {
  const { addTransaction } = useEconomy();
  const { checkAppBlockerFlags, clearAppBlockerFlags } = useAppBlocker();
  const isProcessingRef = useRef(false);

  // Poll native flags and process transactions
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const checkAndProcessPendingTransactions = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      try {
        console.log('[AppBlockerTransactions] Checking for pending transactions...');

        // Get current flags from native storage
        const flags = await checkAppBlockerFlags();

        const { resistPending, openPending, openPackage } = flags;

        // Process resist reward (+2 points)
        if (resistPending) {
          console.log('[AppBlockerTransactions] ✓ Resist reward pending - adding +2 points');
          try {
            await addTransaction('app_blocker_resist', {
              reason: 'Completed breathing exercise and resisted app',
            }, 2);
            console.log('[AppBlockerTransactions] ✓ Added +2 points for resist');
          } catch (err) {
            console.error('[AppBlockerTransactions] Error adding resist bonus:', err);
            return;  // Don't clear flags if transaction failed
          }
        }

        // Process open app deduction (-15 points, -1 streak)
        if (openPending) {
          console.log('[AppBlockerTransactions] ✓ Open app deduction pending');

          try {
            await addTransaction('app_blocker_open', {
              reason: `Opened blocked app: ${openPackage || 'unknown'}`,
              appPackage: openPackage || 'unknown',
              streakBroken: true,  // Always break streak when opening app
            }, -15);
            console.log('[AppBlockerTransactions] ✓ Deducted -15 points and -1 streak');
          } catch (err) {
            console.error('[AppBlockerTransactions] Error deducting points:', err);
            return;  // Don't clear flags if transaction failed
          }
        }

        // Clear flags only after successful processing
        if (resistPending || openPending) {
          await clearAppBlockerFlags();
          console.log('[AppBlockerTransactions] ✓ Cleared native flags');
        }
      } catch (err) {
        console.error('[AppBlockerTransactions] Error in checkAndProcessPendingTransactions:', err);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Check immediately on mount
    checkAndProcessPendingTransactions();

    // Then check periodically every 3 seconds
    const interval = setInterval(checkAndProcessPendingTransactions, 3000);

    return () => clearInterval(interval);
  }, [addTransaction, checkAppBlockerFlags, clearAppBlockerFlags]);

  return null;  // This hook only has side effects
}

export default useAppBlockerTransactions;
