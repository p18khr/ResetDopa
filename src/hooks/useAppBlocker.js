import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform, Alert } from 'react-native';

const { AppBlocker } = NativeModules;

/**
 * useAppBlocker - React hook to manage native app blocking
 * Bridges React Native ↔ Native Kotlin module
 */
export function useAppBlocker() {
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [blockedApps, setBlockedAppsState] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState(null);

  // Check if admin is active on mount
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return; // iOS not supported
    }

    checkAdminStatus();
  }, []);

  /**
   * Check if device admin is active
   */
  const checkAdminStatus = async () => {
    try {
      if (!AppBlocker) {
        setError('AppBlocker module not available');
        return;
      }

      const result = await AppBlocker.isAdminActive();
      setIsAdminActive(result.isAdmin);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err.message);
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
   */
  const startMonitoring = async () => {
    try {
      if (!AppBlocker || !isAdminActive) {
        return;
      }

      // In a real app, you'd set up an event listener here
      // For now, the native service handles it automatically
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
   * Request admin permissions
   */
  const requestAdminPermissions = () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'App blocking is only available on Android');
      return;
    }

    if (AppBlocker && AppBlocker.requestAdminPermission) {
      AppBlocker.requestAdminPermission();
    }
  };

  return {
    isAdminActive,
    checkAdminStatus,
    blockedApps,
    updateBlockedApps,
    getBlockedApps,
    startMonitoring,
    stopMonitoring,
    requestAdminPermissions,
    isMonitoring,
    error,
  };
}

export default useAppBlocker;
