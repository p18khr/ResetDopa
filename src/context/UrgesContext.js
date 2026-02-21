// src/context/UrgesContext.js
import React, { createContext, useState, useContext } from 'react';
import uuid from 'react-native-uuid';
import { BatchSaveManager } from '../services/firestore.service';
import { useAuth } from './AuthContext';

const UrgesContext = createContext({
  urges: [],
  addUrge: () => {},
});

export function UrgesProvider({ children }) {
  const { user } = useAuth();
  const [urges, setUrges] = useState([]);

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

  const saveUrgeData = (updates) => {
    if (batchSaveManagerRef.current) {
      batchSaveManagerRef.current.queueUpdates(updates);
    }
  };

  // Add a new urge entry
  const addUrge = (intensity, triggerText = '', momentNotes = '', emotion = null, metadata = {}) => {
    const newUrge = {
      id: uuid.v4(),
      timestamp: Date.now(), // Use milliseconds timestamp to match existing data
      intensity: typeof intensity === 'number' ? intensity : 5,
      trigger: triggerText || null,
      note: momentNotes || '',
      emotion: emotion || null,
      outcome: null, // Will be set later via updateUrgeOutcome
      // Rich metadata for AI analytics (schema-driven, backward compatible)
      ...metadata,
    };

    const updated = [...urges, newUrge];
    setUrges(updated);
    saveUrgeData({ urges: updated });
    return newUrge;
  };

  // Update urge outcome
  const updateUrgeOutcome = (id, outcome) => {
    const updated = urges.map(u => u.id === id ? { ...u, outcome } : u);
    setUrges(updated);
    saveUrgeData({ urges: updated });
  };

  // Set urges from external source (e.g., Firebase load)
  const setUrgesFromData = (urgesData) => {
    if (Array.isArray(urgesData)) {
      setUrges(urgesData);
    }
  };

  // Get urge count
  const getUrgeCount = () => urges.length;

  // Get recent urges (last N days)
  const getRecentUrges = (days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return urges.filter(u => new Date(u.timestamp) >= cutoff);
  };

  // Get urges for a specific date (YYYY-MM-DD)
  const getUrgesForDate = (dateKey) => {
    return urges.filter(u => {
      if (!u.timestamp) return false;
      const urgeDate = new Date(u.timestamp).toISOString().slice(0, 10);
      return urgeDate === dateKey;
    });
  };

  return (
    <UrgesContext.Provider
      value={{
        urges,
        addUrge,
        updateUrgeOutcome,
        setUrgesFromData,
        getUrgeCount,
        getRecentUrges,
        getUrgesForDate,
        setUrges,
      }}
    >
      {children}
    </UrgesContext.Provider>
  );
}

export function useUrges() {
  const context = useContext(UrgesContext);
  if (!context) {
    throw new Error('useUrges must be used within UrgesProvider');
  }
  return context;
}

export default UrgesContext;
