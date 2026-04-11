// src/services/steps.service.js
// Step counting service using expo-sensors Pedometer API
// Gracefully handles unavailable hardware and permission denials

import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS_STORAGE_KEY = '@dopaguide_daily_steps';
const STEPS_PERMISSION_KEY = '@dopaguide_steps_permission_checked';
const STEPS_GOAL = 7000; // Default daily step goal

// Distance and calorie calculation constants
const STEPS_PER_MILE = 2300; // Average: 2000-2500 steps = 1 mile
const CALORIES_PER_MILE = 100; // Average person burns ~100 cal/mile (varies by weight/speed)

// Track if we've already requested permission in this app session
let permissionChecked = false;
let permissionStatus = null;

// Real-time step counter (Android uses watch-based counting)
let currentStepCount = 0;
let stepWatcherSubscription = null;
let sessionStartSteps = 0;
let sessionStartTime = Date.now();

/**
 * Check if step counting is available on this device
 * @returns {Promise<boolean>}
 */
export async function isStepCountingAvailable() {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Explicitly request step permission (should be called on app startup)
 * Only actually requests it once; caches result in AsyncStorage
 * @returns {Promise<boolean>} - true if permission granted
 */
export async function ensureStepPermission() {
  try {
    // Check if we already cached a result
    const alreadyAsked = await AsyncStorage.getItem(STEPS_PERMISSION_KEY);
    if (alreadyAsked === 'true') {
      if (__DEV__) console.log('[Steps] Already requested permission, cached result:', permissionStatus);
      // Ensure permissionStatus is initialized
      if (permissionStatus === null) {
        permissionStatus = false; // Default to false if somehow uninitialized
      }
      return permissionStatus;
    }

    // Always try to request - even if device says unavailable, ask anyway (might work on some devices)
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      const granted = status === 'granted';

      if (__DEV__) console.log('[Steps] Permission request result:', status);

      // Cache the result
      permissionChecked = true;
      permissionStatus = granted;
      await AsyncStorage.setItem(STEPS_PERMISSION_KEY, 'true');

      return granted;
    } catch (permError) {
      // If permission request fails, device probably doesn't support it
      if (__DEV__) console.log('[Steps] Permission request unavailable on this device:', permError.message);
      permissionStatus = false;
      await AsyncStorage.setItem(STEPS_PERMISSION_KEY, 'true');
      return false;
    }
  } catch (error) {
    if (__DEV__) console.error('[Steps] Error in ensureStepPermission:', error.message);
    permissionStatus = false;
    return false;
  }
}

/**
 * Request permission to access step count (legacy - use ensureStepPermission instead)
 * @returns {Promise<boolean>} - true if permission granted
 */
export async function requestStepPermission() {
  return await ensureStepPermission();
}

/**
 * Start watching real-time step count (Android-compatible)
 * @returns {Promise<boolean>} - true if watcher started successfully
 */
export async function startStepWatcher() {
  try {
    if (stepWatcherSubscription) {
      if (__DEV__) console.log('[Steps] Watcher already running');
      return true;
    }

    const available = await isStepCountingAvailable();
    if (!available) {
      if (__DEV__) console.log('[Steps] Step counting not available on this device');
      return false;
    }

    // Ensure permission is granted
    if (!permissionStatus) {
      await ensureStepPermission();
    }

    if (!permissionStatus) {
      if (__DEV__) console.log('[Steps] Permission not granted');
      return false;
    }

    // Start watching step count
    stepWatcherSubscription = Pedometer.watchStepCount((result) => {
      currentStepCount = result.steps;
      if (__DEV__) console.log('[Steps] Real-time count:', currentStepCount);
    });

    sessionStartSteps = currentStepCount;
    sessionStartTime = Date.now();

    if (__DEV__) console.log('[Steps] Step watcher started');
    return true;
  } catch (error) {
    if (__DEV__) console.error('[Steps] Error starting watcher:', error.message);
    return false;
  }
}

/**
 * Stop watching step count
 */
export function stopStepWatcher() {
  if (stepWatcherSubscription) {
    stepWatcherSubscription.remove();
    stepWatcherSubscription = null;
    if (__DEV__) console.log('[Steps] Step watcher stopped');
  }
}

