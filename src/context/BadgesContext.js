// src/context/BadgesContext.js
import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';
import { BatchSaveManager } from '../services/firestore.service';
import { scheduleBadgeUnlockNotification } from '../utils/notifications';
import { useAuth } from './AuthContext';

const BadgesContext = createContext({
  badges: [],
  calmPoints: 0,
  badgeToast: null,
  claimBadge: () => {},
  checkAndClaimBadges: () => {},
  setCalmPoints: () => {},
  clearBadgeToast: () => {},
});

export function BadgesProvider({ children }) {
  const { user } = useAuth();

  const [badges, setBadges] = useState([
    { id: 'b1', title: 'Awareness Rising', got: true },
    { id: 'b2', title: 'Deep Worker', got: false },
  ]);
  const [calmPoints, setCalmPoints] = useState(0);
  const [badgeToast, setBadgeToast] = useState(null);

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

  const saveBadgeData = (updates) => {
    if (batchSaveManagerRef.current) {
      batchSaveManagerRef.current.queueUpdates(updates);
    }
  };

  // Badge messages mapping
  const badgeMessages = {
    'first_day': 'Welcome to ResetDopa™! 🌱 Every step counts. Keep going!',
    'streak_3': '🔥 3-Day Streak! You\'re building momentum!',
    'streak_7': '⭐ 7-Day Streak! One full week down!',
    'streak_30': '🏆 30-Day Streak! You\'re a champion!',
    'streak_90': '👑 90-Day Streak! You\'re a legend!',
    'tasks_10': '✅ 10 Tasks Done! You\'re on fire!',
    'tasks_50': '💪 50 Tasks Completed! Keep crushing it!',
    'tasks_100': '🚀 100 Tasks! You\'re unstoppable!',
    'calm_100': '🌟 100 Calm Points! Peace is power!',
    'calm_500': '💎 500 Calm Points! You\'re in the zone!',
    'calm_1000': '🎯 1000 Calm Points! Peak serenity achieved!',
    'urge_resist_10': '🛡️ 10 Urges Resisted! You\'re strong!',
    'urge_resist_50': '⚔️ 50 Urges Resisted! You\'re a warrior!',
    'profile_complete': '👤 Profile Complete! You\'ve claimed your identity!',
    'identity_set': '👤 Profile Complete! You\'ve claimed your identity!',
  };

  const claimBadge = (badgeId) => {
    let newBadges;
    const idx = badges.findIndex(b => b.id === badgeId);
    let unlockedTitle = null;
    let unlockedMessage = null;

    if (idx >= 0) {
      const wasLocked = !badges[idx].got;
      const updated = badges.map(b => b.id === badgeId ? { ...b, got: true } : b);
      newBadges = updated;
      if (wasLocked) {
        unlockedTitle = updated[idx]?.title || null;
        unlockedMessage = badgeMessages[badgeId] || null;
      }
    } else {
      // If badge not present, append with inferred title
      const title = badgeId === 'identity_set' ? 'Identity Set' : 'Badge';
      newBadges = [...badges, { id: badgeId, title, got: true }];
      unlockedTitle = title;
      unlockedMessage = badgeMessages[badgeId] || null;
    }

    setBadges(newBadges);
    saveBadgeData({ badges: newBadges });

    // Fire toast notification and push notification only when newly unlocked
    if (unlockedTitle) {
      setBadgeToast({ id: badgeId, title: unlockedTitle, message: unlockedMessage });
      scheduleBadgeUnlockNotification(unlockedTitle, unlockedMessage);
    }
  };

  // Check and auto-claim badges based on current metrics
  const checkAndClaimBadges = (metricsState) => {
    const { streakVal = 0, calmPointsVal = 0, tasksVal = [], urgesVal = [], completionsState = {} } = metricsState;
    const badgesToClaim = [];

    // First day badge (always claim if not already claimed)
    if (!badges.some(b => b.id === 'first_day' && b.got)) {
      badgesToClaim.push('first_day');
    }

    // Streak badges
    if (streakVal >= 3 && !badges.some(b => b.id === 'streak_3' && b.got)) {
      badgesToClaim.push('streak_3');
    }
    if (streakVal >= 7 && !badges.some(b => b.id === 'streak_7' && b.got)) {
      badgesToClaim.push('streak_7');
    }
    if (streakVal >= 30 && !badges.some(b => b.id === 'streak_30' && b.got)) {
      badgesToClaim.push('streak_30');
    }
    if (streakVal >= 90 && !badges.some(b => b.id === 'streak_90' && b.got)) {
      badgesToClaim.push('streak_90');
    }

    // Task completion badges - count all completed tasks across all days
    const completedTasks = Object.values(completionsState || {}).reduce((sum, dayMap) => {
      return sum + Object.values(dayMap || {}).filter(Boolean).length;
    }, 0);
    if (completedTasks >= 10 && !badges.some(b => b.id === 'tasks_10' && b.got)) {
      badgesToClaim.push('tasks_10');
    }
    if (completedTasks >= 50 && !badges.some(b => b.id === 'tasks_50' && b.got)) {
      badgesToClaim.push('tasks_50');
    }
    if (completedTasks >= 100 && !badges.some(b => b.id === 'tasks_100' && b.got)) {
      badgesToClaim.push('tasks_100');
    }

    // Calm points badges
    if (calmPointsVal >= 100 && !badges.some(b => b.id === 'calm_100' && b.got)) {
      badgesToClaim.push('calm_100');
    }
    if (calmPointsVal >= 500 && !badges.some(b => b.id === 'calm_500' && b.got)) {
      badgesToClaim.push('calm_500');
    }
    if (calmPointsVal >= 1000 && !badges.some(b => b.id === 'calm_1000' && b.got)) {
      badgesToClaim.push('calm_1000');
    }

    // Urge resistance badges
    const urgeCount = (urgesVal || []).length;
    if (urgeCount >= 10 && !badges.some(b => b.id === 'urge_resist_10' && b.got)) {
      badgesToClaim.push('urge_resist_10');
    }
    if (urgeCount >= 50 && !badges.some(b => b.id === 'urge_resist_50' && b.got)) {
      badgesToClaim.push('urge_resist_50');
    }

    // Claim all newly unlocked badges
    badgesToClaim.forEach(badgeId => claimBadge(badgeId));
  };

  // Set badges from external source (e.g., Firebase load)
  const setBadgesFromData = (badgesData) => {
    if (Array.isArray(badgesData)) {
      setBadges(badgesData);
    }
  };

  // Set calm points and save
  const updateCalmPoints = (newPoints) => {
    setCalmPoints(newPoints);
    saveBadgeData({ calmPoints: newPoints });
  };

  return (
    <BadgesContext.Provider
      value={{
        badges,
        calmPoints,
        badgeToast,
        claimBadge,
        checkAndClaimBadges,
        setCalmPoints: updateCalmPoints,
        clearBadgeToast: () => setBadgeToast(null),
        setBadgesFromData,
        setBadges,
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
}

export function useBadges() {
  const context = useContext(BadgesContext);
  if (!context) {
    throw new Error('useBadges must be used within BadgesProvider');
  }
  return context;
}

export default BadgesContext;
