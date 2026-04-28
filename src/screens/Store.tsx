import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useEconomy } from '../context/EconomyContext';
import { AppContext } from '../context/AppContext';
import { STORE_ITEMS } from '../constants/economyConstants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PremiumGate } from '../components/PremiumGate';

function Store({ navigation }: { navigation: any }): React.ReactElement {
  const { colors } = useTheme();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { balance, purchaseItem, ownedItems } = useEconomy();
  const { user } = useAuth() as any;
  const { streak, setStreak } = useContext(AppContext) as any;
  const { isPremium, presentCustomerCenter } = useSubscription();

  const isItemOwned = (itemId: string, isPermanent: boolean): boolean => {
    return ownedItems.some((p) => {
      if (p.itemId !== itemId) return false;
      if (isPermanent) return true;
      const expiry = p.expiresAt?.toDate?.() || (p.expiresAt ? new Date(p.expiresAt) : null);
      return expiry ? expiry > new Date() : false;
    });
  };

  const isMonthlyLimitReached = (itemId: string, maxPerMonth: number): boolean => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = ownedItems.filter((p) => {
      if (p.itemId !== itemId) return false;
      const granted = p.grantedAt?.toDate?.() || (p.grantedAt ? new Date(p.grantedAt) : null);
      return granted ? granted >= thirtyDaysAgo : false;
    });
    return recent.length >= maxPerMonth;
  };

  const handlePurchase = useCallback(
    async (itemId: string) => {
      if (!purchaseItem) {
        Alert.alert('Error', 'Economy system not initialized');
        return;
      }

      setLoadingItemId(itemId);
      setError(null);

      try {
        const result = await purchaseItem(itemId);

        if (result.success) {
          if (itemId === 'streak_repair' && user?.uid) {
            const restoredStreak = Math.max(streak, 1);
            setStreak(restoredStreak);
            await updateDoc(doc(db, 'users', user.uid), {
              currentStreak: true,
              streak: restoredStreak,
            });
            Alert.alert('Streak Repaired', `Your streak has been restored to ${restoredStreak} days.`);
          } else {
            Alert.alert('Purchase Successful', 'Purchase complete!');
          }
        } else {
          setError(result.error || 'Purchase failed');
          Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        Alert.alert('Error', errorMsg);
      } finally {
        setLoadingItemId(null);
      }
    },
    [purchaseItem, user?.uid, streak, setStreak]
  );

  if (!isPremium) {
    return (
      <PremiumGate
        feature="Calm Points Store"
        description="Spend Calm Points you've earned on streak repairs, themes, and exclusive features."
        icon="storefront"
        onBack={() => navigation.goBack()}
      />
    );
  }

  const canPurchase = (cost: number): boolean => balance >= cost;

  // Group items by category
  const itemsByCategory = {
    feature: Object.entries(STORE_ITEMS)
      .filter(([_, item]) => item.category === 'feature')
      .map(([key, item]) => item),
    boost: Object.entries(STORE_ITEMS)
      .filter(([_, item]) => item.category === 'boost')
      .map(([key, item]) => item),
    cosmetic: Object.entries(STORE_ITEMS)
      .filter(([_, item]) => item.category === 'cosmetic')
      .map(([key, item]) => item),
  };

  const renderStoreItem = (item: any) => {
    const isAffordable = canPurchase(item.cost);
    const isItemLoading = loadingItemId === item.id;
    const isPermanent = item.duration === null;
    const owned = isItemOwned(item.id, isPermanent);
    const monthlyMaxed = item.maxPurchasesPerMonth
      ? isMonthlyLimitReached(item.id, item.maxPurchasesPerMonth)
      : false;
    const canBuy = isAffordable && !owned && !monthlyMaxed;

    let buttonLabel = 'Purchase';
    let buttonColor = colors.accent;
    if (owned && item.category === 'cosmetic') {
      buttonLabel = 'EQUIPPED';
      buttonColor = '#10B981';
    } else if (owned && item.category === 'feature') {
      buttonLabel = 'Purchased ✓';
      buttonColor = '#10B981';
    } else if (monthlyMaxed) {
      buttonLabel = 'Used this month';
      buttonColor = colors.border;
    } else if (!isAffordable) {
      buttonLabel = 'Insufficient';
      buttonColor = colors.border;
    }

    return (
      <View
        key={item.id}
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: owned ? '#10B981' : isAffordable ? colors.accent : colors.border,
            opacity: canBuy ? 1 : 0.6,
          },
        ]}
      >
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text
            style={[
              styles.itemCost,
              { color: canBuy ? colors.accent : colors.textSecondary },
            ]}
          >
            {item.cost} Calm Points
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: buttonColor }]}
          onPress={() => handlePurchase(item.id)}
          disabled={!canBuy || isItemLoading}
        >
          {isItemLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.purchaseButtonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategory = (title: string, items: any[]) => {
    if (items.length === 0) return null;

    return (
      <View key={title} style={styles.category}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
        {items.map(renderStoreItem)}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Header */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: balance < 15 ? '#FF3333' : colors.accent,
            },
          ]}
        >
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Your Balance
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              {
                color: balance < 15 ? '#FF3333' : colors.accent,
              },
            ]}
          >
            {balance}
          </Text>
          <Text style={[styles.balanceSubtext, { color: colors.textSecondary }]}>
            Calm Points
          </Text>
          {balance < 15 && (
            <Text style={[styles.warningText, { color: '#FF3333' }]}>
              ⚠️ Low balance - cannot bypass gate
            </Text>
          )}
          <TouchableOpacity
            style={[styles.auditButton, { borderColor: colors.border }]}
            onPress={presentCustomerCenter}
          >
            <Text style={[styles.auditButtonText, { color: colors.textSecondary }]}>
              MANAGE SUBSCRIPTION
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#FF3333' }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Store Items by Category */}
        {renderCategory('✨ Premium Features', itemsByCategory.feature)}
        {renderCategory('🔧 Boosts & Repairs', itemsByCategory.boost)}
        {renderCategory('🎨 Cosmetics', itemsByCategory.cosmetic)}

        {/* Empty State */}
        {Object.values(itemsByCategory).every((cat) => cat.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No items available
            </Text>
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            💡 Earn Calm Points by:
          </Text>
          <Text style={[styles.footerBullet, { color: colors.textSecondary }]}>
            • Surviving the 60-second gate block (+2 points)
          </Text>
          <Text style={[styles.footerBullet, { color: colors.textSecondary }]}>
            • Completing daily tasks (+5-12 points)
          </Text>
          <Text style={[styles.footerBullet, { color: colors.textSecondary }]}>
            • Maintaining your streak (bonus points)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  itemCost: {
    fontSize: 14,
    fontWeight: '700',
  },
  purchaseButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
  },
  footerInfo: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  footerBullet: {
    fontSize: 13,
    lineHeight: 20,
  },
  auditButton: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  auditButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Store;
