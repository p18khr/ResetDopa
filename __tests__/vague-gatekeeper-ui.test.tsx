/**
 * VagusGatekeeper & BankruptcyModal UI Rendering Tests
 *
 * Tests the economy UI layer using React Native Testing Library (RNTL)
 * Scenario A: Balance = 20 (no bankruptcy on bypass)
 * Scenario B: Balance = 5 (bankruptcy modal shows on bypass)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { VagusGatekeeper } from '../src/components/VagusGatekeeper';
import { BankruptcyModal } from '../src/components/BankruptcyModal';
import * as EconomyContext from '../src/context/EconomyContext';

// ========== MOCKS ==========

/**
 * Mock EconomyContext with configurable balance
 */
const createMockEconomyContext = (balance: number) => ({
  balance,
  currentStreak: true,
  isLoading: false,
  error: null,
  lastTransactions: [],
  addTransaction: jest.fn().mockResolvedValue({
    success: true,
    transaction: {
      id: 'txn-test',
      type: 'gate_bypassed',
      amount: -15,
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
  }),
  purchaseItem: jest.fn().mockResolvedValue({
    success: true,
  }),
  getBalance: jest.fn().mockResolvedValue(balance),
  syncOffline: jest.fn().mockResolvedValue(null),
  executeBankruptcy: jest.fn().mockResolvedValue(null),
});

/**
 * Render helper that wraps component with mocked EconomyContext
 */
const renderWithMockedEconomy = (component: React.ReactElement, balance: number) => {
  const mockContext = createMockEconomyContext(balance);

  // Mock the useEconomy hook
  const useEconomySpy = jest.spyOn(EconomyContext, 'useEconomy' as any);
  useEconomySpy.mockReturnValue(mockContext);

  const result = render(component);

  return {
    ...result,
    mockContext,
    useEconomySpy,
  };
};

// ========== TEST SUITE ==========

describe('VagusGatekeeper & BankruptcyModal UI Rendering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ===== SCENARIO A: Balance = 20 (No Bankruptcy) =====

  describe('Scenario A: Balance = 20 (Sufficient for Bypass)', () => {
    test('A1: VagusGatekeeper renders with correct initial state', () => {
      const { getByText } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        20
      );

      // Verify gate is showing
      expect(getByText(/Stay in Protocol/i)).toBeTruthy();
      expect(getByText(/60/)).toBeTruthy(); // Timer shows 60 seconds

      // Verify "Bypass" button is visible
      expect(getByText(/Bypass/i)).toBeTruthy();
    });

    test('A2: Bypass button click with balance=20 triggers addTransaction (not bankruptcy)', async () => {
      const onGateComplete = jest.fn();
      const { getByText, mockContext } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={onGateComplete}
          onClose={jest.fn()}
        />,
        20
      );

      const bypassButton = getByText(/Bypass/i);

      // Click Bypass
      act(() => {
        fireEvent.press(bypassButton);
      });

      // Wait for async addTransaction call
      await waitFor(() => {
        expect(mockContext.addTransaction).toHaveBeenCalledWith(
          expect.stringContaining('gate_bypassed'),
          expect.objectContaining({
            appBlocked: 'com.example.blocked',
          }),
          expect.any(Number)
        );
      });

      // Verify onGateComplete was called (gate exits, applet proceeds)
      await waitFor(() => {
        expect(onGateComplete).toHaveBeenCalled();
      });

      // BankruptcyModal should NOT be visible
      expect(mockContext.executeBankruptcy).not.toHaveBeenCalled();
    });

    test('A3: BankruptcyModal does NOT appear when balance >= 15', () => {
      const { queryByText } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        20
      );

      // Initially "INSUFFICIENT CAPITAL" should not be visible
      expect(queryByText(/INSUFFICIENT CAPITAL/)).toBeNull();
      expect(queryByText(/Cognitive Bankruptcy/)).toBeNull();
    });

    test('A4: Timer completes → handleSurvived awards points', async () => {
      const onGateComplete = jest.fn();
      const { mockContext } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={onGateComplete}
          onClose={jest.fn()}
        />,
        20
      );

      // Fast-forward 60 seconds
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Wait for survival transaction
      await waitFor(() => {
        expect(mockContext.addTransaction).toHaveBeenCalledWith(
          expect.stringContaining('gate_survived'),
          expect.any(Object)
        );
      });

      // Gate should complete
      await waitFor(() => {
        expect(onGateComplete).toHaveBeenCalled();
      });
    });
  });

  // ===== SCENARIO B: Balance = 5 (Bankruptcy) =====

  describe('Scenario B: Balance = 5 (Insufficient for Bypass)', () => {
    test('B1: VagusGatekeeper renders with low balance warning', () => {
      const { getByText, getByTestId } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        5
      );

      // Gate should still render
      expect(getByText(/Stay in Protocol/i)).toBeTruthy();

      // Low balance indicator should show (pulsing red if testID is set)
      // OR we can check if the low balance warning is present
      const gateContainer = getByTestId('vagus-gate-container');
      expect(gateContainer).toBeTruthy();
    });

    test('B2: Bypass button click with balance=5 shows BankruptcyModal', async () => {
      const { getByText, queryByText } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        5
      );

      // Initially no bankruptcy modal
      expect(queryByText(/INSUFFICIENT CAPITAL/)).toBeNull();

      const bypassButton = getByText(/Bypass/i);

      // Click Bypass
      act(() => {
        fireEvent.press(bypassButton);
      });

      // Wait for BankruptcyModal to appear
      await waitFor(() => {
        expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
      });
    });

    test('B3: BankruptcyModal displays correct text when triggered', async () => {
      const { getByText } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        5
      );

      const bypassButton = getByText(/Bypass/i);

      act(() => {
        fireEvent.press(bypassButton);
      });

      await waitFor(() => {
        // Check for bankruptcy modal text
        expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
        expect(getByText(/Cognitive Bankruptcy Triggered/)).toBeTruthy();
      });

      // Should show "Shatter Streak" button (destructive action)
      expect(getByText(/Shatter Streak/)).toBeTruthy();

      // Should show "Return to Protocol" button (safe option)
      expect(getByText(/Return to Protocol/)).toBeTruthy();
    });

    test('B4: Return button in BankruptcyModal closes modal without executing', async () => {
      const onClose = jest.fn();
      const { getByText, queryByText, mockContext } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={onClose}
        />,
        5
      );

      // Trigger bankruptcy modal
      const bypassButton = getByText(/Bypass/i);
      act(() => {
        fireEvent.press(bypassButton);
      });

      await waitFor(() => {
        expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
      });

      // Click "Return to Protocol"
      const returnButton = getByText(/Return to Protocol/);
      act(() => {
        fireEvent.press(returnButton);
      });

      // Modal should close
      await waitFor(() => {
        expect(queryByText(/INSUFFICIENT CAPITAL/)).toBeNull();
      });

      // executeBankruptcy should NOT have been called
      expect(mockContext.executeBankruptcy).not.toHaveBeenCalled();
    });

    test('B5: Hold-to-confirm on Shatter Streak button executes bankruptcy', async () => {
      const { getByText, mockContext } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        5
      );

      // Trigger bankruptcy modal
      const bypassButton = getByText(/Bypass/i);
      act(() => {
        fireEvent.press(bypassButton);
      });

      await waitFor(() => {
        expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
      });

      // Get "Shatter Streak" button
      const shatterButton = getByText(/Shatter Streak/);

      // Simulate press and hold for 3+ seconds
      act(() => {
        fireEvent.press(shatterButton, { target: { props: { onPressIn: true } } });
      });

      // Fast-forward 3 seconds (hold duration)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // executeBankruptcy should be called
      await waitFor(() => {
        expect(mockContext.executeBankruptcy).toHaveBeenCalled();
      });
    });

    test('B6: Releasing Shatter Streak before 3s cancels bankruptcy', async () => {
      const { getByText, mockContext } = renderWithMockedEconomy(
        <VagusGatekeeper
          blockedAppPackage="com.example.blocked"
          blockedAppName="BlockedApp"
          onGateComplete={jest.fn()}
          onClose={jest.fn()}
        />,
        5
      );

      // Trigger bankruptcy modal
      const bypassButton = getByText(/Bypass/i);
      act(() => {
        fireEvent.press(bypassButton);
      });

      await waitFor(() => {
        expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
      });

      // Get "Shatter Streak" button
      const shatterButton = getByText(/Shatter Streak/);

      // Simulate press
      act(() => {
        fireEvent.press(shatterButton, { target: { props: { onPressIn: true } } });
      });

      // Fast-forward only 500ms (less than 3s)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Simulate release (press out)
      act(() => {
        fireEvent(shatterButton, 'pressOut');
      });

      // executeBankruptcy should NOT be called
      expect(mockContext.executeBankruptcy).not.toHaveBeenCalled();
    });
  });

  // ===== BankruptcyModal Standalone Tests =====

  describe('BankruptcyModal Standalone Component', () => {
    test('C1: BankruptcyModal displays balance and warning text', () => {
      const { getByText } = render(
        <BankruptcyModal
          visible={true}
          currentBalance={5}
          onReturn={jest.fn()}
          onConfirmBankruptcy={jest.fn()}
        />
      );

      expect(getByText(/INSUFFICIENT CAPITAL/)).toBeTruthy();
      expect(getByText(/5/)).toBeTruthy(); // Shows balance
    });

    test('C2: BankruptcyModal hidden when visible=false', () => {
      const { queryByText } = render(
        <BankruptcyModal
          visible={false}
          currentBalance={5}
          onReturn={jest.fn()}
          onConfirmBankruptcy={jest.fn()}
        />
      );

      expect(queryByText(/INSUFFICIENT CAPITAL/)).toBeNull();
    });

    test('C3: onReturn callback fires when Return button pressed', () => {
      const onReturn = jest.fn();
      const { getByText } = render(
        <BankruptcyModal
          visible={true}
          currentBalance={5}
          onReturn={onReturn}
          onConfirmBankruptcy={jest.fn()}
        />
      );

      const returnButton = getByText(/Return to Protocol/);
      act(() => {
        fireEvent.press(returnButton);
      });

      expect(onReturn).toHaveBeenCalled();
    });
  });
});