/**
 * Get today's step count (uses real-time watcher on Android)
 * @returns {Promise<{ steps: number, available: boolean, permissionGranted: boolean }>}
 */
export async function getTodaySteps() {
  try {
    const available = await isStepCountingAvailable();
    if (!available) {
      return { steps: 0, available: false, permissionGranted: false };
    }

    // Ensure permission is granted
    if (!permissionStatus) {
      permissionStatus = await ensureStepPermission();
      permissionChecked = true;
    }

    if (!permissionStatus) {
      return { steps: 0, available: true, permissionGranted: false };
    }

    // Make sure watcher is running
    if (!stepWatcherSubscription) {
      await startStepWatcher();
    }

    // Return current accumulated steps
    const steps = currentStepCount;

    // Cache to AsyncStorage for quick reads
    await cacheSteps(steps);

    if (__DEV__) console.log('[Steps] Today:', steps, '/ Goal:', STEPS_GOAL);
    return { steps, available: true, permissionGranted: true };

  } catch (error) {
    if (__DEV__) console.error('[Steps] Error getting steps:', error.message);
    // Fall back to cached value
    const cached = await getCachedSteps();
    return { steps: cached, available: true, permissionGranted: true };
  }
}

/**
 * Calculate distance walked from step count (miles)
 * @param {number} steps
 * @returns {number} Distance in miles
 */
export function calculateDistance(steps) {
  return Number((steps / STEPS_PER_MILE).toFixed(2));
}

/**
 * Calculate estimated calories burned from distance
 * @param {number} steps
 * @returns {number} Estimated calories burned
 */
export function calculateCalories(steps) {
  const distance = calculateDistance(steps);
  return Math.round(distance * CALORIES_PER_MILE);
}

/**
 * Get today's activity metrics (steps, distance, calories)
 * @returns {Promise<{ steps: number, distance: number, calories: number, available: boolean, permissionGranted: boolean }>}
 */
export async function getTodayMetrics() {
  try {
    const stepsData = await getTodaySteps();
    const steps = stepsData.steps || 0;
    const distance = calculateDistance(steps);
    const calories = calculateCalories(steps);

    return {
      steps,
      distance,
      calories,
      available: stepsData.available,
      permissionGranted: stepsData.permissionGranted
    };
  } catch (error) {
    if (__DEV__) console.error('[Metrics] Error getting metrics:', error.message);
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      available: false,
      permissionGranted: false
    };
  }
}

/**
 * Get cached step count from AsyncStorage (for fast initial render)
 * @returns {Promise<number>}
 */
export async function getCachedSteps() {
  try {
    const stored = await AsyncStorage.getItem(STEPS_STORAGE_KEY);
    if (!stored) return 0;
    const { steps, date } = JSON.parse(stored);
    // Only use cache if it's from today
    const today = new Date().toISOString().slice(0, 10);
    return date === today ? steps : 0;
  } catch {
    return 0;
  }
}

/**
 * Cache step count with today's date
 */
async function cacheSteps(steps) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await AsyncStorage.setItem(STEPS_STORAGE_KEY, JSON.stringify({ steps, date: today }));
  } catch (error) {
    if (__DEV__) console.error('[Steps] Cache error:', error.message);
  }
}

/**
 * Get percentage of daily goal completed
 * @param {number} steps
 * @param {number} goal
 * @returns {number} 0-100
 */
export function getStepGoalProgress(steps, goal = STEPS_GOAL) {
  return Math.min(100, Math.round((steps / goal) * 100));
}

/**
 * Check if daily step goal is met
 * @param {number} steps
 * @param {number} goal
 * @returns {boolean}
 */
export function isStepGoalMet(steps, goal = STEPS_GOAL) {
  return steps >= goal;
}

/**
 * Format step count for display (e.g. 7234 → "7,234")
 * @param {number} steps
 * @returns {string}
 */
export function formatSteps(steps) {
  if (!steps || steps === 0) return '0';
  return steps.toLocaleString();
}

/**
 * Reset permission state to force re-requesting on next getTodaySteps() call
 * (useful if user wants to re-enable step tracking from Settings, or for testing)
 */
export function resetStepPermissionCache() {
  permissionChecked = false;
  permissionStatus = null;
  if (__DEV__) console.log('[Steps] Permission cache reset');
}

export { STEPS_GOAL };
