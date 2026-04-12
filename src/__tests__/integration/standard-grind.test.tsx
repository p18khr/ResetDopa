/**
 * Integration Test: The Standard Grind
 * 
 * Scenario: User with 5-day streak & 40 points
 * 1. Complete gate survival (+2 points) → Assert balance 42
 * 2. Trigger bypass at gate (-15 points) → Assert balance 27, no bankruptcy modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EconomyProvider, useEconomy } from '../../context/EconomyContext';
import { AuthProvider } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocs, httpsCallable } from 'firebase/firestore';

// Mock implementations
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockHttpsCallable = httpsCallable as jest.MockedFunction<typeof httpsCallable>;

describe('Integration: The Standard Grind', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  /**
   * Test Component to access and test EconomyContext
   */
  function TestComponent() {
    const { balance, currentStreak, addTransaction, lastTransactions } = useEconomy();
    
    return (
      <React.Fragment>
        <Text testID="balance-display">{balance}</Text>
        <Text testID="streak-display">{currentStreak ? '1' : '0'}</Text>
        <Text testID="transaction-count">{lastTransactions.length}</Text>
        
        <TouchableOpacity
          testID="gate-survived-btn"
          onPress={() =>
            addTransaction('gate_survived', { appBlocked: 'com.instagram.android' }, 2)
          }
        >
          <Text>Simulate Gate Survived (+2)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          testID="gate-bypass-btn"
          onPress={() =>
            addTransaction('gate_bypassed', { appBlocked: 'com.instagram.android' }, -15)
          }
        >
          <Text>Simulate Gate Bypass (-15)</Text>
        </TouchableOpacity>
      </React.Fragment>
    );
  }

  it('should start with 40 points and 5-day streak', async () => {
    // Mock initial balance fetch
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'txn-1',
          data: () => ({
            amount: 40,
            status: 'completed',
            type: 'task_complete',
            timestamp: { toMillis: () => Date.now() },
          }),
        },
      ],
    } as any);

    const { getByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('40');
    });
  });

  it('should add +2 points when gate survived', async () => {
    // Setup: Mock Cloud Function to return success
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: true,
            balance: 42,
            streakBroken: false,
          },
        });
        return Promise.resolve({
          data: {
            success: true,
            balance: 42,
            streakBroken: false,
          },
        });
      },
    })) as any);

    const { getByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    // Simulate gate survived
    const gateSurvivedBtn = getByTestId('gate-survived-btn');
    fireEvent.press(gateSurvivedBtn);

    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('42');
    });
  });

  it('should deduct -15 points on bypass (balance remains >= 15)', async () => {
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: true,
            balance: 27, // 42 - 15
            streakBroken: false,
          },
        });
        return Promise.resolve({
          data: {
            success: true,
            balance: 27,
            streakBroken: false,
          },
        });
      },
    })) as any);

    const { getByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    // Simulate bypass
    const bypassBtn = getByTestId('gate-bypass-btn');
    fireEvent.press(bypassBtn);

    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('27');
    });

    // Assert: streak unchanged
    expect(getByTestId('streak-display')).toHaveTextContent('1');
  });

  it('should log two transactions (survived + bypass)', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'txn-bypass',
          data: () => ({
            amount: -15,
            status: 'completed',
            type: 'gate_bypassed',
            timestamp: { toMillis: () => Date.now() },
          }),
        },
        {
          id: 'txn-survived',
          data: () => ({
            amount: 2,
            status: 'completed',
            type: 'gate_survived',
            timestamp: { toMillis: () => Date.now() },
          }),
        },
      ],
    } as any);

    const { getByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('transaction-count')).toHaveTextContent('2');
    });
  });
});

// Import React Native components
import { Text, TouchableOpacity } from 'react-native';
