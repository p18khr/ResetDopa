// Unit tests for events.service.js
// Tests Firebase event logging with mocked Firestore, AsyncStorage, and event schema

import {
  isTrainingOptedIn,
  setTrainingOptIn,
  logEvent,
  logUrgeEvent,
  logMoodEvent,
  logChatEvent,
  logTaskEvent,
  logStepsEvent,
  getRecentEvents,
  exportChatEventsAsJSONL,
} from '../events.service';
import * as firestore from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({ db: {} }));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock event schema constants
jest.mock('../../constants/eventSchema', () => ({
  EVENT_TYPES: {
    URGE_LOGGED: 'urge_logged',
    URGE_OUTCOME: 'urge_outcome',
    MOOD_CHECK: 'mood_check',
    TASK_COMPLETED: 'task_completed',
    TASK_UNCOMPLETED: 'task_uncompleted',
    STREAK_ACHIEVED: 'streak_achieved',
    STEPS_GOAL_MET: 'steps_goal_met',
    CHAT_MESSAGE: 'chat_message',
    SESSION_START: 'session_start',
  },
}));

// Suppress __DEV__ console noise in tests
global.__DEV__ = false;

const OPT_IN_KEY = '@dopaguide_training_opt_in';

describe('Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── isTrainingOptedIn ────────────────────────────────────────────────────

  describe('isTrainingOptedIn', () => {
    it('should return true when AsyncStorage contains "true"', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');

      const result = await isTrainingOptedIn();

      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(OPT_IN_KEY);
    });

    it('should return false when AsyncStorage contains "false"', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      const result = await isTrainingOptedIn();

      expect(result).toBe(false);
    });

    it('should return false when AsyncStorage returns null (key not set)', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await isTrainingOptedIn();

      expect(result).toBe(false);
    });

    it('should return false when AsyncStorage throws an error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage unavailable'));

      const result = await isTrainingOptedIn();

      expect(result).toBe(false);
    });
  });

  // ─── setTrainingOptIn ─────────────────────────────────────────────────────

  describe('setTrainingOptIn', () => {
    it('should call AsyncStorage.setItem with "true" when opted in', async () => {
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await setTrainingOptIn(true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(OPT_IN_KEY, 'true');
    });

    it('should call AsyncStorage.setItem with "false" when opted out', async () => {
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await setTrainingOptIn(false);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(OPT_IN_KEY, 'false');
    });
  });

  // ─── logEvent ─────────────────────────────────────────────────────────────

  describe('logEvent', () => {
    const TEST_UID = 'user-abc-123';
    const TEST_EVENT = { type: 'mood_check', mood: 'calm', dayNumber: 5 };
    const mockEventsRef = { path: 'users/user-abc-123/events' };

    it('should NOT call addDoc when the user is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logEvent(TEST_UID, TEST_EVENT);

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });

    it('should call addDoc when the user IS opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue(mockEventsRef);
      firestore.addDoc.mockResolvedValue({ id: 'new-event-id' });

      await logEvent(TEST_UID, TEST_EVENT);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc when uid is null', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');

      await logEvent(null, TEST_EVENT);

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });

    it('should NOT call addDoc when event is null', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');

      await logEvent(TEST_UID, null);

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });

    it('should catch Firebase errors silently without throwing', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue(mockEventsRef);
      firestore.addDoc.mockRejectedValue(new Error('Firestore quota exceeded'));

      await expect(logEvent(TEST_UID, TEST_EVENT)).resolves.toBeUndefined();
    });

    it('should call collection with the correct users/{uid}/events path', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue(mockEventsRef);
      firestore.addDoc.mockResolvedValue({ id: 'new-event-id' });

      const { db } = require('../../config/firebase');
      await logEvent(TEST_UID, TEST_EVENT);

      expect(firestore.collection).toHaveBeenCalledWith(db, 'users', TEST_UID, 'events');
    });

    it('should pass a _loggedAt timestamp field to addDoc', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue(mockEventsRef);
      firestore.addDoc.mockResolvedValue({ id: 'new-event-id' });

      await logEvent(TEST_UID, TEST_EVENT);

      expect(firestore.addDoc).toHaveBeenCalledWith(
        mockEventsRef,
        expect.objectContaining({
          ...TEST_EVENT,
          _loggedAt: expect.any(String),
        })
      );
    });
  });

  // ─── Event-specific wrapper functions ─────────────────────────────────────

  describe('logUrgeEvent', () => {
    it('should delegate to logEvent and call addDoc for an opted-in user', async () => {
      const urgeEvent = { type: 'urge_logged', emotion: 'anxious', dayNumber: 3 };
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue({ id: 'urge-event-id' });

      await logUrgeEvent('uid-1', urgeEvent);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc for a user that is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logUrgeEvent('uid-1', { type: 'urge_logged' });

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });
  });

  describe('logMoodEvent', () => {
    it('should delegate to logEvent and call addDoc for an opted-in user', async () => {
      const moodEvent = { type: 'mood_check', mood: 'good', dayNumber: 1 };
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue({ id: 'mood-event-id' });

      await logMoodEvent('uid-1', moodEvent);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc for a user that is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logMoodEvent('uid-1', { type: 'mood_check' });

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });
  });

  describe('logChatEvent', () => {
    it('should delegate to logEvent and call addDoc for an opted-in user', async () => {
      const chatEvent = { type: 'chat_message', role: 'user', content: 'Hello', dayNumber: 2 };
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue({ id: 'chat-event-id' });

      await logChatEvent('uid-1', chatEvent);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc for a user that is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logChatEvent('uid-1', { type: 'chat_message' });

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });
  });

  describe('logTaskEvent', () => {
    it('should delegate to logEvent and call addDoc for an opted-in user', async () => {
      const taskEvent = { type: 'task_completed', taskName: 'Morning walk', dayNumber: 4 };
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue({ id: 'task-event-id' });

      await logTaskEvent('uid-1', taskEvent);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc for a user that is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logTaskEvent('uid-1', { type: 'task_completed' });

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });
  });

  describe('logStepsEvent', () => {
    it('should delegate to logEvent and call addDoc for an opted-in user', async () => {
      const stepsEvent = { type: 'steps_goal_met', steps: 7500, goal: 7000, dayNumber: 6 };
      AsyncStorage.getItem.mockResolvedValue('true');
      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue({ id: 'steps-event-id' });

      await logStepsEvent('uid-1', stepsEvent);

      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    it('should NOT call addDoc for a user that is not opted in', async () => {
      AsyncStorage.getItem.mockResolvedValue('false');

      await logStepsEvent('uid-1', { type: 'steps_goal_met' });

      expect(firestore.addDoc).not.toHaveBeenCalled();
    });
  });

  // ─── getRecentEvents ──────────────────────────────────────────────────────

  describe('getRecentEvents', () => {
    it('should return a mapped array of events with id and data fields', async () => {
      const mockRef = {};
      const mockQuery = {};
      firestore.collection.mockReturnValue(mockRef);
      firestore.query.mockReturnValue(mockQuery);
      firestore.orderBy.mockReturnValue('orderBy_clause');
      firestore.limit.mockReturnValue('limit_clause');
      firestore.getDocs.mockResolvedValue({
        docs: [
          { id: 'event-1', data: () => ({ type: 'mood_check', mood: 'calm' }) },
          { id: 'event-2', data: () => ({ type: 'urge_logged', emotion: 'anxious' }) },
        ],
      });

      const result = await getRecentEvents('uid-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'event-1', type: 'mood_check', mood: 'calm' });
      expect(result[1]).toEqual({ id: 'event-2', type: 'urge_logged', emotion: 'anxious' });
    });

    it('should query with orderBy _loggedAt descending and respect count limit', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.orderBy.mockReturnValue('orderBy_clause');
      firestore.limit.mockReturnValue('limit_clause');
      firestore.getDocs.mockResolvedValue({ docs: [] });

      await getRecentEvents('uid-1', 10);

      expect(firestore.orderBy).toHaveBeenCalledWith('_loggedAt', 'desc');
      expect(firestore.limit).toHaveBeenCalledWith(10);
    });

    it('should return an empty array when getDocs throws an error', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.orderBy.mockReturnValue('orderBy_clause');
      firestore.limit.mockReturnValue('limit_clause');
      firestore.getDocs.mockRejectedValue(new Error('Firestore read error'));

      const result = await getRecentEvents('uid-1');

      expect(result).toEqual([]);
    });
  });

  // ─── exportChatEventsAsJSONL ──────────────────────────────────────────────

  describe('exportChatEventsAsJSONL', () => {
    it('should return an empty string when the events array is empty', () => {
      const result = exportChatEventsAsJSONL([]);

      expect(result).toBe('');
    });

    it('should return an empty string when there are no chat events', () => {
      const events = [
        { type: 'mood_check', mood: 'calm' },
        { type: 'urge_logged', emotion: 'anxious' },
        { type: 'task_completed', taskName: 'Walk' },
      ];

      const result = exportChatEventsAsJSONL(events);

      expect(result).toBe('');
    });

    it('should return a single JSONL line for one user/assistant pair', () => {
      const events = [
        { type: 'chat_message', role: 'user', content: 'Hello' },
        { type: 'chat_message', role: 'assistant', content: 'Hi there' },
      ];

      const result = exportChatEventsAsJSONL(events);

      const lines = result.split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(parsed.messages[1]).toEqual({ role: 'assistant', content: 'Hi there' });
    });

    it('should ignore non-chat events and only export chat_message events', () => {
      const events = [
        { type: 'urge_logged', emotion: 'anxious' },
        { type: 'chat_message', role: 'user', content: 'I need help' },
        { type: 'mood_check', mood: 'calm' },
        { type: 'chat_message', role: 'assistant', content: 'Of course' },
      ];

      const result = exportChatEventsAsJSONL(events);

      const lines = result.split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.messages[0]).toEqual({ role: 'user', content: 'I need help' });
      expect(parsed.messages[1]).toEqual({ role: 'assistant', content: 'Of course' });
    });

    it('should produce multiple JSONL lines for multiple conversation pairs', () => {
      const events = [
        { type: 'chat_message', role: 'user', content: 'First question' },
        { type: 'chat_message', role: 'assistant', content: 'First answer' },
        { type: 'chat_message', role: 'user', content: 'Second question' },
        { type: 'chat_message', role: 'assistant', content: 'Second answer' },
      ];

      const result = exportChatEventsAsJSONL(events);

      const lines = result.split('\n');
      expect(lines).toHaveLength(2);

      const firstPair = JSON.parse(lines[0]);
      expect(firstPair.messages).toHaveLength(2);
      expect(firstPair.messages[0]).toEqual({ role: 'user', content: 'First question' });
      expect(firstPair.messages[1]).toEqual({ role: 'assistant', content: 'First answer' });

      const secondPair = JSON.parse(lines[1]);
      expect(secondPair.messages).toHaveLength(2);
      expect(secondPair.messages[0]).toEqual({ role: 'user', content: 'Second question' });
      expect(secondPair.messages[1]).toEqual({ role: 'assistant', content: 'Second answer' });
    });

    it('should group multiple user messages with a single assistant reply into one conversation', () => {
      const events = [
        { type: 'chat_message', role: 'user', content: 'Message 1' },
        { type: 'chat_message', role: 'user', content: 'Message 2' },
        { type: 'chat_message', role: 'assistant', content: 'Reply' },
      ];

      const result = exportChatEventsAsJSONL(events);

      const lines = result.split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.messages).toHaveLength(3);
      expect(parsed.messages[0]).toEqual({ role: 'user', content: 'Message 1' });
      expect(parsed.messages[1]).toEqual({ role: 'user', content: 'Message 2' });
      expect(parsed.messages[2]).toEqual({ role: 'assistant', content: 'Reply' });
    });

    it('should not flush a trailing user message with no assistant reply', () => {
      const events = [
        { type: 'chat_message', role: 'user', content: 'First question' },
        { type: 'chat_message', role: 'assistant', content: 'First answer' },
        { type: 'chat_message', role: 'user', content: 'Unanswered question' },
      ];

      const result = exportChatEventsAsJSONL(events);

      // Only the completed pair should be included
      const lines = result.split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.messages).toHaveLength(2);
    });

    it('should produce valid JSON for every line', () => {
      const events = [
        { type: 'chat_message', role: 'user', content: 'Question A' },
        { type: 'chat_message', role: 'assistant', content: 'Answer A' },
        { type: 'chat_message', role: 'user', content: 'Question B' },
        { type: 'chat_message', role: 'assistant', content: 'Answer B' },
      ];

      const result = exportChatEventsAsJSONL(events);

      for (const line of result.split('\n')) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });
});
