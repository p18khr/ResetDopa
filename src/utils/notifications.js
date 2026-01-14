// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90E2',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push notification permissions!');
      return;
    }
  } else {
    // Running on simulator or Expo Go; remote push limited
  }

  return token;
}

// Detect if running in Expo Go (remote push not available on Android)
export const isExpoGo = Constants?.appOwnership === 'expo';

// Ensure notification permissions are granted (returns boolean)
export async function ensureNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// Schedule daily reminder notification
export async function scheduleDailyReminder(hour = 9, minute = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const trigger = {
    hour: hour,
    minute: minute,
    repeats: true,
  };

  const motivationalMessages = [
    "💪 You're doing great! Log in to track your progress today.",
    "🌟 Every day is a new opportunity. Check your tasks!",
    "🔥 Keep your streak alive! How are you feeling today?",
    "✨ Your journey matters. Take a moment to reflect.",
    "🎯 Small steps lead to big changes. Let's go!",
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ResetDopa™ Daily Check-in",
      body: randomMessage,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  return true;
}

// Schedule a daily mood prompt notification
export async function scheduleDailyMoodPrompt(hour = 20, minute = 0) {
  // Do not cancel all notifications here; allow coexistence with other schedules
  const trigger = {
    hour,
    minute,
    repeats: true,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How are you feeling today? 😊',
      body: 'Log your mood in ResetDopa™ to keep insights fresh.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  return true;
}

// Schedule a one-off mood prompt after N seconds (for testing)
export async function scheduleMoodPromptIn(seconds = 5) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How are you feeling right now? 😊',
      body: 'Quick test prompt from ResetDopa™.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: { seconds },
  });
}

// Fire a mood prompt immediately (no delay) — useful for testing
export async function scheduleImmediateMoodPrompt() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How are you feeling right now? 😊',
      body: 'Immediate test prompt from ResetDopa™.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

// Debug helper: return count of scheduled notifications
export async function getScheduledNotificationsCount() {
  const items = await Notifications.getAllScheduledNotificationsAsync();
  return Array.isArray(items) ? items.length : 0;
}

// Schedule urge support notification (when user logs urge)
export async function scheduleUrgeSupportNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've Got This! 💙",
      body: "Remember why you started. You're stronger than you think.",
      sound: true,
    },
    trigger: {
      seconds: 3600, // 1 hour later
    },
  });
}

// Schedule milestone celebration notification
export async function scheduleMilestoneNotification(milestone) {
  const messages = {
    streak_7: "🎉 Amazing! 7-day streak unlocked!",
    streak_30: "🏆 Incredible! 30 days strong!",
    streak_90: "👑 Legendary! 90-day champion!",
    tasks_10: "⭐ 10 tasks completed! You're on fire!",
    calm_500: "🌟 500 Calm Points! You're doing great!",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New Achievement Unlocked!",
      body: messages[milestone] || "You've reached a new milestone!",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Immediate
  });
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Schedule threshold increase notification (for days 8, 15, 22)
export async function scheduleThresholdNotification(weekNumber = 2, hour = 8, minute = 0) {
  const messages = {
    2: "📈 Week 2 Threshold: Aim for 60% to advance your streak. You got stronger!",
    3: "📈 Week 3 Threshold: Reach 65% to keep momentum. Keep pushing!",
    4: "📈 Week 4 Threshold: Maintain 70% consistency. You're a pro now!",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎯 Threshold Increased",
      body: messages[weekNumber] || `Week ${weekNumber} threshold increased. Keep going!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      hour,
      minute,
      repeats: false, // One-time notification
    },
  });

  return true;
}

// Schedule badge unlock notification (immediate)
export async function scheduleBadgeUnlockNotification(badgeTitle, badgeMessage = null) {
  const body = badgeMessage || badgeTitle;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Badge Unlocked!',
      body: body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Immediate notification
  });

  return true;
}
