import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useBlockedAppGate } from '../hooks/useBlockedAppGate';
import { useAppBlocker } from '../hooks/useAppBlocker';

/**
 * BlockedAppsManager - Manage content blocking with native Android blocker
 * Uses useAppBlocker for native integration
 */
export default function BlockedAppsManager({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { userProfile, setUserProfile } = useContext(AppContext);
  const { navigateWithGate, GateModal } = useBlockedAppGate();
  const { isAdminActive, checkAdminStatus, updateBlockedApps, requestAdminPermissions } = useAppBlocker();

  const [isSettingUp, setIsSettingUp] = useState(false);

  // Available apps to block
  const AVAILABLE_APPS = [
    { id: 'com.instagram.android', name: '📱 Instagram', category: 'Social Media' },
    { id: 'com.zhiliaoapp.musically', name: '🎬 TikTok', category: 'Social Media' },
    { id: 'com.twitter.android', name: '𝕏 Twitter', category: 'Social Media' },
    { id: 'com.google.android.youtube', name: '▶️ YouTube', category: 'Video' },
    { id: 'tv.twitch.android.app', name: '🎮 Twitch', category: 'Streaming' },
    { id: 'com.reddit.frontpage', name: '👽 Reddit', category: 'Social Media' },
  ];

  const blockedApps = userProfile?.blockedApps || [];

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  /**
   * Toggle block app
   * Also syncs with native module if on Android
   */
  const toggleBlockApp = async (appId) => {
    try {
      setIsSettingUp(true);

      const isBlocked = blockedApps.includes(appId);
      const newBlockedApps = isBlocked
        ? blockedApps.filter((id) => id !== appId)
        : [...blockedApps, appId];

      // Update React Native state
      await setUserProfile({
        ...userProfile,
        blockedApps: newBlockedApps,
      });

      // Android: Sync with native module
      if (Platform.OS === 'android') {
        if (!isAdminActive && newBlockedApps.length > 0) {
          // Request admin if not already granted
          Alert.alert(
            '🔐 Admin Permission Required',
            'ResetDopa needs admin permission to block apps. This is secure and used only to prevent app launches.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Grant Permission',
                onPress: requestAdminPermissions,
              },
            ]
          );
        } else {
          // Sync to native
          await updateBlockedApps(newBlockedApps);
          Alert.alert('Success', `${isBlocked ? 'Unblocked' : 'Blocked'} ${appId}`);
        }
      }

      setIsSettingUp(false);
    } catch (err) {
      console.error('Error toggling block app:', err);
      setIsSettingUp(false);
      Alert.alert('Error', 'Failed to update blocked apps');
    }
  };

  /**
   * Handle opening app (shows gate if blocked)
   */
  const handleOpenApp = (appId) => {
    navigateWithGate(appId, () => {
      Alert.alert(
        'App Access',
        `Successfully unlocked ${appId}. In production, this would deep-link to the app.`
      );
    });
  };

  // iOS notice
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Content Blockers</Text>
        </View>
        <View style={[styles.iosNotice, { backgroundColor: colors.surfacePrimary, borderColor: colors.accent }]}>
          <Text style={[styles.iosNoticeText, { color: colors.text }]}>
            📱 App blocking is not available on iOS
          </Text>
          <Text style={[styles.iosSubtext, { color: colors.textSecondary }]}>
            Apple's sandbox restricts this. Instead, use Apple's built-in "Screen Time" → "App Limits" to restrict access to apps.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = getStyles(isDarkMode, colors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GateModal />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Blockers</Text>
        <Text style={styles.headerSubtitle}>
          {isAdminActive
            ? '✅ Admin enabled - apps are protected'
            : '⚠️ Grant admin permission to enable full blocking'}
        </Text>
      </View>

      {/* Admin Status Alert */}
      {!isAdminActive && Platform.OS === 'android' && (
        <TouchableOpacity
          style={[styles.adminAlert, { backgroundColor: colors.surfacePrimary, borderColor: colors.accent }]}
          onPress={requestAdminPermissions}
        >
          <Text style={[styles.adminAlertText, { color: colors.accent }]}>
            🔐 Tap to grant admin permission
          </Text>
        </TouchableOpacity>
      )}

      {/* Blocked Apps List */}
      <FlatList
        data={AVAILABLE_APPS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isBlocked = blockedApps.includes(item.id);

          return (
            <View style={styles.appCard}>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{item.name}</Text>
                <Text style={styles.appCategory}>{item.category}</Text>
              </View>

              {isBlocked ? (
                <TouchableOpacity
                  style={styles.accessButton}
                  onPress={() => handleOpenApp(item.id)}
                  disabled={isSettingUp}
                >
                  <Text style={styles.accessButtonText}>🔓 Access</Text>
                </TouchableOpacity>
              ) : null}

              <Switch
                value={isBlocked}
                onValueChange={() => toggleBlockApp(item.id)}
                disabled={isSettingUp}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={isBlocked ? colors.accent : colors.textSecondary}
              />
            </View>
          );
        }}
      />

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🧠 <Text style={styles.infoBold}>How it works:</Text> Enable any app above. When you try to open it, VagusGatekeeper gates it with 60s of breathing. Choose [Stay Calm] to skip the app completely.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode, colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    adminAlert: {
      marginHorizontal: 24,
      marginVertical: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
    },
    adminAlertText: {
      fontSize: 14,
      fontWeight: '600',
    },
    listContainer: {
      padding: 24,
      gap: 12,
    },
    appCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    appInfo: {
      flex: 1,
    },
    appName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    appCategory: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    accessButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    accessButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
    },
    infoBox: {
      marginHorizontal: 24,
      marginBottom: 24,
      backgroundColor: isDarkMode
        ? 'rgba(59, 130, 246, 0.1)'
        : 'rgba(59, 130, 246, 0.05)',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    infoBold: {
      fontWeight: '700',
      color: colors.text,
    },
    iosNotice: {
      marginHorizontal: 24,
      marginTop: 24,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap:8 ,
    },
    iosNoticeText: {
      fontSize: 16,
      fontWeight: '600',
    },
    iosSubtext: {
      fontSize: 14,
      lineHeight: 20,
    },
  });
