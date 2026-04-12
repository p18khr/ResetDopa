/**
 * Integration Test: Bankruptcy Modal Trigger & Cancel
 * 
 * Scenario: User with 1-day streak & 10 points (insufficient for bypass)
 * 1. Click bypass → BankruptcyModal appears (10 < 15)
 * 2. Click "Return to Protocol" → Modal closes, state unchanged
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { EconomyProvider, useEconomy } from '../../context/EconomyContext';
import { AuthProvider } from '../../context/AuthContext';
import { BankruptcyModal } from '../../components/BankruptcyModal';
import { BANKRUPTCY_BALANCE_THRESHOLD } from '../../constants/economyConstants';

describe('Integration: Bankruptcy Cancel Flow', () => {
  function TestComponent() {
    const { balance, currentStreak } = useEconomy();
    const [showBankruptcy, setShowBankruptcy] = useState(false);

    const handleBypassClick = () => {
      // Simulate the decision logic from VagusGatekeeper
      if (balance < BANKRUPTCY_BALANCE_THRESHOLD) {
        setShowBankruptcy(true);
      }
    };

    return (
      <View>
        <Text testID="balance-display">{balance}</Text>
        <Text testID="streak-display">{currentStreak ? '1' : '0'}</Text>
        
        <TouchableOpacity
          testID="bypass-btn"
          onPress={handleBypassClick}
        >
          <Text>Bypass Response (-15 pts)</Text>
        </TouchableOpacity>

        <BankruptcyModal
          visible={showBankruptcy}
          currentBalance={balance}
          onReturn={() => setShowBankruptcy(false)}
          onConfirmBankruptcy={async () => {
            // Mock bankruptcy execution
            setShowBankruptcy(false);
          }}
        />

        {showBankruptcy && <Text testID="bankruptcy-modal-visible">Modal Open</Text>}
      </View>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show BankruptcyModal when balance < 15 and bypass clicked', async () => {
    const { getByTestId, queryByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    // Initial state: modal should not be visible
    await waitFor(() => {
      expect(queryByTestId('bankruptcy-modal-visible')).toBeNull();
    });

    // User has 10 points
    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('10');
    });

    // Click bypass
    const bypassBtn = getByTestId('bypass-btn');
    fireEvent.press(bypassBtn);

    // Modal should now be visible
    await waitFor(() => {
      expect(getByTestId('bankruptcy-modal-visible')).toBeDefined();
    });
  });

  it('should close modal and preserve state when "Return to Protocol" clicked', async () => {
    const { getByTestId, queryByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    // Setup: Initial state with 10 points
    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('10');
    });

    // Trigger bypass (show modal)
    const bypassBtn = getByTestId('bypass-btn');
    fireEvent.press(bypassBtn);

    await waitFor(() => {
      expect(getByTestId('bankruptcy-modal-visible')).toBeDefined();
    });

    // Click return button (this would be the green button in BankruptcyModal)
    // We need to find it within the modal
    const returnButton = getByTestId('bankruptcy-return-btn');
    fireEvent.press(returnButton);

    // Modal should close
    await waitFor(() => {
      expect(queryByTestId('bankruptcy-modal-visible')).toBeNull();
    });

    // Balance and streak should be unchanged
    expect(getByTestId('balance-display')).toHaveTextContent('10');
    expect(getByTestId('streak-display')).toHaveTextContent('1');
  });

  it('should NOT log bankruptcy transaction when modal is cancelled', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <EconomyProvider>
          <TestComponent />
        </EconomyProvider>
      </AuthProvider>
    );

    // Get initial balance
    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('10');
    });

    // Trigger and cancel
    fireEvent.press(getByTestId('bypass-btn'));
    fireEvent.press(getByTestId('bankruptcy-return-btn'));

    // Balance should still be 10 (no transaction logged)
    await waitFor(() => {
      expect(getByTestId('balance-display')).toHaveTextContent('10');
    });
  });
});
