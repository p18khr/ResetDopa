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
 * Request permission to access step count
 * @returns {Promise<boolean>} - true if permission granted
 */
export async function requestStepPermission() {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get today's step count
 * @returns {Promise<{ steps: number, available: boolean, permissionGranted: boolean }>}
 */
export async function getTodaySteps() {
  try {
    const available = await isStepCountingAvailable();
    if (!available) {
      return { steps: 0, available: false, permissionGranted: false };
    }

    // Only request permission once per app session
    if (!permissionChecked) {
      permissionStatus = await requestStepPermission();
      permissionChecked = true;
      if (__DEV__) console.log('[Steps] Permission check done:', permissionStatus);
    }

    if (!permissionStatus) {
      return { steps: 0, available: true, permissionGranted: false };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0); // Start of today
    const end = new Date();     // Now

    const result = await Pedometer.getStepCountAsync(start, end);
    const steps = result?.steps ?? 0;

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
