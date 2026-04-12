/**
 * Integration Test: Store Purchase Validation
 * 
 * Scenario: User with 200 Calm Points
 * 1. Buy AI_PROTOCOL (100) → Success, balance 100
 * 2. Buy STREAK_REPAIR (400) → Fail (insufficient), balance 100
 * 3. Buy VANTABLACK_THEME (1000) → Fail (insufficient), balance 100
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { EconomyProvider, useEconomy } from '../../context/EconomyContext';
import { AuthProvider } from '../../context/AuthContext';
import {
  STORE_ITEMS,
} from '../../constants/economyConstants';
import { httpsCallable } from 'firebase/firestore';

const mockHttpsCallable = httpsCallable as jest.MockedFunction<typeof httpsCallable>;

describe('Integration: Store Purchase Logic', () => {
  function TestComponent() {
    const { balance, purchaseItem } = useEconomy();
    const [purchaseStatus, setPurchaseStatus] = React.useState<{
      itemId: string;
      success: boolean;
      newBalance: number;
    } | null>(null);

    const handlePurchase = async (itemId: string) => {
      try {
        const result = await purchaseItem(itemId);
        setPurchaseStatus({
          itemId,
          success: result.success,
          newBalance: result.balance || balance,
        });
      } catch (error) {
        setPurchaseStatus({
          itemId,
          success: false,
          newBalance: balance,
        });
      }
    };

    return (
      <View>
        <Text testID="balance-display">{balance}</Text>

        {/* AI Protocol (100 points) */}
        <TouchableOpacity
          testID="buy-ai-protocol"
          onPress={() => handlePurchase(STORE_ITEMS.WEEKLY_AI_PROTOCOL.id)}
        >
          <Text>Buy AI Protocol ({STORE_ITEMS.WEEKLY_AI_PROTOCOL.cost})</Text>
        </TouchableOpacity>

        {/* Streak Repair (400 points) */}
        <TouchableOpacity
          testID="buy-streak-repair"
          onPress={() => handlePurchase(STORE_ITEMS.STREAK_REPAIR.id)}
        >
          <Text>Buy Streak Repair ({STORE_ITEMS.STREAK_REPAIR.cost})</Text>
        </TouchableOpacity>

        {/* Vantablack Theme (1000 points) */}
        <TouchableOpacity
          testID="buy-vantablack"
          onPress={() => handlePurchase(STORE_ITEMS.VANTABLACK_THEME.id)}
        >
          <Text>Buy Vantablack ({STORE_ITEMS.VANTABLACK_THEME.cost})</Text>
        </TouchableOpacity>

        {purchaseStatus && (
          <Text testID="purchase-result">
            {purchaseStatus.itemId}: {purchaseStatus.success ? 'SUCCESS' : 'FAILED'}
          </Text>
        )}
      </View>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpsCallable.mockClear();
  });

  it('should have initial balance of 200 points', async () => {
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: true,
            balance: 200,
          },
        });
        return Promise.resolve({
          data: { success: true, balance: 200 },
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

    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('200');
    });
  });

  it('should allow purchase of AI_PROTOCOL (100 points) and reduce balance to 100', async () => {
    // First call: get initial balance
    // Second call: purchase AI protocol
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: true,
            balance: 100, // 200 - 100
            item: STORE_ITEMS.WEEKLY_AI_PROTOCOL,
          },
        });
        return Promise.resolve({
          data: {
            success: true,
            balance: 100,
            item: STORE_ITEMS.WEEKLY_AI_PROTOCOL,
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

    // Click purchase button
    const buyBtn = getByTestId('buy-ai-protocol');
    fireEvent.press(buyBtn);

    // Verify result
    await waitFor(() => {
      expect(getByTestId('purchase-result')).toHaveTextContent('SUCCESS');
    });

    // Balance should be 100
    expect(getByTestId('balance-display')).toHaveTextContent('100');
  });

  it('should reject STREAK_REPAIR purchase (400 > 100 remaining balance)', async () => {
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: false,
            balance: 100, // unchanged
            error: 'insufficient_balance',
          },
        });
        return Promise.resolve({
          data: {
            success: false,
            balance: 100,
            error: 'insufficient_balance',
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

    // Assume balance is 100 after previous purchase
    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('100');
    });

    // Try to buy Streak Repair
    const buyBtn = getByTestId('buy-streak-repair');
    fireEvent.press(buyBtn);

    // Should fail
    await waitFor(() => {
      expect(getByTestId('purchase-result')).toHaveTextContent('FAILED');
    });

    // Balance should remain 100
    expect(getByTestId('balance-display')).toHaveTextContent('100');
  });

  it('should reject VANTABLACK_THEME purchase (1000 > 100 balance)', async () => {
    mockHttpsCallable.mockReturnValue((() => ({
      then: (callback: any) => {
        callback({
          data: {
            success: false,
            balance: 100,
            error: 'insufficient_balance',
          },
        });
        return Promise.resolve({
          data: {
            success: false,
            balance: 100,
            error: 'insufficient_balance',
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

    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('100');
    });

    // Try to buy Vantablack
    const buyBtn = getByTestId('buy-vantablack');
    fireEvent.press(buyBtn);

    // Should fail
    await waitFor(() => {
      expect(getByTestId('purchase-result')).toHaveTextContent('FAILED');
    });

    // Balance unchanged
    expect(getByTestId('balance-display')).toHaveTextContent('100');
  });

  it('should validate store item costs match constants', () => {
    expect(STORE_ITEMS.WEEKLY_AI_PROTOCOL.cost).toBe(100);
    expect(STORE_ITEMS.STREAK_REPAIR.cost).toBe(400);
    expect(STORE_ITEMS.VANTABLACK_THEME.cost).toBe(1000);
  });
});
