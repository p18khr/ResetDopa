// src/services/events.service.js
// Firebase events service for AI training data collection
// Only writes data for users who explicitly opt in
// Events are stored in users/{uid}/events sub-collection
// Format is AI-training-ready (compatible with model fine-tuning pipelines)

import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EVENT_TYPES } from '../constants/eventSchema';

const OPT_IN_KEY = '@dopaguide_training_opt_in';

// ─── Opt-In Management ───────────────────────────────────────────────────────

/**
 * Check if user has opted in to training data collection
 * @returns {Promise<boolean>}
 */
export async function isTrainingOptedIn() {
  try {
    const value = await AsyncStorage.getItem(OPT_IN_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Set user's preference for training data collection
 * @param {boolean} optedIn
 */
export async function setTrainingOptIn(optedIn) {
  try {
    await AsyncStorage.setItem(OPT_IN_KEY, optedIn ? 'true' : 'false');
    if (__DEV__) console.log('[Events] Training opt-in set to:', optedIn);
  } catch (error) {
    if (__DEV__) console.error('[Events] Failed to set opt-in:', error.message);
  }
}

// ─── Event Logging ────────────────────────────────────────────────────────────

/**
 * Log an event to Firebase for AI training
 * Non-blocking - errors are silently caught to never disrupt UX
 * @param {string} uid - Firebase user ID
 * @param {object} event - Event object built from eventSchema.js builders
 */
export async function logEvent(uid, event) {
  // Guard: only log for opted-in users
  const optedIn = await isTrainingOptedIn();
  if (!optedIn) return;

  if (!uid || !event) return;

  try {
    const eventsRef = collection(db, 'users', uid, 'events');
    await addDoc(eventsRef, {
      ...event,
      _loggedAt: new Date().toISOString(), // Server-side timestamp for ordering
    });

    if (__DEV__) console.log('[Events] Logged:', event.type, '| day:', event.dayNumber);
  } catch (error) {
    // Non-blocking - never crash the app for analytics
    if (__DEV__) console.error('[Events] Failed to log event:', error.message);
  }
}

/**
 * Log a urge event
 * @param {string} uid
 * @param {object} urgeEvent - built with buildUrgeEvent()
 */
export async function logUrgeEvent(uid, urgeEvent) {
  await logEvent(uid, urgeEvent);
}

/**
 * Log a mood check event
 * @param {string} uid
 * @param {object} moodEvent - built with buildMoodEvent()
 */
export async function logMoodEvent(uid, moodEvent) {
  await logEvent(uid, moodEvent);
}

/**
 * Log a chat message event (only for opted-in users)
 * @param {string} uid
 * @param {object} chatEvent - built with buildChatEvent()
 */
export async function logChatEvent(uid, chatEvent) {
  // Extra guard for chat - especially sensitive
  await logEvent(uid, chatEvent);
}

/**
 * Log a task completion event
 * @param {string} uid
 * @param {object} taskEvent - built with buildTaskEvent()
 */
export async function logTaskEvent(uid, taskEvent) {
  await logEvent(uid, taskEvent);
}

/**
 * Log a steps goal met event
 * @param {string} uid
 * @param {object} stepsEvent - built with buildStepsEvent()
 */
export async function logStepsEvent(uid, stepsEvent) {
  await logEvent(uid, stepsEvent);
}

// ─── Data Export ─────────────────────────────────────────────────────────────

/**
 * Get recent events for a user (useful for debugging/preview)
 * @param {string} uid
 * @param {number} count - Max number of events to retrieve
 * @returns {Promise<Array>}
 */
export async function getRecentEvents(uid, count = 20) {
  try {
    const eventsRef = collection(db, 'users', uid, 'events');
    const q = query(eventsRef, orderBy('_loggedAt', 'desc'), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (__DEV__) console.error('[Events] Failed to get recent events:', error.message);
    return [];
  }
}

/**
 * Export events as fine-tuning JSONL format (for model training)
 * Only includes chat events, grouped as conversation pairs
 * @param {Array} events - Array of event objects
 * @returns {string} - JSONL string ready for fine-tuning
 */
export function exportChatEventsAsJSONL(events) {
  const chatEvents = events.filter(e => e.type === EVENT_TYPES.CHAT_MESSAGE);
  const conversations = [];
  let currentConversation = [];

  for (const event of chatEvents) {
    currentConversation.push({
      role: event.role,
      content: event.content,
    });

    // Group into user/assistant pairs for fine-tuning
    if (event.role === 'assistant' && currentConversation.length >= 2) {
      conversations.push(JSON.stringify({ messages: [...currentConversation] }));
      currentConversation = [];
    }
  }

  return conversations.join('\n');
}
