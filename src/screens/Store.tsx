import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { STORE_ITEMS } from '../constants/economyConstants';

// Dynamic import to avoid circular dependency issues at module load time
let EconomyContext: any = null;

function Store({ navigation }: { navigation: any }): React.ReactElement {
  const { isDarkMode, colors } = useTheme();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy load context on first render
  if (!EconomyContext) {
    EconomyContext = require('../context/EconomyContext').EconomyContext;
  }

  let economyValue: any;
  try {
    economyValue = useContext(EconomyContext);
  } catch (e) {
    console.error('Error accessing EconomyContext:', e);
    economyValue = null;
  }

  const balance = economyValue?.balance || 0;
  const purchaseItem = economyValue?.purchaseItem;
  const isLoading = economyValue?.isLoading || false;

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
          Alert.alert('Purchase Successful', `You've purchased: ${result.item.name}`);
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
    [purchaseItem]
  );

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
    const isLoading = loadingItemId === item.id;

    return (
      <View
        key={item.id}
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.surfacePrimary,
            borderColor: isAffordable ? colors.accent : colors.border,
            opacity: isAffordable ? 1 : 0.6,
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
              {
                color: isAffordable ? colors.accent : colors.textSecondary,
              },
            ]}
          >
            {item.cost} Calm Points
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            {
              backgroundColor: isAffordable ? colors.accent : colors.border,
            },
          ]}
          onPress={() => handlePurchase(item.id)}
          disabled={!isAffordable || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              {isAffordable ? 'Purchase' : 'Insufficient'}
            </Text>
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
});

export default Store;
