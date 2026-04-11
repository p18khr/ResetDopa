import React, { useState, useCallback } from 'react';
import { useBlockedAppListener } from '../hooks/useBlockedAppListener';
import { VagusGatekeeper } from './VagusGatekeeper';

/**
 * BlockedAppGateManager - Manages showing VagusGatekeeper when app blocked
 *
 * Listens for native blocked app events and displays the gate overlay
 * Handles app name resolution from package name
 */
export function BlockedAppGateManager(): React.ReactElement {
  const { blockedPackage, showBlockedAppGate, closeBlockedAppGate } =
    useBlockedAppListener();
  const [appName, setAppName] = useState<string>('Unknown');

  const handleGateComplete = useCallback(() => {
    closeBlockedAppGate();
  }, [closeBlockedAppGate]);

  const handleClose = useCallback(() => {
    closeBlockedAppGate();
  }, [closeBlockedAppGate]);

  // Extract a readable app name from package (e.g., "com.example.app" → "App")
  const getAppNameFromPackage = (packageName: string): string => {
    if (!packageName) return 'Unknown App';

    const parts = packageName.split('.');
    const lastPart = parts[parts.length - 1];

    // Capitalize first letter
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  if (!showBlockedAppGate || !blockedPackage) {
    return <></>;
  }

  return (
    <VagusGatekeeper
      blockedAppPackage={blockedPackage}
      blockedAppName={getAppNameFromPackage(blockedPackage)}
      onGateComplete={handleGateComplete}
      onClose={handleClose}
    />
  );
}

export default BlockedAppGateManager;
