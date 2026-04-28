import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';

const PREMIUM_GOLD = '#FFD700';

let EconomyContext: any = null;

interface BalanceHeaderProps {
  onPressStore?: () => void;
  showStoreLink?: boolean;
}

export function BalanceHeader({
  onPressStore,
  showStoreLink = true,
}: BalanceHeaderProps): React.ReactElement {
  const { colors } = useTheme();
  const { isPremium } = useSubscription();

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
  const balanceColor = isLowBalance ? '#FF3333' : colors.text;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.labelRow}>
          <Ionicons name="diamond" size={12} color={PREMIUM_GOLD} style={{ marginRight: 6 }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            CALM POINTS
          </Text>
        </View>
        <Text style={[styles.balance, { color: balanceColor }]}>{balance}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isLowBalance
            ? 'Below 15 — cannot bypass Vagus gate'
            : 'Earned by surviving urges'}
        </Text>
      </View>

      {showStoreLink && (
        <TouchableOpacity
          style={[
            styles.cta,
            isPremium
              ? { backgroundColor: PREMIUM_GOLD }
              : { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 },
          ]}
          onPress={onPressStore}
          activeOpacity={0.8}
        >
          {isPremium ? (
            <>
              <Text style={styles.ctaTextPremium}>SPEND</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" style={{ marginLeft: 4 }} />
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.ctaTextFree, { color: colors.textSecondary }]}>STORE</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  left: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balance: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  ctaTextPremium: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  ctaTextFree: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
});
