// Unit tests for steps.service.js
// Tests step counting service functions with mocked expo-sensors and AsyncStorage

import {
  isStepCountingAvailable,
  requestStepPermission,
  getTodaySteps,
  getCachedSteps,
  getStepGoalProgress,
  isStepGoalMet,
  formatSteps,
  STEPS_GOAL,
} from '../steps.service';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-sensors Pedometer
jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getStepCountAsync: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Suppress __DEV__ console noise in tests
global.__DEV__ = false;

const STEPS_STORAGE_KEY = '@dopaguide_daily_steps';

describe('Steps Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── isStepCountingAvailable ──────────────────────────────────────────────

  describe('isStepCountingAvailable', () => {
    it('should return true when pedometer is available', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(true);

      const result = await isStepCountingAvailable();

      expect(result).toBe(true);
      expect(Pedometer.isAvailableAsync).toHaveBeenCalledTimes(1);
    });

    it('should return false when pedometer is not available', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(false);

      const result = await isStepCountingAvailable();

      expect(result).toBe(false);
    });

    it('should return false when isAvailableAsync throws an error', async () => {
      Pedometer.isAvailableAsync.mockRejectedValue(new Error('Sensor error'));

      const result = await isStepCountingAvailable();

      expect(result).toBe(false);
    });
  });

  // ─── requestStepPermission ────────────────────────────────────────────────

  describe('requestStepPermission', () => {
    it('should return true when permission is granted', async () => {
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const result = await requestStepPermission();

      expect(result).toBe(true);
      expect(Pedometer.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return false when permission is denied', async () => {
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const result = await requestStepPermission();

      expect(result).toBe(false);
    });

    it('should return false when requestPermissionsAsync throws an error', async () => {
      Pedometer.requestPermissionsAsync.mockRejectedValue(new Error('Permission error'));

      const result = await requestStepPermission();

      expect(result).toBe(false);
    });
  });

  // ─── getTodaySteps ────────────────────────────────────────────────────────

  describe('getTodaySteps', () => {
    it('should return steps with available and permissionGranted true on success', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(true);
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Pedometer.getStepCountAsync.mockResolvedValue({ steps: 4200 });
      AsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await getTodaySteps();

      expect(result.steps).toBe(4200);
      expect(result.available).toBe(true);
      expect(result.permissionGranted).toBe(true);
    });

    it('should return available=false when pedometer is unavailable', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(false);

      const result = await getTodaySteps();

      expect(result.available).toBe(false);
      expect(result.permissionGranted).toBe(false);
      expect(result.steps).toBe(0);
      expect(Pedometer.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return permissionGranted=false when permission is denied', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(true);
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const result = await getTodaySteps();

      expect(result.available).toBe(true);
      expect(result.permissionGranted).toBe(false);
      expect(result.steps).toBe(0);
      expect(Pedometer.getStepCountAsync).not.toHaveBeenCalled();
    });

    it('should fall back to cached steps when getStepCountAsync throws', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(true);
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Pedometer.getStepCountAsync.mockRejectedValue(new Error('Hardware failure'));

      const today = new Date().toISOString().slice(0, 10);
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ steps: 1800, date: today })
      );

      const result = await getTodaySteps();

      expect(result.steps).toBe(1800);
      expect(result.available).toBe(true);
      expect(result.permissionGranted).toBe(true);
    });

    it('should cache steps to AsyncStorage after a successful read', async () => {
      Pedometer.isAvailableAsync.mockResolvedValue(true);
      Pedometer.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Pedometer.getStepCountAsync.mockResolvedValue({ steps: 5000 });
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await getTodaySteps();

      const today = new Date().toISOString().slice(0, 10);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STEPS_STORAGE_KEY,
        JSON.stringify({ steps: 5000, date: today })
      );
    });
  });

  // ─── getCachedSteps ───────────────────────────────────────────────────────

  describe('getCachedSteps', () => {
    it('should return cached steps when cache date matches today', async () => {
      const today = new Date().toISOString().slice(0, 10);
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ steps: 3500, date: today })
      );

      const result = await getCachedSteps();

      expect(result).toBe(3500);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STEPS_STORAGE_KEY);
    });

    it('should return 0 when cache date is from yesterday (stale)', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ steps: 9000, date: yesterday })
      );

      const result = await getCachedSteps();

      expect(result).toBe(0);
    });

    it('should return 0 when no cache exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCachedSteps();

      expect(result).toBe(0);
    });

    it('should return 0 when stored value is invalid JSON', async () => {
      AsyncStorage.getItem.mockResolvedValue('not-valid-json{{{');

      const result = await getCachedSteps();

      expect(result).toBe(0);
    });
  });

  // ─── getStepGoalProgress ──────────────────────────────────────────────────

  describe('getStepGoalProgress', () => {
    it('should return 0 for 0 steps', () => {
      expect(getStepGoalProgress(0)).toBe(0);
    });

    it('should return 50 for 3500 steps against the default 7000 goal', () => {
      expect(getStepGoalProgress(3500)).toBe(50);
    });

    it('should return 100 for exactly 7000 steps (goal met)', () => {
      expect(getStepGoalProgress(7000)).toBe(100);
    });

    it('should cap at 100 when steps exceed the goal (e.g. 10000 steps)', () => {
      expect(getStepGoalProgress(10000)).toBe(100);
    });

    it('should respect a custom goal when provided', () => {
      expect(getStepGoalProgress(5000, 10000)).toBe(50);
    });
  });

  // ─── isStepGoalMet ────────────────────────────────────────────────────────

  describe('isStepGoalMet', () => {
    it('should return false when steps are below the goal', () => {
      expect(isStepGoalMet(6999)).toBe(false);
    });

    it('should return true when steps exactly equal the goal', () => {
      expect(isStepGoalMet(7000)).toBe(true);
    });

    it('should return true when steps exceed the goal', () => {
      expect(isStepGoalMet(9500)).toBe(true);
    });

    it('should use the default STEPS_GOAL of 7000', () => {
      expect(STEPS_GOAL).toBe(7000);
      expect(isStepGoalMet(6999)).toBe(false);
      expect(isStepGoalMet(7000)).toBe(true);
    });

    it('should respect a custom goal when provided', () => {
      expect(isStepGoalMet(5000, 5000)).toBe(true);
      expect(isStepGoalMet(4999, 5000)).toBe(false);
    });
  });

  // ─── formatSteps ─────────────────────────────────────────────────────────

  describe('formatSteps', () => {
    it('should return "0" for 0 steps', () => {
      expect(formatSteps(0)).toBe('0');
    });

    it('should return "0" for a falsy value', () => {
      expect(formatSteps(undefined)).toBe('0');
      expect(formatSteps(null)).toBe('0');
    });

    it('should format 1234 with a thousands separator', () => {
      expect(formatSteps(1234)).toBe((1234).toLocaleString());
    });

    it('should format 7000 with a thousands separator', () => {
      expect(formatSteps(7000)).toBe((7000).toLocaleString());
    });

    it('should format a large number correctly', () => {
      expect(formatSteps(12345)).toBe((12345).toLocaleString());
    });
  });
});
