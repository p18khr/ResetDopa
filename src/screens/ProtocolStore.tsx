/**
 * Protocol Store Screen - Brutalist Dark Mode
 * User spends Calm Points on the 3 premium items.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useEconomy } from '../context/EconomyContext';

// Dynamic import to avoid circular dependency issues at module load time
let EconomyContext: any = null;

const PROTOCOL_ITEMS = [
  {
    id: 'ai_protocol',
    name: "Next Week's AI Protocol",
    subtitle: 'Unlock your personalized Llama-3.1 battle plan',
    cost: 100,
    description: 'Weekly personalized insights & breakthrough patterns from your activities.',
  },
  {
    id: 'streak_repair',
    name: 'Grace Protocol / Streak Repair',
    subtitle: 'Repair one broken day on your 30-day heatmap',
    cost: 400,
    description: 'Restore your broken streak and resume progress. One-time monthly use.',
  },
  {
    id: 'vantablack_theme',
    name: 'Vantablack Operator Theme',
    subtitle: 'Permanent UI unlock. Pure OLED black',
    cost: 1000,
    description: 'Minimal, pure black theme for OLED devices. Reduces eye strain.',
    owned: false,
  },
];

function SuccessToast({ visible, itemName }: { visible: boolean; itemName: string }) {
  if (!visible) return null;
  return (
    <Animated.View style={styles.successToast}>
      <Text style={styles.successToastText}>✓ {itemName} Acquired</Text>
      <Text style={styles.successToastSubtext}>Transaction Verified</Text>
    </Animated.View>
  );
}

function StoreItemCard({
  item,
  affordable,
  purchasing,
  onPress,
}: {
  item: any;
  affordable: boolean;
  purchasing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!affordable || purchasing || item.owned}
      style={({ pressed }) => [
        styles.itemCard,
        !affordable || item.owned ? styles.itemCardDisabled : null,
        pressed && affordable && !item.owned ? styles.itemCardPressed : null,
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.itemCost}>{item.cost}</Text>
      </View>

      <Text style={styles.itemDescription}>{item.description}</Text>

      <Pressable
        style={[
          styles.acquireButton,
          !affordable || item.owned ? styles.acquireButtonDisabled : null,
        ]}
        disabled={!affordable || purchasing || item.owned}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : item.owned ? (
          <Text style={styles.acquireButtonText}>EQUIPPED</Text>
        ) : affordable ? (
          <Text style={styles.acquireButtonText}>ACQUIRE</Text>
        ) : (
          <Text style={[styles.acquireButtonText, styles.insufficientText]}>
            INSUFFICIENT CAPITAL
          </Text>
        )}
      </Pressable>
    </Pressable>
  );
}

export function ProtocolStoreScreen({ navigation }: { navigation: any }) {
  const { balance, purchaseItem, isLoading } = useEconomy();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState({ visible: false, itemName: '' });

  const handlePurchase = useCallback(
    async (item: any) => {
      try {
        setPurchasingId(item.id);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        const result = await purchaseItem(item.id);

        if (result.success) {
          setSuccessToast({ visible: true, itemName: item.name });
          setTimeout(() => setSuccessToast({ visible: false, itemName: '' }), 2000);
        } else {
          Alert.alert('Purchase Failed', result.error || 'Unable to complete transaction');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Error', errorMsg);
      } finally {
        setPurchasingId(null);
      }
    },
    [purchaseItem]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerLabel}>CALM POINTS</Text>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceGlow} />
            <Text style={styles.balanceText}>{balance}</Text>
          </View>
          <Text style={styles.balanceHint}>Your available capital</Text>
        </View>

        <View style={styles.storeHeader}>
          <Text style={styles.storeTitle}>PROTOCOL STORE</Text>
          <Text style={styles.storeSubtitle}>Exclusive upgrades for the disciplined</Text>
        </View>

        <View style={styles.catalog}>
          {PROTOCOL_ITEMS.map((item) => {
            const affordable = balance >= item.cost;
            const isPurchasing = purchasingId === item.id;
            return (
              <StoreItemCard
                key={item.id}
                item={item}
                affordable={affordable}
                purchasing={isPurchasing || isLoading}
                onPress={() => handlePurchase(item)}
              />
            );
          })}
        </View>

        <View style={styles.infoFooter}>
          <Text style={styles.infoText}>
            All purchases are permanent and non-refundable. Choose wisely.
          </Text>
        </View>
      </ScrollView>

      <SuccessToast visible={successToast.visible} itemName={successToast.itemName} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },

  header: {
    alignItems: 'center',
    marginBottom: 48,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLabel: {
    fontSize: 11,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    fontWeight: '600',
  },
  balanceContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    top: -50,
    left: -50,
  },
  balanceText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4A90E2',
    letterSpacing: -2,
    zIndex: 1,
  },
  balanceHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },

  storeHeader: { marginBottom: 32 },
  storeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  storeSubtitle: {
    fontSize: 14,
    color: '#999999',
    letterSpacing: 0.5,
  },

  catalog: { gap: 16, marginBottom: 32 },

  itemCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 4,
    padding: 20,
    gap: 12,
  },
  itemCardDisabled: { opacity: 0.5 },
  itemCardPressed: {
    backgroundColor: '#111111',
    borderColor: '#4A90E2',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemTitleSection: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  itemCost: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4A90E2',
    minWidth: 60,
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 18,
  },

  acquireButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  acquireButtonDisabled: {
    backgroundColor: '#0A0A0A',
    borderColor: '#333333',
    opacity: 0.5,
  },
  acquireButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A90E2',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  insufficientText: { color: '#FF3333' },

  successToast: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: '#00CC00',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 4,
    zIndex: 1000,
  },
  successToastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  successToastSubtext: {
    fontSize: 11,
    color: '#000000',
    marginTop: 4,
    opacity: 0.8,
  },

  infoFooter: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
