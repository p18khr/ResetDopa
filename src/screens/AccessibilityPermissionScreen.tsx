import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AppState,
  AppStateStatus,
  NativeModules,
  TurboModuleRegistry,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AppBlocker = TurboModuleRegistry.get<any>('AppBlocker') ?? NativeModules.AppBlocker;

export default function AccessibilityPermissionScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const awaitingReturn = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active' && awaitingReturn.current) {
        awaitingReturn.current = false;
        if (!AppBlocker) return;
        const result = await AppBlocker.checkPermissions();
        if (result?.accessibility) {
          navigation.goBack();
        }
      }
    });
    return () => sub.remove();
  }, [navigation]);

  const handleEnable = () => {
    if (!AppBlocker) return;
    awaitingReturn.current = true;
    AppBlocker.requestAccessibilityPermission();
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color={colors.accent} />
          </View>
          <Text style={styles.title}>App Monitoring Permission</Text>
          <Text style={styles.subtitle}>
            Required to activate the ResetDopa app blocker. This app uses the AccessibilityService API to activate the ResetDopa app blocker.
          </Text>
        </View>

        <View style={styles.disclosureCard}>
          <Text style={styles.sectionLabel}>What ResetDopa does with this permission</Text>
          <View style={styles.bulletGroup}>
            <BulletRow icon="checkmark-circle" color="#22c55e" colors={colors}
              text="Monitors which app is in the foreground to detect when you open a blocked app" />
            <BulletRow icon="checkmark-circle" color="#22c55e" colors={colors}
              text="Shows a 60-second calm-down screen when a blocked app is launched" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>What ResetDopa does NOT do</Text>
          <View style={styles.bulletGroup}>
            <BulletRow icon="close-circle" color="#ef4444" colors={colors}
              text="Does not read screen content, text input, or keystrokes" />
            <BulletRow icon="close-circle" color="#ef4444" colors={colors}
              text="Does not collect or store any personal data" />
            <BulletRow icon="close-circle" color="#ef4444" colors={colors}
              text="Does not share any information with third parties" />
          </View>
        </View>

        <Text style={styles.footerNote}>
          This service only runs while you have apps blocked. Disable it at any time via Android Settings → Accessibility.
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleEnable}>
          <Text style={styles.primaryButtonText}>Enable in Accessibility Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BulletRow({
  icon,
  color,
  colors,
  text,
}: {
  icon: string;
  color: string;
  colors: any;
  text: string;
}) {
  return (
    <View style={bulletStyles.row}>
      <Ionicons name={icon as any} size={20} color={color} style={bulletStyles.icon} />
      <Text style={[bulletStyles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const bulletStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginRight: 10, marginTop: 1 },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
});

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 16, paddingTop: 8 },
    backButton: { padding: 8, alignSelf: 'flex-start' },
    heroSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    disclosureCard: {
      marginHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfacePrimary,
      padding: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 12,
    },
    bulletGroup: { gap: 10, marginBottom: 16 },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
    footerNote: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
      marginTop: 16,
      lineHeight: 18,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 8 },
    actions: { padding: 24, gap: 12 },
    primaryButton: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: colors.accent,
    },
    primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    secondaryButton: { paddingVertical: 12, alignItems: 'center' },
    secondaryButtonText: { fontSize: 15 },
  });
