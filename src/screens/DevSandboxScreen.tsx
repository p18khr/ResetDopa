/**
 * Developer Sandbox Screen - __DEV__ Only
 *
 * Debug interface for manual testing of Economy features:
 * - State injectors (balance, streak)
 * - Timer overrides (60s → 1s)
 * - Trigger UI components
 * - Live context monitoring
 *
 * Access: Always hidden in production. In __DEV__, tap "System" button on Dashboard
 *
 * WARNING: This screen modifies app state directly. Only for development/testing.
 */

import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { VagusGatekeeper } from '../components/VagusGatekeeper';
import { Store } from '../screens/Store';
import { Ionicons } from '@expo/vector-icons';

// Lazy load EconomyContext
let EconomyContext: any = null;

interface DevSandboxScreenProps {
  navigation: any;
}

export function DevSandboxScreen({ navigation }: DevSandboxScreenProps): React.ReactElement {
  const { isDarkMode, colors } = useTheme();

  // Lazy load context
  if (!EconomyContext) {
    EconomyContext = require('../context/EconomyContext').EconomyContext;
  }

  let economyValue: any;
  try {
    economyValue = useContext(EconomyContext);
  } catch (e) {
    economyValue = null;
  }

  const balance = economyValue?.balance || 0;
  const currentStreak = economyValue?.currentStreak || false;
  const lastTransactions = economyValue?.lastTransactions || [];
  const addTransaction = economyValue?.addTransaction;

  // ===== LOCAL STATE FOR DEBUG FEATURES =====
  const [showGate, setShowGate] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [mockTimerEnabled, setMockTimerEnabled] = useState(false);
  const [simulatingBalance, setSimulatingBalance] = useState<number | null>(null);

  // ===== STATE INJECTORS =====

  /**
   * Set balance to a specific value
   * Works by calculating and executing a transaction to reach that balance
   */
  const setBalance = useCallback(
    async (targetBalance: number) => {
      if (!addTransaction) {
        Alert.alert('Error', 'Economy context not available');
        return;
      }

      try {
        const diff = targetBalance - balance;

        if (diff === 0) {
          Alert.alert('Balance', `Already at ${balance} points`);
          return;
        }

        // Create a debug transaction to adjust balance
        const result = await addTransaction('admin_adjustment', {
          reason: `[DEV] Manual balance adjustment to ${targetBalance}`,
          previousBalance: balance,
          targetBalance,
        }, Math.abs(diff));

        if (result.success) {
          setSimulatingBalance(targetBalance);
          Alert.alert(
            'Balance Updated',
            `Set to ${targetBalance} points\n(via debug transaction)`
          );
        } else {
          Alert.alert('Error', 'Failed to update balance');
        }
      } catch (error) {
        console.error('[DevSandbox] Balance update error:', error);
        Alert.alert('Error', `${error}`);
      }
    },
    [balance, addTransaction]
  );

  const handleSetBalance0 = () => setBalance(0);
  const handleSetBalance14 = () => setBalance(14); // Bankruptcy edge
  const handleSetBalance1000 = () => setBalance(1000); // Whale mode

  // ===== TRIGGER BUTTONS =====

  const handleLaunchGate = useCallback(() => {
    setShowGate(true);
  }, []);

  const handleLaunchStore = useCallback(() => {
    setShowStore(true);
  }, []);

  const handleGateComplete = useCallback(() => {
    setShowGate(false);
    Alert.alert('Gate Complete', 'User proceeded (reality: gate would close)');
  }, []);

  const handleGateClose = useCallback(() => {
    setShowGate(false);
  }, []);

  // ===== STATE DISPLAY =====

  const contextSnapshot = useMemo(
    () => ({
      balance: simulatingBalance !== null ? simulatingBalance : balance,
      currentStreak,
      lastTransactions: lastTransactions.slice(0, 3), // Last 3
      timestamp: new Date().toISOString(),
    }),
    [balance, currentStreak, lastTransactions, simulatingBalance]
  );

  // ===== RENDER HELPERS =====

  const DebugButton = ({
    title,
    onPress,
    variant = 'primary',
  }: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'success' | 'danger';
  }) => {
    let bgColor = colors.accent;
    if (variant === 'success') bgColor = '#10B981';
    if (variant === 'danger') bgColor = '#EF4444';

    return (
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: bgColor }]}
        onPress={onPress}
      >
        <Text style={styles.debugButtonText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );

  // If not in dev mode, don't render
  if (!__DEV__) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 16 }}>
          DevSandbox only available in __DEV__ mode
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="bug"
            size={24}
            color={colors.accent}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.title, { color: colors.text }]}>Developer Sandbox</Text>
          <TouchableOpacity
            style={{ marginLeft: 'auto' }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Live Context Monitor */}
        <View style={[styles.monitorCard, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={[styles.monitorTitle, { color: colors.accent }]}>
            📊 Context Live Monitor
          </Text>
          <View
            style={[styles.jsonDisplay, { backgroundColor: `${colors.text}08` }]}
          >
            <Text style={[styles.jsonText, { color: colors.textSecondary, fontFamily: 'monospace' }]}>
              {JSON.stringify(contextSnapshot, null, 2)}
            </Text>
          </View>
        </View>

        {/* State Injectors */}
        <SectionTitle title="🎮 State Injectors" />

        <View style={styles.buttonGroup}>
          <DebugButton title="Balance = 0" onPress={handleSetBalance0} />
          <DebugButton title="Balance = 14 (Edge)" onPress={handleSetBalance14} />
          <DebugButton title="Balance = 1000 (Whale)" onPress={handleSetBalance1000} />
        </View>

        {/* Timer Override */}
        <SectionTitle title="⏱️ Timer Override" />

        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.surfacePrimary, borderColor: colors.border },
          ]}
        >
          <View>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Mock 60s → 1s Timer
            </Text>
            <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
              (Applies to next Gatekeeper launch)
            </Text>
          </View>
          <Switch
            value={mockTimerEnabled}
            onValueChange={setMockTimerEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={mockTimerEnabled ? colors.accent : colors.surfacePrimary}
          />
        </View>

        {mockTimerEnabled && (
          <View style={[styles.infoBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#F59E0B"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.infoText, { color: '#92400E' }]}>
              Timer mock enabled - Gatekeeper will use 1s instead of 60s
            </Text>
          </View>
        )}

        {/* Trigger Buttons */}
        <SectionTitle title="🚀 Trigger UI Components" />

        <View style={styles.buttonGroup}>
          <DebugButton
            title="Launch Vagus Gate"
            onPress={handleLaunchGate}
            variant="danger"
          />
          <DebugButton
            title="Launch Store"
            onPress={handleLaunchStore}
            variant="success"
          />
        </View>

        {/* Feature Status */}
        <SectionTitle title="✅ Feature Status" />

        <View style={[styles.statusBox, { backgroundColor: colors.surfacePrimary }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Current Balance</Text>
            <Text style={[styles.statusValue, { color: colors.accent }]}>
              {simulatingBalance !== null ? simulatingBalance : balance}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Bankruptcy Threshold</Text>
            <Text style={[styles.statusValue, { color: '#EF4444' }]}>15 points</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Bankruptcy Active?</Text>
            <Text
              style={[
                styles.statusValue,
                { color: balance < 15 ? '#EF4444' : '#10B981' },
              ]}
            >
              {balance < 15 ? 'YES ⚠️' : 'NO ✓'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Recent Transactions</Text>
            <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
              {lastTransactions.length} total
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            💡 Dev Mode Tip: Use state injectors to test all scenarios without waiting for timers.
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ⚠️ Changes here only affect this session and may not persist to Firestore.
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {showGate && (
        <VagusGatekeeper
          blockedAppPackage="com.debug.sandbox"
          blockedAppName="Dev Sandbox Test App"
          onGateComplete={handleGateComplete}
          onClose={handleGateClose}
        />
      )}

      {showStore && (
        <View style={StyleSheet.absoluteFill}>
          <Store navigation={{ goBack: () => setShowStore(false) }} />
        </View>
      )}
    </SafeAreaView>
  );
}

export default DevSandboxScreen;

// ========== STYLES ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  monitorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  monitorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  jsonDisplay: {
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  jsonText: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 16,
  },
  buttonGroup: {
    gap: 8,
    marginBottom: 12,
  },
  debugButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  statusBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  footer: {
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
