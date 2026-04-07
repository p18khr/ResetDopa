import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform, Alert } from 'react-native';

const { AppBlocker } = NativeModules;

/**
 * useAppBlocker - React hook to manage native app blocking
 * Bridges React Native ↔ Native Kotlin module
 */
export function useAppBlocker() {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionDetails, setPermissionDetails] = useState(null);
  const [blockedApps, setBlockedAppsState] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState(null);

  // Check permissions on mount
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return; // iOS not supported
    }

    checkPermissions();
    loadBlockedApps();
  }, []);

  /**
   * Check if all required permissions are granted
   */
  const checkPermissions = async () => {
    try {
      if (!AppBlocker) {
        setError('AppBlocker module not available');
        return;
      }

      const result = await AppBlocker.checkPermissions();
      setPermissionDetails(result);
      setHasPermissions(result.allGranted);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError(err.message);
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
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'App blocking is only available on Android');
      return;
    }

    if (AppBlocker) {
      AppBlocker.requestUsageStatsPermission();
    }
  };

  /**
   * Request Overlay permission (required for blocking overlay)
   */
  const requestOverlayPermission = () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'App blocking is only available on Android');
      return;
    }

    if (AppBlocker) {
      AppBlocker.requestOverlayPermission();
    }
  };

  /**
   * Request all permissions with user guidance
   */
  const requestPermissions = () => {
    if (!permissionDetails) {
      Alert.alert('Error', 'Permission status unknown. Please try again.');
      return;
    }

    if (!permissionDetails.usageStats) {
      Alert.alert(
        '📊 Usage Stats Permission',
        'This permission allows DopaReset to detect when you open blocked apps.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestUsageStatsPermission },
        ]
      );
    } else if (!permissionDetails.overlay) {
      Alert.alert(
        '🚫 Overlay Permission',
        'This permission allows DopaReset to show a blocking screen when you open blocked apps.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestOverlayPermission },
        ]
      );
    }
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
  };
}

export default useAppBlocker;
