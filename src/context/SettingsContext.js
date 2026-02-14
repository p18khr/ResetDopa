// src/context/SettingsContext.js
import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BatchSaveManager } from '../services/firestore.service';
import { useAuth } from './AuthContext';

const SettingsContext = createContext({
  enableEnhancedFeatures: true,
  completedWeeksWithFireworks: [],
  setCompletedWeeksWithFireworks: () => {},
  markWeekFireworksFired: () => {},
});

export function SettingsProvider({ children }) {
  const { user } = useAuth();

  const [enableEnhancedFeatures] = useState(true); // Global flag to toggle enhancements
  const [completedWeeksWithFireworks, setCompletedWeeksWithFireworks] = useState([]);

  // BatchSaveManager for optimized writes
  const batchSaveManagerRef = React.useRef(null);

  // Initialize BatchSaveManager when user changes
  React.useEffect(() => {
    if (user?.uid) {
      batchSaveManagerRef.current = new BatchSaveManager(user.uid, {
        debounceMs: 50,
        retryOnFailure: true,
        retryDelayMs: 1000,
      });
    } else {
      // Cleanup on logout
      if (batchSaveManagerRef.current) {
        batchSaveManagerRef.current.destroy();
      }
      batchSaveManagerRef.current = null;
    }
  }, [user?.uid]);

  const saveSettingsData = (updates) => {
    if (batchSaveManagerRef.current) {
      batchSaveManagerRef.current.queueUpdates(updates);
    }
  };

  // Mark a week as having fired fireworks (prevents re-triggering on reopen)
  const markWeekFireworksFired = async (weekNumber) => {
    if (completedWeeksWithFireworks.includes(weekNumber)) return; // Already tracked
    const updated = [...completedWeeksWithFireworks, weekNumber];
    setCompletedWeeksWithFireworks(updated);
    saveSettingsData({ completedWeeksWithFireworks: updated });
  };

  // Set completedWeeksWithFireworks from external source (e.g., Firebase load)
  const setCompletedWeeksFromData = (data) => {
    if (Array.isArray(data)) {
      setCompletedWeeksWithFireworks(data);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        enableEnhancedFeatures,
        completedWeeksWithFireworks,
        setCompletedWeeksWithFireworks,
        markWeekFireworksFired,
        setCompletedWeeksFromData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

export default SettingsContext;
