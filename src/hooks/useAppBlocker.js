import { useEffect, useRef, useState } from 'react';
import { AppState, NativeModules, TurboModuleRegistry, NativeEventEmitter, Platform, Alert } from 'react-native';

// New arch (newArchEnabled=true) may not expose modules via NativeModules — try TurboModuleRegistry first
const AppBlocker = TurboModuleRegistry.get('AppBlocker') ?? NativeModules.AppBlocker;

/**
 * useAppBlocker - React hook to manage native app blocking
 * Bridges React Native ↔ Native Kotlin module
 *
 * Now includes:
 * - Balance/Streak syncing to native side
 * - Transaction event handling (resist +2, open -15 and -1 streak)
 */
export function useAppBlocker() {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionDetails, setPermissionDetails] = useState(null);
  const [blockedApps, setBlockedAppsState] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState(null);

  const awaitingPermission = useRef(false);

  // Check permissions on mount
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    checkPermissions();
    loadBlockedApps();
  }, []);

  // Re-check permissions when app returns to foreground after visiting Settings
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && awaitingPermission.current) {
        awaitingPermission.current = false;
        const freshDetails = await checkPermissions();
        // Auto-advance to next missing permission without requiring another tap
        if (freshDetails && !freshDetails.allGranted) {
          requestNextPermission(freshDetails);
        }
      }
    });

    return () => sub.remove();
  }, []);

  /**
   * Check if all required permissions are granted
   */
  const checkPermissions = async () => {
    try {
      if (!AppBlocker) {
        console.warn('AppBlocker module not available - running on non-Android device?');
        setError('AppBlocker module not available');
        const fallback = { usageStats: false, overlay: false, allGranted: false };
        setPermissionDetails(fallback);
        return fallback;
      }

      const result = await AppBlocker.checkPermissions();

      if (!result || typeof result !== 'object') {
        console.error('Invalid response from AppBlocker.checkPermissions():', result);
        setError('Invalid permission check response');
        return null;
      }

      setPermissionDetails(result);
      setHasPermissions(result.allGranted === true);
      return result;
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError(err.message || 'Failed to check permissions');
      const fallback = { usageStats: false, overlay: false, allGranted: false };
      setPermissionDetails(fallback);
      return fallback;
    }
  };

  // Shows the next missing permission dialog given a fresh details object.
  // Used both by requestPermissions() and the AppState auto-advance flow.
  const requestNextPermission = (details) => {
    if (!details) return;
    if (!details.usageStats) {
      Alert.alert(
        '📊 Usage Stats Permission',
        'This permission allows DopaReset to detect when you open blocked apps.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestUsageStatsPermission },
        ]
      );
    } else if (!details.overlay) {
      Alert.alert(
        '🚫 Overlay Permission',
        'This permission allows DopaReset to show a blocking screen when you open blocked apps.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestOverlayPermission },
        ]
      );
    } else if (!details.accessibility) {
      requestAccessibilityPermission();
    }
  };

  /**
   * Load blocked apps from native storage
   */
  const loadBlockedApps = async () => {
    try {
      if (!AppBlocker) {
        return;
      }

      const result = await AppBlocker.getBlockedApps();
      if (result.success && result.apps) {
        setBlockedAppsState(result.apps);
        setIsMonitoring(result.apps.length > 0);
      }
    } catch (err) {
      console.error('Error loading blocked apps:', err);
    }
  };

  /**
   * Sync current balance and streak to native side
   * Should be called whenever balance/streak changes
   */
  const syncBalanceToNative = async (balance, hasStreak, isVeteran = false) => {
    try {
      if (!AppBlocker) {
        console.warn('AppBlocker module not available');
        return;
      }

      const safeBalance = Math.floor(Number(balance) || 0);
      const safeStreak = Boolean(hasStreak);
      const safeVeteran = Boolean(isVeteran);
      console.log('[AppBlocker] Syncing balance to native:', { safeBalance, safeStreak, safeVeteran });
      const result = await AppBlocker.syncBalanceAndStreak(safeBalance, safeStreak, safeVeteran);
      if (result.success) {
        console.log('[AppBlocker] ✓ Balance synced to native');
      }
    } catch (err) {
      console.error('[AppBlocker] Error syncing balance:', err);
    }
  };

  /**
   * Get current balance and streak from native storage
   */
  const getBalanceFromNative = async () => {
    try {
      if (!AppBlocker) {
        return { balance: 0, hasStreak: true };
      }

      const result = await AppBlocker.getBalanceAndStreak();
      if (result.success) {
        console.log('[AppBlocker] Retrieved:', result);
        return { balance: result.balance, hasStreak: result.hasStreak };
      }
      return { balance: 0, hasStreak: true };
    } catch (err) {
      console.error('[AppBlocker] Error getting balance:', err);
      return { balance: 0, hasStreak: true };
    }
  };

  /**
   * Check pending app blocker flags (resist/open)
   */
  const checkAppBlockerFlags = async () => {
    try {
      if (!AppBlocker) {
        return { resistPending: false, openPending: false, openPackage: '' };
      }

      const result = await AppBlocker.checkAppBlockerFlags();
      console.log('[AppBlocker] Flags:', result);
      return result;
    } catch (err) {
      console.error('[AppBlocker] Error checking flags:', err);
      return { resistPending: false, openPending: false, openPackage: '' };
    }
  };

  /**
   * Clear app blocker flags after processing transactions
   */
  const clearAppBlockerFlags = async () => {
    try {
      if (!AppBlocker) {
        return false;
      }

      const result = await AppBlocker.clearAppBlockerFlags();
      if (result.success) {
        console.log('[AppBlocker] ✓ Flags cleared');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AppBlocker] Error clearing flags:', err);
      return false;
    }
  };

  /**
   * Set blocked apps - calls native module to sync
   * This is the main function to call when user toggles apps
   */
  const updateBlockedApps = async (apps) => {
    try {
      if (!AppBlocker) {
        setError('AppBlocker module not available');
        return false;
      }

      const result = await AppBlocker.setBlockedApps(apps);

      if (result.success) {
        setBlockedAppsState(result.apps);
        setError(null);

        // Start monitoring if apps are blocked
        if (apps.length > 0 && !isMonitoring) {
          startMonitoring();
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error updating blocked apps:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Get current blocked apps
   */
  const getBlockedApps = async () => {
    try {
      if (!AppBlocker) {
        setError('AppBlocker module not available');
        return [];
      }

      const result = await AppBlocker.getBlockedApps();
      if (result.success) {
        setBlockedAppsState(result.apps);
        return result.apps;
      }

      return [];
    } catch (err) {
      console.error('Error getting blocked apps:', err);
      setError(err.message);
      return [];
    }
  };

  /**
   * Start monitoring for blocked app launches
   * (Native service starts automatically when blockedApps > 0)
   */
  const startMonitoring = async () => {
    try {
      if (!AppBlocker || !hasPermissions) {
        return;
      }

      // Native service starts automatically in setBlockedApps
      setIsMonitoring(true);
    } catch (err) {
      console.error('Error starting monitoring:', err);
    }
  };

  /**
   * Stop monitoring
   */
  const stopMonitoring = async () => {
    try {
      if (!AppBlocker) {
        return;
      }

      await AppBlocker.stopMonitoring();
      setIsMonitoring(false);
      setBlockedAppsState([]);
    } catch (err) {
      console.error('Error stopping monitoring:', err);
      setError(err.message);
    }
  };

  /**
   * Request Usage Stats permission (required for app detection)
   */
  const requestUsageStatsPermission = () => {
    console.log('[AppBlocker] requestUsageStatsPermission called, Platform:', Platform.OS);
    if (Platform.OS !== 'android') {
      console.warn('[AppBlocker] Platform is not Android, showing unsupported alert');
      Alert.alert('Not Supported', 'App blocking is only available on Android');
      return;
    }

    if (AppBlocker) {
      console.log('[AppBlocker] Calling native AppBlocker.requestUsageStatsPermission()');
      awaitingPermission.current = true;
      AppBlocker.requestUsageStatsPermission();
    } else {
      console.error('[AppBlocker] AppBlocker module is null!');
    }
  };

  /**
   * Request Overlay permission (required for blocking overlay)
   */
  const requestOverlayPermission = () => {
    console.log('[AppBlocker] requestOverlayPermission called, Platform:', Platform.OS);
    if (Platform.OS !== 'android') {
      console.warn('[AppBlocker] Platform is not Android, showing unsupported alert');
      Alert.alert('Not Supported', 'App blocking is only available on Android');
      return;
    }

    if (AppBlocker) {
      console.log('[AppBlocker] Calling native AppBlocker.requestOverlayPermission()');
      awaitingPermission.current = true;
      AppBlocker.requestOverlayPermission();
    } else {
      console.error('[AppBlocker] AppBlocker module is null!');
    }
  };

  /**
   * Request Accessibility Service permission with mandatory prominent disclosure.
   * Google Play policy requires this explanation before sending the user to Settings.
   */
  const requestAccessibilityPermission = () => {
    if (Platform.OS !== 'android') return;
    Alert.alert(
      'Accessibility Permission Required',
      'DopaReset uses the Accessibility Service to detect when you open a blocked app and immediately show a 60-second calm-down screen.\n\n' +
      'This service only reads which app is in the foreground. It does not read any screen content, collect personal data, or share any information with third parties.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable in Settings',
          onPress: () => {
            if (AppBlocker) {
              awaitingPermission.current = true;
              AppBlocker.requestAccessibilityPermission();
            }
          },
        },
      ]
    );
  };

  /**
   * Request all permissions with user guidance
   */
  const requestPermissions = async () => {
    let details = permissionDetails;
    if (!details) {
      details = await checkPermissions();
    }
    requestNextPermission(details);
  };

  return {
    hasPermissions,
    permissionDetails,
    checkPermissions,
    blockedApps,
    updateBlockedApps,
    getBlockedApps,
    startMonitoring,
    stopMonitoring,
    requestUsageStatsPermission,
    requestOverlayPermission,
    requestPermissions,
    isMonitoring,
    error,
    // Balance and transaction methods
    syncBalanceToNative,
    getBalanceFromNative,
    checkAppBlockerFlags,
    clearAppBlockerFlags,
  };
}

export default useAppBlocker;
