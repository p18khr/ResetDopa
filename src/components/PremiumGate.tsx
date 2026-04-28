import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

interface PremiumGateProps {
  feature: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onBack: () => void;
}

/**
 * Full-screen upsell shown when a free user tries to access a premium feature.
 * Tapping "Unlock Premium" opens the RevenueCat paywall.
 * Tapping "Restore Purchases" restores existing subscriptions.
 */
export function PremiumGate({ feature, description, icon, onBack }: PremiumGateProps) {
  const { colors } = useTheme();
  const { presentPaywall, restorePurchases } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleUnlock = useCallback(async () => {
    setLoading(true);
    try {
      const result = await presentPaywall();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        // SubscriptionContext listener will flip isPremium → parent re-renders
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open paywall. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [presentPaywall]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        Alert.alert('No purchases found', 'No active subscription was found for this account.');
      }
    } catch {
      Alert.alert('Error', 'Restore failed. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={[styles.iconRing, { borderColor: PREMIUM_GOLD }]}>
          <Ionicons name={icon} size={40} color={PREMIUM_GOLD} />
        </View>

        <Text style={[styles.lockLabel, { color: PREMIUM_GOLD }]}>PREMIUM FEATURE</Text>
        <Text style={[styles.featureName, { color: colors.text }]}>{feature}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

        <View style={[styles.bulletBox, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.perkText, { color: colors.text }]}>{perk}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.priceLine, { color: colors.textSecondary }]}>
          Just <Text style={[styles.priceStrong, { color: colors.text }]}>$6.99/month</Text> · 7-day free trial
        </Text>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: PREMIUM_GOLD }]}
          onPress={handleUnlock}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.ctaText}>Unlock ResetDopa Pro</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const PREMIUM_GOLD = '#FFD700';

const PERKS = [
  'Block social media with a 60-second calm-down gate',
  'Spend earned Calm Points on streak repairs and themes',
  'Get your full weekly behavior report every Sunday',
  'Unlock your personalized next-week action plan',
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backText: { fontSize: 14, fontWeight: '600' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  bulletBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 32,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center' },
  perkText: { fontSize: 14 },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  priceLine: { fontSize: 13, marginBottom: 14, textAlign: 'center' },
  priceStrong: { fontWeight: '800' },
  restoreBtn: { paddingVertical: 8 },
  restoreText: { fontSize: 13 },
});
