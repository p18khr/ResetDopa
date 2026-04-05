import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import VagusGatekeeper from '../screens/VagusGatekeeper';

/**
 * BlockedAppGate: Intercepts navigation to blocked apps/content
 * Shows VagusGatekeeper modal before allowing access
 */
export function useBlockedAppGate() {
  const { userProfile } = useContext(AppContext);
  const [showGate, setShowGate] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // List of blocked apps/routes
  // Example: user can block YouTube, TikTok, Twitter, etc.
  const blockedApps = userProfile?.blockedApps || [];

  /**
   * Call this before navigating to a potentially blocked app
   * If app is blocked, shows VagusGatekeeper
   * If not blocked, navigates immediately
   */
  const navigateWithGate = (appName, navigationFn) => {
    if (blockedApps.includes(appName)) {
      // App is blocked, show gate
      setPendingNavigation(() => navigationFn);
      setShowGate(true);
    } else {
      // App not blocked, navigate immediately
      navigationFn();
    }
  };

  /**
   * Called when user closes/cancels the gate (e.g., "Stay Calm" button)
   */
  const handleGateCancel = () => {
    setShowGate(false);
    setPendingNavigation(null);
  };

  /**
   * Called when user completes the gate (e.g., "Still Proceed" button)
   */
  const handleGateComplete = () => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowGate(false);
    setPendingNavigation(null);
  };

  /**
   * Render the gate modal (place this in your App root)
   */
  const GateModal = () => (
    <VagusGatekeeper
      isVisible={showGate}
      onComplete={handleGateComplete}
      onCancel={handleGateCancel}
    />
  );

  return {
    navigateWithGate,
    showGate,
    GateModal,
    blockedApps,
  };
}

export default useBlockedAppGate;
