import { useEffect, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AppBlocker } = NativeModules;

/**
 * useBlockedAppListener - Hook to listen for native app blocking events
 *
 * Listens for 'BlockedAppDetected' events from native AppBlockerModule
 * when a user attempts to open a blocked app. This is different from useBlockedAppGate
 * which handles in-app route gating.
 */
export function useBlockedAppListener(onBlockedAppDetected?: (packageName: string) => void) {
  const [blockedPackage, setBlockedPackage] = useState<string | null>(null);
  const [showBlockedAppGate, setShowBlockedAppGate] = useState(false);

  /**
   * Set up event listener for native blocked app detection
   */
  useEffect(() => {
    if (Platform.OS !== 'android' || !AppBlocker) {
      console.log('[useBlockedAppListener] Skipping: Android only or AppBlocker not available');
      return;
    }

    try {
      // Create event emitter from the AppBlocker native module
      const eventEmitter = new NativeEventEmitter(AppBlocker);

      // Listen for 'BlockedAppDetected' events fired from native code
      const subscription = eventEmitter.addListener(
        'BlockedAppDetected',
        (event: { blockedPackage: string }) => {
          console.log('[useBlockedAppListener] Blocked app detected:', event.blockedPackage);

          if (event && event.blockedPackage) {
            setBlockedPackage(event.blockedPackage);
            setShowBlockedAppGate(true);

            // Call callback if provided
            if (onBlockedAppDetected) {
              onBlockedAppDetected(event.blockedPackage);
            }
          }
        }
      );

      // Clean up on unmount
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('[useBlockedAppListener] Error setting up event listener:', error);
    }
  }, [onBlockedAppDetected]);

  /**
   * Close the blocked app gate (called when user returns to app or completes gate)
   */
  const closeBlockedAppGate = useCallback(() => {
    setShowBlockedAppGate(false);
    setBlockedPackage(null);
  }, []);

  return {
    blockedPackage,
    showBlockedAppGate,
    closeBlockedAppGate,
  };
}

export default useBlockedAppListener;
