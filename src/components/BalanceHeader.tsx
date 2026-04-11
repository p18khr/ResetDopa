import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Lazy load context
let EconomyContext: any = null;

interface BalanceHeaderProps {
  onPressStore?: () => void;
  showStoreLink?: boolean;
}

export function BalanceHeader({
  onPressStore,
  showStoreLink = true,
}: BalanceHeaderProps): React.ReactElement {
  const { isDarkMode, colors } = useTheme();

  // Lazy load context on first render
  if (!EconomyContext) {
    EconomyContext = require('../context/EconomyContext').EconomyContext;
  }

  let balance = 0;
  try {
    const economyValue = useContext(EconomyContext);
    balance = economyValue?.balance || 0;
  } catch (e) {
    // Context not available
  }

  const isLowBalance = balance < 15;
  const balanceColor = isLowBalance ? '#FF3333' : colors.accent;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfacePrimary,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.balanceWrapper}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Calm Points
        </Text>
        <Text style={[styles.balance, { color: balanceColor }]}>
          {balance}
        </Text>
        {isLowBalance && (
          <Text style={[styles.warning, { color: '#FF3333' }]}>
            ⚠️ Cannot bypass gate
          </Text>
        )}
      </View>

      {showStoreLink && (
        <TouchableOpacity
          style={[styles.storeButton, { backgroundColor: colors.accent }]}
          onPress={onPressStore}
        >
          <Text style={styles.storeButtonText}>Store</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  balanceWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
  },
  warning: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  storeButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  storeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
