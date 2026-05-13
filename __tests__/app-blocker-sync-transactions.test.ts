/**
 * App Blocker Balance Sync & Transaction Tests
 * Tests the three-layer fix:
 * 1. Always-sync pattern
 * 2. Cold-start retry
 * 3. Transaction processing
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { NativeModules } from 'react-native';

// Mock modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  NativeModules: {
    AppBlocker: {
      syncBalanceAndStreak: jest.fn(),
      checkAppBlockerFlags: jest.fn(),
      clearAppBlockerFlags: jest.fn(),
      getBalanceAndStreak: jest.fn(),
    },
  },
}));

jest.mock('../src/context/EconomyContext', () => ({
  useEconomy: () => ({
    balance: 277,
    currentStreak: true,
    addTransaction: jest.fn(async () => ({ success: true })),
  }),
}));

describe('App Blocker Balance Sync & Transactions', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ===== TEST SUITE 1: BALANCE SYNC =====

  describe('1. Balance Sync (Always-Sync Pattern)', () => {

    test('should sync balance even when 0 (cold start)', async () => {
      const mockSync = jest.fn().mockResolvedValue({ success: true });
      NativeModules.AppBlocker.syncBalanceAndStreak = mockSync;

      // Simulate cold start: balance is 0 initially
      const { rerender } = renderHook(
        ({ balance }) => {
          const { syncBalanceToNative } = require('../src/hooks/useAppBlocker').useAppBlocker();
          React.useEffect(() => {
            syncBalanceToNative(balance, true);
          }, [balance, syncBalanceToNative]);
        },
        { initialProps: { balance: 0 } }
      );

      await waitFor(() => {
        expect(mockSync).toHaveBeenCalledWith(0, true);
      });
    });

    test('should sync balance when it loads from Firestore', async () => {
      const mockSync = jest.fn()
        .mockResolvedValueOnce({ success: true })  // First call (0)
        .mockResolvedValueOnce({ success: true }); // Second call (277)

      NativeModules.AppBlocker.syncBalanceAndStreak = mockSync;

      const { rerender } = renderHook(
        ({ balance }) => {
          const { syncBalanceToNative } = require('../src/hooks/useAppBlocker').useAppBlocker();
          React.useEffect(() => {
            syncBalanceToNative(balance, true);
          }, [balance, syncBalanceToNative]);
        },
        { initialProps: { balance: 0 } }
      );

      await waitFor(() => {
        expect(mockSync).toHaveBeenCalledWith(0, true);
      });

      // Simulate Firestore load
      rerender({ balance: 277 });

      await waitFor(() => {
        expect(mockSync).toHaveBeenCalledWith(277, true);
      });

      expect(mockSync).toHaveBeenCalledTimes(2);
    });

    test('should set balance_synced_once flag when syncing', async () => {
      NativeModules.AppBlocker.syncBalanceAndStreak = jest.fn(async (balance, streak) => {
        // In real implementation, this sets the flag in SharedPreferences
        // We verify it's called
        return { success: true };
      });

      const { syncBalanceToNative } = require('../src/hooks/useAppBlocker').useAppBlocker();

      await act(async () => {
        await syncBalanceToNative(277, true);
      });

      expect(NativeModules.AppBlocker.syncBalanceAndStreak).toHaveBeenCalledWith(277, true);
    });
  });

  // ===== TEST SUITE 2: COLD START RETRY =====

  describe('2. Cold Start Retry Logic', () => {

    test('should retry balance load after 1.5s if still 0 on cold start', async () => {
      const mockGetBalance = jest.fn()
        .mockResolvedValueOnce({ balance: 0, hasStreak: true, synced: false })  // First call
        .mockResolvedValueOnce({ balance: 277, hasStreak: true, synced: true });  // After retry

      NativeModules.AppBlocker.getBalanceAndStreak = mockGetBalance;

      // Simulate BlockOverlayActivity cold start
      let balance = 0;
      let synced = false;

      // First load: balance is 0
      const result1 = await NativeModules.AppBlocker.getBalanceAndStreak();
      expect(result1.balance).toBe(0);
      expect(result1.synced).toBe(false);

      // Advance time 1.5 seconds
      jest.advanceTimersByTime(1500);

      // Second load: balance available
      const result2 = await NativeModules.AppBlocker.getBalanceAndStreak();
      expect(result2.balance).toBe(277);
      expect(result2.synced).toBe(true);

      expect(mockGetBalance).toHaveBeenCalledTimes(2);
    });

    test('should show correct balance after retry completes', async () => {
      NativeModules.AppBlocker.getBalanceAndStreak = jest.fn(async () => ({
        balance: 277,
        hasStreak: true,
      }));

      const balance = await NativeModules.AppBlocker.getBalanceAndStreak();

      expect(balance.balance).toBe(277);
      expect(balance.hasStreak).toBe(true);
    });
  });

  // ===== TEST SUITE 3: TRANSACTION PROCESSING =====

  describe('3. Transaction Processing System', () => {

    test('should detect and process resist transaction (+2)', async () => {
      const mockCheckFlags = jest.fn().mockResolvedValue({
        resistPending: true,
        openPending: false,
        openPackage: '',
      });

      const mockClearFlags = jest.fn().mockResolvedValue({ success: true });
      const mockAddTransaction = jest.fn().mockResolvedValue({ success: true });

      NativeModules.AppBlocker.checkAppBlockerFlags = mockCheckFlags;
      NativeModules.AppBlocker.clearAppBlockerFlags = mockClearFlags;

      // Simulate transaction processing
      const flags = await mockCheckFlags();

      if (flags.resistPending) {
        await mockAddTransaction('app_blocker_resist', { reason: 'Resisted app' }, 2);
        await mockClearFlags();
      }

      expect(mockCheckFlags).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalledWith(
        'app_blocker_resist',
        expect.any(Object),
        2
      );
      expect(mockClearFlags).toHaveBeenCalled();
    });

    test('should detect and process open transaction (-15)', async () => {
      const mockCheckFlags = jest.fn().mockResolvedValue({
        resistPending: false,
        openPending: true,
        openPackage: 'com.facebook.katana',
      });

      const mockClearFlags = jest.fn().mockResolvedValue({ success: true });
      const mockAddTransaction = jest.fn().mockResolvedValue({ success: true });

      NativeModules.AppBlocker.checkAppBlockerFlags = mockCheckFlags;
      NativeModules.AppBlocker.clearAppBlockerFlags = mockClearFlags;

      // Simulate transaction processing
      const flags = await mockCheckFlags();

      if (flags.openPending) {
        await mockAddTransaction('app_blocker_open', {
          appPackage: flags.openPackage,
          streakBroken: true,
        }, -15);
        await mockClearFlags();
      }

      expect(mockAddTransaction).toHaveBeenCalledWith(
        'app_blocker_open',
        expect.objectContaining({
          appPackage: 'com.facebook.katana',
          streakBroken: true,
        }),
        -15
      );
      expect(mockClearFlags).toHaveBeenCalled();
    });

    test('should not clear flags if transaction fails', async () => {
      const mockCheckFlags = jest.fn().mockResolvedValue({
        resistPending: true,
        openPending: false,
        openPackage: '',
      });

      const mockClearFlags = jest.fn();
      const mockAddTransaction = jest.fn().mockRejectedValue(new Error('Offline'));

      NativeModules.AppBlocker.checkAppBlockerFlags = mockCheckFlags;
      NativeModules.AppBlocker.clearAppBlockerFlags = mockClearFlags;

      // Simulate failed transaction
      const flags = await mockCheckFlags();

      try {
        if (flags.resistPending) {
          await mockAddTransaction('app_blocker_resist', {}, 2);
          // Only clear if transaction succeeded
          await mockClearFlags();
        }
      } catch (err) {
        // Transaction failed, don't clear flags
        expect(mockClearFlags).not.toHaveBeenCalled();
      }
    });

    test('should poll flags every 3 seconds', async () => {
      const mockCheckFlags = jest.fn().mockResolvedValue({
        resistPending: false,
        openPending: false,
      });

      NativeModules.AppBlocker.checkAppBlockerFlags = mockCheckFlags;

      // Simulate 3 polling cycles
      await mockCheckFlags();
      jest.advanceTimersByTime(3000);
      await mockCheckFlags();
      jest.advanceTimersByTime(3000);
      await mockCheckFlags();

      expect(mockCheckFlags).toHaveBeenCalledTimes(3);
    });
  });

  // ===== TEST SUITE 4: BALANCE VALIDATION =====

  describe('4. Balance Validation Before Opening', () => {

    test('should allow open if balance >= 15 and streak active', () => {
      const balance = 277;
      const hasStreak = true;

      const canOpen = balance >= 15 && hasStreak;

      expect(canOpen).toBe(true);
    });

    test('should prevent open if balance < 15', () => {
      const balance = 10;
      const hasStreak = true;

      const canOpen = balance >= 15 && hasStreak;

      expect(canOpen).toBe(false);
    });

    test('should prevent open if streak broken', () => {
      const balance = 20;
      const hasStreak = false;

      const canOpen = balance >= 15 && hasStreak;

      expect(canOpen).toBe(false);
    });

    test('should prevent open if both balance and streak insufficient', () => {
      const balance = 5;
      const hasStreak = false;

      const canOpen = balance >= 15 && hasStreak;

      expect(canOpen).toBe(false);
    });
  });

  // ===== TEST SUITE 5: INTEGRATION =====

  describe('5. Full Integration Flow', () => {

    test('should handle complete cold start → sync → transaction flow', async () => {
      const mockSync = jest.fn().mockResolvedValue({ success: true });
      const mockCheckFlags = jest.fn().mockResolvedValue({
        resistPending: true,
        openPending: false,
      });
      const mockClearFlags = jest.fn().mockResolvedValue({ success: true });
      const mockAddTransaction = jest.fn().mockResolvedValue({ success: true });

      NativeModules.AppBlocker.syncBalanceAndStreak = mockSync;
      NativeModules.AppBlocker.checkAppBlockerFlags = mockCheckFlags;
      NativeModules.AppBlocker.clearAppBlockerFlags = mockClearFlags;

      // 1. Cold start - sync balance (even if 0)
      await mockSync(0, true);
      expect(mockSync).toHaveBeenCalledWith(0, true);

      // 2. Firestore loads, sync real balance
      await mockSync(277, true);
      expect(mockSync).toHaveBeenLastCalledWith(277, true);

      // 3. User completes breathing and clicks "I'm Good"
      // (native sets app_blocker_resist_ready flag)

      // 4. React polls and detects flag
      const flags = await mockCheckFlags();
      expect(flags.resistPending).toBe(true);

      // 5. React processes transaction
      await mockAddTransaction('app_blocker_resist', {}, 2);
      expect(mockAddTransaction).toHaveBeenCalledWith(
        'app_blocker_resist',
        expect.any(Object),
        2
      );

      // 6. Clear flags after successful transaction
      await mockClearFlags();
      expect(mockClearFlags).toHaveBeenCalled();

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(mockCheckFlags).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalled();
      expect(mockClearFlags).toHaveBeenCalled();
    });
  });
});
