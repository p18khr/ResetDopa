import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { VagusGatekeeper } from '../components/VagusGatekeeper';
import Store from '../screens/Store';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DevSandboxScreenProps {
  navigation: any;
}

export function DevSandboxScreen({ navigation }: DevSandboxScreenProps): React.ReactElement {
  const { colors } = useTheme();
  const {
    balance,
    currentStreak,
    lastTransactions,
    ownedItems,
    addTransaction,
    debugAddPurchase,
    debugClearPurchases,
  } = useEconomy();
  const { user } = useAuth() as any;
  const { isPremium, debugSetPremium } = useSubscription();

  const [showGate, setShowGate] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [mockTimerEnabled, setMockTimerEnabled] = useState(false);

  // ===== BALANCE INJECTORS =====

  const setBalance = useCallback(
    async (targetBalance: number) => {
      try {
        const diff = targetBalance - balance;
        if (diff === 0) {
          Alert.alert('Balance', `Already at ${balance} points`);
          return;
        }
        const result = await addTransaction(
          'admin_adjustment',
          { reason: `[DEV] Set balance to ${targetBalance}`, previousBalance: balance, targetBalance },
          diff
        );
        if (!result.success) Alert.alert('Error', 'Failed to update balance');
      } catch (error) {
        Alert.alert('Error', `${error}`);
      }
    },
    [balance, addTransaction]
  );

  // ===== SIMULATE OWNERSHIP (in-memory, no Firestore) =====

  const handleSimulatePurchase = useCallback(
    (itemId: string, permanent: boolean) => {
      debugAddPurchase(itemId, permanent);
      Alert.alert('Simulated', `${itemId} marked as owned (session only)`);
    },
    [debugAddPurchase]
  );

  const handleClearPurchases = useCallback(() => {
    debugClearPurchases();
    Alert.alert('Cleared', 'All simulated purchases removed');
  }, [debugClearPurchases]);

  // ===== DEMO AUDIT =====

  const createDemoAudit = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Not logged in');
      return;
    }
    try {
      const weekEnding = new Date();
      await addDoc(collection(db, 'users', user.uid, 'weekly_audits'), {
        timestamp: Timestamp.now(),
        week_ending: weekEnding,
        urge_count: 14,
        failures_this_week: 3,
        had_protocol_purchase: true,
        audit: `## The Pattern
Your urges spike between 10 PM and midnight — 9 of 14 events hit in that window. Instagram and YouTube are your primary triggers, both tied to post-work decompression rituals. When you fail, it's always within 8 minutes of opening the phone "just to check the time."

## The Weakest Link
You don't have a dopamine problem. You have a transition problem. The moment work ends, your brain has no ritual — so it defaults to the path of least resistance. Every failure started with boredom, not craving.

## Next Week's Protocol
If it's after 9 PM and you reach for your phone, then you must first do 10 slow push-ups before unlocking it. No exceptions. The physical interruption breaks the automatic loop before it starts.`,
      });
      Alert.alert('Demo Audit Created', 'Check the Neuro-Audit screen in the Store.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [user?.uid]);

  // ===== GATE HANDLERS =====

  const handleGateComplete = useCallback(() => {
    setShowGate(false);
    Alert.alert('Gate Complete', 'User proceeded through gate');
  }, []);

  // ===== SNAPSHOT =====

  const contextSnapshot = useMemo(
    () => ({
      balance,
      currentStreak,
      ownedItems: ownedItems.map((p) => p.itemId),
      recentTxns: lastTransactions.slice(0, 3).map((t: any) => t.type || t.id),
    }),
    [balance, currentStreak, ownedItems, lastTransactions]
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
    const bgColor =
      variant === 'success' ? '#10B981' : variant === 'danger' ? '#EF4444' : colors.accent;
    return (
      <TouchableOpacity style={[styles.debugButton, { backgroundColor: bgColor }]} onPress={onPress}>
        <Text style={styles.debugButtonText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );

  if (!__DEV__) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 16 }}>DevSandbox only available in __DEV__ mode</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bug" size={24} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.title, { color: colors.text }]}>Developer Sandbox</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Live Context Monitor */}
        <View style={[styles.monitorCard, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={[styles.monitorTitle, { color: colors.accent }]}>📊 Context Live Monitor</Text>
          <View style={[styles.jsonDisplay, { backgroundColor: `${colors.text}08` }]}>
            <Text style={[styles.jsonText, { color: colors.textSecondary, fontFamily: 'monospace' }]}>
              {JSON.stringify(contextSnapshot, null, 2)}
            </Text>
          </View>
        </View>

        {/* Balance Injectors */}
        <SectionTitle title="🎮 Balance Injectors" />
        <View style={styles.buttonGroup}>
          <DebugButton title="Balance = 0" onPress={() => setBalance(0)} />
          <DebugButton title="Balance = 10 (Nuclear, <15)" onPress={() => setBalance(10)} />
          <DebugButton title="Balance = 14 (Bankruptcy edge)" onPress={() => setBalance(14)} />
          <DebugButton title="Balance = 40 (Bypass test)" onPress={() => setBalance(40)} />
          <DebugButton title="Balance = 1000 (Whale)" onPress={() => setBalance(1000)} />
        </View>

        {/* Simulate Store Ownership */}
        <SectionTitle title="🛍️ Simulate Store Purchases (session only)" />
        <View style={styles.buttonGroup}>
          <DebugButton
            title="Own: Vantablack Theme"
            onPress={() => handleSimulatePurchase('vantablack_theme', true)}
            variant="success"
          />
          <DebugButton
            title="Own: Streak Repair"
            onPress={() => handleSimulatePurchase('streak_repair', false)}
            variant="success"
          />
          <DebugButton
            title="Clear All Simulated Purchases"
            onPress={handleClearPurchases}
            variant="danger"
          />
        </View>

        {/* Timer Override */}
        <SectionTitle title="⏱️ Timer Override" />
        <View style={[styles.toggleRow, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Mock 60s → 1s Timer</Text>
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

        {/* Premium Override */}
        <SectionTitle title="💎 Subscription Override" />
        <View style={[styles.toggleRow, { backgroundColor: colors.surfacePrimary, borderColor: isPremium ? '#FFD700' : colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Force isPremium = true</Text>
            <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
              Overrides RC — unlocks all gated screens
            </Text>
          </View>
          <Switch
            value={isPremium}
            onValueChange={(val) => debugSetPremium?.(val ? true : null)}
            trackColor={{ false: colors.border, true: '#FFD700' }}
            thumbColor={isPremium ? '#FFD700' : colors.surfacePrimary}
          />
        </View>

        {/* Neuro-Audit */}
        <SectionTitle title="🧠 Neuro-Audit Testing" />
        <View style={styles.buttonGroup}>
          <DebugButton title="Create Demo Audit (writes to Firestore)" onPress={createDemoAudit} variant="success" />
        </View>

        {/* Trigger Buttons */}
        <SectionTitle title="🚀 Trigger UI Components" />
        <View style={styles.buttonGroup}>
          <DebugButton title="Launch Vagus Gate" onPress={() => setShowGate(true)} variant="danger" />
          <DebugButton title="Launch Store" onPress={() => setShowStore(true)} variant="success" />
        </View>

        {/* Feature Status */}
        <SectionTitle title="✅ Feature Status" />
        <View style={[styles.statusBox, { backgroundColor: colors.surfacePrimary }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Current Balance</Text>
            <Text style={[styles.statusValue, { color: colors.accent }]}>{balance}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Bankruptcy Active?</Text>
            <Text style={[styles.statusValue, { color: balance < 15 ? '#EF4444' : '#10B981' }]}>
              {balance < 15 ? 'YES ⚠️' : 'NO ✓'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Owned Items</Text>
            <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
              {ownedItems.length} item(s)
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

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ⚠️ Simulate purchases are in-memory only — they reset on app restart.
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            💡 Balance changes write to Firestore and persist.
          </Text>
        </View>
      </ScrollView>

      {showGate && (
        <VagusGatekeeper
          blockedAppPackage="com.debug.sandbox"
          blockedAppName="Dev Sandbox Test App"
          onGateComplete={handleGateComplete}
          onClose={() => setShowGate(false)}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', flex: 1 },
  monitorCard: { borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FF6B6B' },
  monitorTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  jsonDisplay: { borderRadius: 8, padding: 12, maxHeight: 200 },
  jsonText: { fontSize: 11, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 16 },
  buttonGroup: { gap: 8, marginBottom: 12 },
  debugButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  debugButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12, marginTop: 4 },
  statusBox: { borderRadius: 8, padding: 16, marginBottom: 24 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statusLabel: { fontSize: 13, fontWeight: '500' },
  statusValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  footer: { marginTop: 16 },
  footerText: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
});
