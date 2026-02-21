// src/constants/__tests__/eventSchema.test.js
// Comprehensive tests for all exports in eventSchema.js

import {
  EVENT_TYPES,
  TIME_OF_DAY,
  WEEK_DAYS,
  MOOD_VALUES,
  URGE_INTENSITY,
  URGE_OUTCOME,
  getTimeOfDay,
  buildEventBase,
  buildUrgeEvent,
  buildMoodEvent,
  buildTaskEvent,
  buildStepsEvent,
  buildChatEvent,
  intensityToScore,
  urgeToFeatures,
} from '../eventSchema';

describe('eventSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── EVENT_TYPES ────────────────────────────────────────────────────────────

  describe('EVENT_TYPES', () => {
    it('has all required keys', () => {
      expect(EVENT_TYPES).toHaveProperty('URGE_LOGGED');
      expect(EVENT_TYPES).toHaveProperty('URGE_OUTCOME');
      expect(EVENT_TYPES).toHaveProperty('MOOD_CHECK');
      expect(EVENT_TYPES).toHaveProperty('TASK_COMPLETED');
      expect(EVENT_TYPES).toHaveProperty('TASK_UNCOMPLETED');
      expect(EVENT_TYPES).toHaveProperty('STREAK_ACHIEVED');
      expect(EVENT_TYPES).toHaveProperty('STEPS_GOAL_MET');
      expect(EVENT_TYPES).toHaveProperty('CHAT_MESSAGE');
      expect(EVENT_TYPES).toHaveProperty('SESSION_START');
    });

    it('has correct string values for every key', () => {
      expect(EVENT_TYPES.URGE_LOGGED).toBe('urge_logged');
      expect(EVENT_TYPES.URGE_OUTCOME).toBe('urge_outcome');
      expect(EVENT_TYPES.MOOD_CHECK).toBe('mood_check');
      expect(EVENT_TYPES.TASK_COMPLETED).toBe('task_completed');
      expect(EVENT_TYPES.TASK_UNCOMPLETED).toBe('task_uncompleted');
      expect(EVENT_TYPES.STREAK_ACHIEVED).toBe('streak_achieved');
      expect(EVENT_TYPES.STEPS_GOAL_MET).toBe('steps_goal_met');
      expect(EVENT_TYPES.CHAT_MESSAGE).toBe('chat_message');
      expect(EVENT_TYPES.SESSION_START).toBe('session_start');
    });

    it('all values are strings', () => {
      Object.values(EVENT_TYPES).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });

    it('has exactly 9 entries', () => {
      expect(Object.keys(EVENT_TYPES)).toHaveLength(9);
    });
  });

  // ─── TIME_OF_DAY ────────────────────────────────────────────────────────────

  describe('TIME_OF_DAY', () => {
    it('has all required keys', () => {
      expect(TIME_OF_DAY).toHaveProperty('EARLY_MORNING');
      expect(TIME_OF_DAY).toHaveProperty('MORNING');
      expect(TIME_OF_DAY).toHaveProperty('AFTERNOON');
      expect(TIME_OF_DAY).toHaveProperty('EVENING');
      expect(TIME_OF_DAY).toHaveProperty('NIGHT');
      expect(TIME_OF_DAY).toHaveProperty('LATE_NIGHT');
    });

    it('has correct string values for every key', () => {
      expect(TIME_OF_DAY.EARLY_MORNING).toBe('early_morning');
      expect(TIME_OF_DAY.MORNING).toBe('morning');
      expect(TIME_OF_DAY.AFTERNOON).toBe('afternoon');
      expect(TIME_OF_DAY.EVENING).toBe('evening');
      expect(TIME_OF_DAY.NIGHT).toBe('night');
      expect(TIME_OF_DAY.LATE_NIGHT).toBe('late_night');
    });

    it('all values are strings', () => {
      Object.values(TIME_OF_DAY).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });

    it('has exactly 6 entries', () => {
      expect(Object.keys(TIME_OF_DAY)).toHaveLength(6);
    });
  });

  // ─── WEEK_DAYS ──────────────────────────────────────────────────────────────

  describe('WEEK_DAYS', () => {
    it('is an array', () => {
      expect(Array.isArray(WEEK_DAYS)).toBe(true);
    });

    it('has exactly 7 elements', () => {
      expect(WEEK_DAYS).toHaveLength(7);
    });

    it('contains all 7 days in the correct order', () => {
      expect(WEEK_DAYS).toEqual([
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ]);
    });

    it('aligns with JavaScript Date.getDay() index ordering (sunday = 0)', () => {
      expect(WEEK_DAYS[0]).toBe('sunday');
      expect(WEEK_DAYS[1]).toBe('monday');
      expect(WEEK_DAYS[2]).toBe('tuesday');
      expect(WEEK_DAYS[3]).toBe('wednesday');
      expect(WEEK_DAYS[4]).toBe('thursday');
      expect(WEEK_DAYS[5]).toBe('friday');
      expect(WEEK_DAYS[6]).toBe('saturday');
    });

    it('all elements are lowercase strings', () => {
      WEEK_DAYS.forEach((day) => {
        expect(typeof day).toBe('string');
        expect(day).toBe(day.toLowerCase());
      });
    });
  });

  // ─── MOOD_VALUES ────────────────────────────────────────────────────────────

  describe('MOOD_VALUES', () => {
    it('has all required mood keys', () => {
      expect(MOOD_VALUES).toHaveProperty('stressed');
      expect(MOOD_VALUES).toHaveProperty('anxious');
      expect(MOOD_VALUES).toHaveProperty('tired');
      expect(MOOD_VALUES).toHaveProperty('numb');
      expect(MOOD_VALUES).toHaveProperty('foggy');
      expect(MOOD_VALUES).toHaveProperty('scattered');
      expect(MOOD_VALUES).toHaveProperty('calm');
      expect(MOOD_VALUES).toHaveProperty('good');
    });

    it('all values are numeric', () => {
      Object.values(MOOD_VALUES).forEach((score) => {
        expect(typeof score).toBe('number');
      });
    });

    it('has correct numeric scores', () => {
      expect(MOOD_VALUES.stressed).toBe(1);
      expect(MOOD_VALUES.anxious).toBe(2);
      expect(MOOD_VALUES.tired).toBe(3);
      expect(MOOD_VALUES.numb).toBe(4);
      expect(MOOD_VALUES.foggy).toBe(5);
      expect(MOOD_VALUES.scattered).toBe(6);
      expect(MOOD_VALUES.calm).toBe(7);
      expect(MOOD_VALUES.good).toBe(8);
    });

    it('scores form a contiguous range from 1 to 8', () => {
      const scores = Object.values(MOOD_VALUES).sort((a, b) => a - b);
      expect(scores).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('higher scores represent more positive moods', () => {
      expect(MOOD_VALUES.good).toBeGreaterThan(MOOD_VALUES.calm);
      expect(MOOD_VALUES.calm).toBeGreaterThan(MOOD_VALUES.scattered);
      expect(MOOD_VALUES.scattered).toBeGreaterThan(MOOD_VALUES.stressed);
    });

    it('has exactly 8 entries', () => {
      expect(Object.keys(MOOD_VALUES)).toHaveLength(8);
    });
  });

  // ─── URGE_INTENSITY ─────────────────────────────────────────────────────────

  describe('URGE_INTENSITY', () => {
    it('has all required keys', () => {
      expect(URGE_INTENSITY).toHaveProperty('LOW');
      expect(URGE_INTENSITY).toHaveProperty('MEDIUM');
      expect(URGE_INTENSITY).toHaveProperty('HIGH');
    });

    it('has correct string values', () => {
      expect(URGE_INTENSITY.LOW).toBe('low');
      expect(URGE_INTENSITY.MEDIUM).toBe('medium');
      expect(URGE_INTENSITY.HIGH).toBe('high');
    });

    it('all values are lowercase strings', () => {
      Object.values(URGE_INTENSITY).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toLowerCase());
      });
    });

    it('has exactly 3 entries', () => {
      expect(Object.keys(URGE_INTENSITY)).toHaveLength(3);
    });
  });

  // ─── URGE_OUTCOME ───────────────────────────────────────────────────────────

  describe('URGE_OUTCOME', () => {
    it('has all required keys', () => {
      expect(URGE_OUTCOME).toHaveProperty('RESISTED');
      expect(URGE_OUTCOME).toHaveProperty('SLIPPED');
      expect(URGE_OUTCOME).toHaveProperty('PENDING');
    });

    it('RESISTED has the correct string value', () => {
      expect(URGE_OUTCOME.RESISTED).toBe('resisted');
    });

    it('SLIPPED has the correct string value', () => {
      expect(URGE_OUTCOME.SLIPPED).toBe('slipped');
    });

    it('PENDING is null (represents an unresolved in-progress event)', () => {
      expect(URGE_OUTCOME.PENDING).toBeNull();
    });

    it('has exactly 3 entries', () => {
      expect(Object.keys(URGE_OUTCOME)).toHaveLength(3);
    });
  });

  // ─── getTimeOfDay ───────────────────────────────────────────────────────────

  describe('getTimeOfDay', () => {
    // Helper: create a Date whose local hour is exactly `hour`
    function makeDate(hour) {
      const d = new Date();
      d.setHours(hour, 0, 0, 0);
      return d;
    }

    describe('LATE_NIGHT — 00:00 to 04:59', () => {
      it('returns late_night for hour 0 (midnight)', () => {
        expect(getTimeOfDay(makeDate(0))).toBe(TIME_OF_DAY.LATE_NIGHT);
      });

      it('returns late_night for hour 1', () => {
        expect(getTimeOfDay(makeDate(1))).toBe(TIME_OF_DAY.LATE_NIGHT);
      });

      it('returns late_night for hour 4 (upper boundary, last hour before early_morning)', () => {
        expect(getTimeOfDay(makeDate(4))).toBe(TIME_OF_DAY.LATE_NIGHT);
      });
    });

    describe('EARLY_MORNING — 05:00 to 08:59', () => {
      it('returns early_morning for hour 5 (lower boundary)', () => {
        expect(getTimeOfDay(makeDate(5))).toBe(TIME_OF_DAY.EARLY_MORNING);
      });

      it('returns early_morning for hour 6', () => {
        expect(getTimeOfDay(makeDate(6))).toBe(TIME_OF_DAY.EARLY_MORNING);
      });

      it('returns early_morning for hour 8 (upper boundary, last hour before morning)', () => {
        expect(getTimeOfDay(makeDate(8))).toBe(TIME_OF_DAY.EARLY_MORNING);
      });
    });

    describe('MORNING — 09:00 to 11:59', () => {
      it('returns morning for hour 9 (lower boundary)', () => {
        expect(getTimeOfDay(makeDate(9))).toBe(TIME_OF_DAY.MORNING);
      });

      it('returns morning for hour 10', () => {
        expect(getTimeOfDay(makeDate(10))).toBe(TIME_OF_DAY.MORNING);
      });

      it('returns morning for hour 11 (upper boundary, last hour before afternoon)', () => {
        expect(getTimeOfDay(makeDate(11))).toBe(TIME_OF_DAY.MORNING);
      });
    });

    describe('AFTERNOON — 12:00 to 16:59', () => {
      it('returns afternoon for hour 12 (lower boundary)', () => {
        expect(getTimeOfDay(makeDate(12))).toBe(TIME_OF_DAY.AFTERNOON);
      });

      it('returns afternoon for hour 14', () => {
        expect(getTimeOfDay(makeDate(14))).toBe(TIME_OF_DAY.AFTERNOON);
      });

      it('returns afternoon for hour 16 (upper boundary, last hour before evening)', () => {
        expect(getTimeOfDay(makeDate(16))).toBe(TIME_OF_DAY.AFTERNOON);
      });
    });

    describe('EVENING — 17:00 to 20:59', () => {
      it('returns evening for hour 17 (lower boundary)', () => {
        expect(getTimeOfDay(makeDate(17))).toBe(TIME_OF_DAY.EVENING);
      });

      it('returns evening for hour 19', () => {
        expect(getTimeOfDay(makeDate(19))).toBe(TIME_OF_DAY.EVENING);
      });

      it('returns evening for hour 20 (upper boundary, last hour before night)', () => {
        expect(getTimeOfDay(makeDate(20))).toBe(TIME_OF_DAY.EVENING);
      });
    });

    describe('NIGHT — 21:00 to 23:59', () => {
      it('returns night for hour 21 (lower boundary)', () => {
        expect(getTimeOfDay(makeDate(21))).toBe(TIME_OF_DAY.NIGHT);
      });

      it('returns night for hour 22', () => {
        expect(getTimeOfDay(makeDate(22))).toBe(TIME_OF_DAY.NIGHT);
      });

      it('returns night for hour 23 (upper boundary)', () => {
        expect(getTimeOfDay(makeDate(23))).toBe(TIME_OF_DAY.NIGHT);
      });
    });

    it('uses the current time when called with no argument', () => {
      const result = getTimeOfDay();
      expect(Object.values(TIME_OF_DAY)).toContain(result);
    });

    it('returns a valid TIME_OF_DAY value for every possible hour (0-23)', () => {
      const validValues = Object.values(TIME_OF_DAY);
      for (let hour = 0; hour <= 23; hour++) {
        expect(validValues).toContain(getTimeOfDay(makeDate(hour)));
      }
    });

    describe('exact boundary transitions', () => {
      it('hour 4 → LATE_NIGHT, hour 5 → EARLY_MORNING', () => {
        expect(getTimeOfDay(makeDate(4))).toBe(TIME_OF_DAY.LATE_NIGHT);
        expect(getTimeOfDay(makeDate(5))).toBe(TIME_OF_DAY.EARLY_MORNING);
      });

      it('hour 8 → EARLY_MORNING, hour 9 → MORNING', () => {
        expect(getTimeOfDay(makeDate(8))).toBe(TIME_OF_DAY.EARLY_MORNING);
        expect(getTimeOfDay(makeDate(9))).toBe(TIME_OF_DAY.MORNING);
      });

      it('hour 11 → MORNING, hour 12 → AFTERNOON', () => {
        expect(getTimeOfDay(makeDate(11))).toBe(TIME_OF_DAY.MORNING);
        expect(getTimeOfDay(makeDate(12))).toBe(TIME_OF_DAY.AFTERNOON);
      });

      it('hour 16 → AFTERNOON, hour 17 → EVENING', () => {
        expect(getTimeOfDay(makeDate(16))).toBe(TIME_OF_DAY.AFTERNOON);
        expect(getTimeOfDay(makeDate(17))).toBe(TIME_OF_DAY.EVENING);
      });

      it('hour 20 → EVENING, hour 21 → NIGHT', () => {
        expect(getTimeOfDay(makeDate(20))).toBe(TIME_OF_DAY.EVENING);
        expect(getTimeOfDay(makeDate(21))).toBe(TIME_OF_DAY.NIGHT);
      });
    });
  });

  // ─── buildEventBase ─────────────────────────────────────────────────────────

  describe('buildEventBase', () => {
    const FIXED_DATE = new Date('2024-01-15T14:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(FIXED_DATE);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns an object that contains all required fields', () => {
      const event = buildEventBase(EVENT_TYPES.URGE_LOGGED, 7);
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets type to the provided type argument', () => {
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 1).type).toBe(EVENT_TYPES.URGE_LOGGED);
      expect(buildEventBase(EVENT_TYPES.MOOD_CHECK, 1).type).toBe(EVENT_TYPES.MOOD_CHECK);
      expect(buildEventBase(EVENT_TYPES.CHAT_MESSAGE, 1).type).toBe(EVENT_TYPES.CHAT_MESSAGE);
    });

    it('timestamp is a valid ISO 8601 string', () => {
      const { timestamp } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(typeof timestamp).toBe('string');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('timestamp round-trips through new Date() without loss', () => {
      const { timestamp } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('timestamp matches the mocked system time', () => {
      const { timestamp } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(timestamp).toBe(FIXED_DATE.toISOString());
    });

    it('timestampMs is a positive integer', () => {
      const { timestampMs } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(typeof timestampMs).toBe('number');
      expect(Number.isInteger(timestampMs)).toBe(true);
      expect(timestampMs).toBeGreaterThan(0);
    });

    it('timestampMs matches the mocked system time in milliseconds', () => {
      const { timestampMs } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(timestampMs).toBe(FIXED_DATE.getTime());
    });

    it('timestamp and timestampMs represent the same point in time', () => {
      const event = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(new Date(event.timestamp).getTime()).toBe(event.timestampMs);
    });

    it('sets dayNumber to the provided argument', () => {
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 1).dayNumber).toBe(1);
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 14).dayNumber).toBe(14);
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 30).dayNumber).toBe(30);
    });

    it('defaults dayNumber to 0 when argument is falsy', () => {
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, undefined).dayNumber).toBe(0);
      expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 0).dayNumber).toBe(0);
    });

    it('timeOfDay is a valid TIME_OF_DAY value', () => {
      const { timeOfDay } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(Object.values(TIME_OF_DAY)).toContain(timeOfDay);
    });

    it('weekDay is a valid WEEK_DAYS entry', () => {
      const { weekDay } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(WEEK_DAYS).toContain(weekDay);
    });

    it('weekDay corresponds to the day of week of the current system time', () => {
      const { weekDay } = buildEventBase(EVENT_TYPES.URGE_LOGGED, 1);
      expect(weekDay).toBe(WEEK_DAYS[FIXED_DATE.getDay()]);
    });

    describe('weekNumber — Math.ceil(dayNumber / 7)', () => {
      it('day 1 → week 1', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 1).weekNumber).toBe(1);
      });

      it('day 7 → week 1 (last day of first week)', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 7).weekNumber).toBe(1);
      });

      it('day 8 → week 2 (first day of second week)', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 8).weekNumber).toBe(2);
      });

      it('day 14 → week 2', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 14).weekNumber).toBe(2);
      });

      it('day 15 → week 3', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 15).weekNumber).toBe(3);
      });

      it('day 21 → week 3', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 21).weekNumber).toBe(3);
      });

      it('day 0 (falsy) uses dayNumber || 1 so weekNumber is 1', () => {
        expect(buildEventBase(EVENT_TYPES.URGE_LOGGED, 0).weekNumber).toBe(1);
      });
    });
  });

  // ─── buildUrgeEvent ─────────────────────────────────────────────────────────

  describe('buildUrgeEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T14:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const fullUrgeData = {
      emotion:     'stress',
      trigger:     'work_deadline',
      intensity:   URGE_INTENSITY.HIGH,
      note:        'Really struggling today',
      currentMood: 'anxious',
      dayNumber:   7,
      steps:       3500,
    };

    it('sets the event type to URGE_LOGGED', () => {
      expect(buildUrgeEvent(fullUrgeData).type).toBe(EVENT_TYPES.URGE_LOGGED);
    });

    it('includes all base event fields inherited from buildEventBase', () => {
      const event = buildUrgeEvent(fullUrgeData);
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets emotion from urgeData.emotion', () => {
      expect(buildUrgeEvent(fullUrgeData).emotion).toBe('stress');
    });

    it('emotion is null when urgeData.emotion is not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, emotion: undefined }).emotion).toBeNull();
    });

    it('sets trigger from urgeData.trigger', () => {
      expect(buildUrgeEvent(fullUrgeData).trigger).toBe('work_deadline');
    });

    it('trigger is null when urgeData.trigger is not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, trigger: undefined }).trigger).toBeNull();
    });

    it('sets intensity from urgeData.intensity', () => {
      expect(buildUrgeEvent(fullUrgeData).intensity).toBe(URGE_INTENSITY.HIGH);
    });

    it('defaults intensity to URGE_INTENSITY.MEDIUM when not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, intensity: undefined }).intensity).toBe(URGE_INTENSITY.MEDIUM);
    });

    it('sets moodAtTime from urgeData.currentMood', () => {
      expect(buildUrgeEvent(fullUrgeData).moodAtTime).toBe('anxious');
    });

    it('moodAtTime is null when currentMood is not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, currentMood: undefined }).moodAtTime).toBeNull();
    });

    it('sets moodScore via MOOD_VALUES lookup on currentMood', () => {
      expect(buildUrgeEvent(fullUrgeData).moodScore).toBe(MOOD_VALUES.anxious); // 2
    });

    it('moodScore is null for an unrecognised currentMood string', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, currentMood: 'unknown_mood' }).moodScore).toBeNull();
    });

    it('moodScore is null when currentMood is not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, currentMood: undefined }).moodScore).toBeNull();
    });

    it('produces the correct moodScore for every valid MOOD_VALUES key', () => {
      Object.entries(MOOD_VALUES).forEach(([mood, expectedScore]) => {
        const event = buildUrgeEvent({ ...fullUrgeData, currentMood: mood });
        expect(event.moodScore).toBe(expectedScore);
      });
    });

    it('weekNumber is calculated correctly from dayNumber', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, dayNumber: 7 }).weekNumber).toBe(1);
      expect(buildUrgeEvent({ ...fullUrgeData, dayNumber: 8 }).weekNumber).toBe(2);
    });

    it('outcome is always URGE_OUTCOME.PENDING (null) on initial creation', () => {
      const event = buildUrgeEvent(fullUrgeData);
      expect(event.outcome).toBe(URGE_OUTCOME.PENDING);
      expect(event.outcome).toBeNull();
    });

    it('sets stepsAtTime from urgeData.steps', () => {
      expect(buildUrgeEvent(fullUrgeData).stepsAtTime).toBe(3500);
    });

    it('stepsAtTime is null when steps is not provided', () => {
      expect(buildUrgeEvent({ ...fullUrgeData, steps: undefined }).stepsAtTime).toBeNull();
    });

    it('all optional fields default to null when only dayNumber is provided', () => {
      const event = buildUrgeEvent({ dayNumber: 1 });
      expect(event.emotion).toBeNull();
      expect(event.trigger).toBeNull();
      expect(event.note).toBeNull();
      expect(event.moodAtTime).toBeNull();
      expect(event.moodScore).toBeNull();
      expect(event.stepsAtTime).toBeNull();
    });
  });

  // ─── buildMoodEvent ─────────────────────────────────────────────────────────

  describe('buildMoodEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T09:30:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const fullMoodData = {
      mood:      'calm',
      source:    'checkin',
      dayNumber: 3,
    };

    it('sets the event type to MOOD_CHECK', () => {
      expect(buildMoodEvent(fullMoodData).type).toBe(EVENT_TYPES.MOOD_CHECK);
    });

    it('includes all base event fields inherited from buildEventBase', () => {
      const event = buildMoodEvent(fullMoodData);
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets mood from moodData.mood', () => {
      expect(buildMoodEvent(fullMoodData).mood).toBe('calm');
    });

    it('sets moodScore via MOOD_VALUES lookup', () => {
      expect(buildMoodEvent(fullMoodData).moodScore).toBe(MOOD_VALUES.calm); // 7
    });

    it('moodScore is null for an unrecognised mood string', () => {
      expect(buildMoodEvent({ ...fullMoodData, mood: 'ecstatic' }).moodScore).toBeNull();
    });

    it('produces the correct moodScore for every valid MOOD_VALUES key', () => {
      Object.entries(MOOD_VALUES).forEach(([mood, expectedScore]) => {
        expect(buildMoodEvent({ mood, dayNumber: 1 }).moodScore).toBe(expectedScore);
      });
    });

    it('sets source from moodData.source', () => {
      expect(buildMoodEvent(fullMoodData).source).toBe('checkin');
    });

    it('accepts "chat" as a valid source value', () => {
      expect(buildMoodEvent({ ...fullMoodData, source: 'chat' }).source).toBe('chat');
    });

    it('defaults source to "checkin" when source is not provided', () => {
      expect(buildMoodEvent({ mood: 'good', dayNumber: 1 }).source).toBe('checkin');
    });
  });

  // ─── buildTaskEvent ─────────────────────────────────────────────────────────

  describe('buildTaskEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T18:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const fullTaskData = {
      taskName:    'Morning meditation',
      isAdaptive:  true,
      currentMood: 'good',
      dayNumber:   10,
    };

    it('sets the event type to TASK_COMPLETED', () => {
      expect(buildTaskEvent(fullTaskData).type).toBe(EVENT_TYPES.TASK_COMPLETED);
    });

    it('includes all base event fields inherited from buildEventBase', () => {
      const event = buildTaskEvent(fullTaskData);
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets taskName from taskData.taskName', () => {
      expect(buildTaskEvent(fullTaskData).taskName).toBe('Morning meditation');
    });

    it('sets isAdaptive to true when provided as true', () => {
      expect(buildTaskEvent(fullTaskData).isAdaptive).toBe(true);
    });

    it('sets isAdaptive to false when provided as false', () => {
      expect(buildTaskEvent({ ...fullTaskData, isAdaptive: false }).isAdaptive).toBe(false);
    });

    it('defaults isAdaptive to false when not provided', () => {
      expect(buildTaskEvent({ ...fullTaskData, isAdaptive: undefined }).isAdaptive).toBe(false);
    });

    it('sets mood from taskData.currentMood', () => {
      expect(buildTaskEvent(fullTaskData).mood).toBe('good');
    });

    it('mood is null when currentMood is not provided', () => {
      expect(buildTaskEvent({ ...fullTaskData, currentMood: undefined }).mood).toBeNull();
    });
  });

  // ─── buildStepsEvent ────────────────────────────────────────────────────────

  describe('buildStepsEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T20:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const fullStepsData = {
      steps:     8000,
      goal:      10000,
      dayNumber: 5,
    };

    it('sets the event type to STEPS_GOAL_MET', () => {
      expect(buildStepsEvent(fullStepsData).type).toBe(EVENT_TYPES.STEPS_GOAL_MET);
    });

    it('includes all base event fields inherited from buildEventBase', () => {
      const event = buildStepsEvent(fullStepsData);
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets steps from stepsData.steps', () => {
      expect(buildStepsEvent(fullStepsData).steps).toBe(8000);
    });

    it('sets goal from stepsData.goal', () => {
      expect(buildStepsEvent(fullStepsData).goal).toBe(10000);
    });

    describe('pctOfGoal — Math.round(steps / goal * 100)', () => {
      it('calculates 80% for 8000 of 10000 steps', () => {
        expect(buildStepsEvent({ steps: 8000, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(80);
      });

      it('calculates exactly 100% when steps equals goal', () => {
        expect(buildStepsEvent({ steps: 10000, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(100);
      });

      it('calculates 50% for 5000 of 10000 steps', () => {
        expect(buildStepsEvent({ steps: 5000, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(50);
      });

      it('rounds down a fractional percentage (3333 / 10000 = 33.33 → 33)', () => {
        expect(buildStepsEvent({ steps: 3333, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(33);
      });

      it('rounds up at ≥ .5 boundary (3350 / 10000 = 33.5 → 34)', () => {
        expect(buildStepsEvent({ steps: 3350, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(34);
      });

      it('exceeds 100 when steps surpass the goal', () => {
        expect(buildStepsEvent({ steps: 12000, goal: 10000, dayNumber: 1 }).pctOfGoal).toBe(120);
      });

      it('pctOfGoal is always an integer', () => {
        expect(Number.isInteger(buildStepsEvent(fullStepsData).pctOfGoal)).toBe(true);
      });
    });
  });

  // ─── buildChatEvent ─────────────────────────────────────────────────────────

  describe('buildChatEvent', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T22:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const fullChatData = {
      role:        'user',
      content:     'I am feeling really good today!',
      currentMood: 'good',
      dayNumber:   21,
    };

    it('sets the event type to CHAT_MESSAGE', () => {
      expect(buildChatEvent(fullChatData).type).toBe(EVENT_TYPES.CHAT_MESSAGE);
    });

    it('includes all base event fields inherited from buildEventBase', () => {
      const event = buildChatEvent(fullChatData);
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('timestampMs');
      expect(event).toHaveProperty('dayNumber');
      expect(event).toHaveProperty('timeOfDay');
      expect(event).toHaveProperty('weekDay');
      expect(event).toHaveProperty('weekNumber');
    });

    it('sets role to "user"', () => {
      expect(buildChatEvent(fullChatData).role).toBe('user');
    });

    it('sets role to "assistant"', () => {
      expect(buildChatEvent({ ...fullChatData, role: 'assistant' }).role).toBe('assistant');
    });

    it('sets content from chatData.content', () => {
      expect(buildChatEvent(fullChatData).content).toBe('I am feeling really good today!');
    });

    it('sets mood from chatData.currentMood', () => {
      expect(buildChatEvent(fullChatData).mood).toBe('good');
    });

    it('mood is null when currentMood is not provided', () => {
      expect(buildChatEvent({ ...fullChatData, currentMood: undefined }).mood).toBeNull();
    });
  });

  // ─── intensityToScore ───────────────────────────────────────────────────────

  describe('intensityToScore', () => {
    it('returns 1 for "low"', () => {
      expect(intensityToScore('low')).toBe(1);
    });

    it('returns 2 for "medium"', () => {
      expect(intensityToScore('medium')).toBe(2);
    });

    it('returns 3 for "high"', () => {
      expect(intensityToScore('high')).toBe(3);
    });

    it('maps every URGE_INTENSITY constant to its correct score', () => {
      expect(intensityToScore(URGE_INTENSITY.LOW)).toBe(1);
      expect(intensityToScore(URGE_INTENSITY.MEDIUM)).toBe(2);
      expect(intensityToScore(URGE_INTENSITY.HIGH)).toBe(3);
    });

    it('returns 0 for an unrecognised string', () => {
      expect(intensityToScore('extreme')).toBe(0);
      expect(intensityToScore('critical')).toBe(0);
    });

    it('returns 0 for undefined', () => {
      expect(intensityToScore(undefined)).toBe(0);
    });

    it('returns 0 for null', () => {
      expect(intensityToScore(null)).toBe(0);
    });

    it('returns 0 for an empty string', () => {
      expect(intensityToScore('')).toBe(0);
    });

    it('is case-sensitive — uppercase variants return 0', () => {
      expect(intensityToScore('LOW')).toBe(0);
      expect(intensityToScore('MEDIUM')).toBe(0);
      expect(intensityToScore('HIGH')).toBe(0);
    });
  });

  // ─── urgeToFeatures ─────────────────────────────────────────────────────────

  describe('urgeToFeatures', () => {
    // Use a local-time constructor so getHours() is timezone-independent in tests
    // new Date(2024, 0, 15, 14, 0, 0) → Monday Jan 15 2024 at 14:00 local time
    const LOCAL_2PM_MONDAY = new Date(2024, 0, 15, 14, 0, 0);
    const LOCAL_TIMESTAMP  = LOCAL_2PM_MONDAY.toISOString();

    const baseUrgeEvent = {
      timestamp:   LOCAL_TIMESTAMP,
      weekDay:     'monday',
      weekNumber:  2,
      timeOfDay:   TIME_OF_DAY.AFTERNOON,
      intensity:   URGE_INTENSITY.HIGH,
      moodScore:   6,
      stepsAtTime: 5000,
      outcome:     URGE_OUTCOME.RESISTED,
    };

    describe('feature vector shape', () => {
      it('returns an object with all required ML feature fields', () => {
        const features = urgeToFeatures(baseUrgeEvent);
        expect(features).toHaveProperty('hour');
        expect(features).toHaveProperty('dayOfWeek');
        expect(features).toHaveProperty('weekNumber');
        expect(features).toHaveProperty('timeOfDay');
        expect(features).toHaveProperty('intensityScore');
        expect(features).toHaveProperty('moodScore');
        expect(features).toHaveProperty('stepsAtTime');
        expect(features).toHaveProperty('resisted');
      });

      it('has exactly 8 feature fields', () => {
        expect(Object.keys(urgeToFeatures(baseUrgeEvent))).toHaveLength(8);
      });

      it('all feature values are numbers', () => {
        Object.values(urgeToFeatures(baseUrgeEvent)).forEach((value) => {
          expect(typeof value).toBe('number');
        });
      });
    });

    describe('temporal features', () => {
      it('hour is extracted from the ISO timestamp via new Date().getHours()', () => {
        const features = urgeToFeatures(baseUrgeEvent);
        expect(features.hour).toBe(new Date(LOCAL_TIMESTAMP).getHours());
      });

      it('hour is 14 for a 14:00 local time timestamp', () => {
        expect(urgeToFeatures(baseUrgeEvent).hour).toBe(14);
      });

      it('dayOfWeek is 1 for "monday"', () => {
        expect(urgeToFeatures(baseUrgeEvent).dayOfWeek).toBe(1);
      });

      it('dayOfWeek is 0 for "sunday"', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, weekDay: 'sunday' }).dayOfWeek).toBe(0);
      });

      it('dayOfWeek is 6 for "saturday"', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, weekDay: 'saturday' }).dayOfWeek).toBe(6);
      });

      it('dayOfWeek matches WEEK_DAYS.indexOf for every day of the week', () => {
        WEEK_DAYS.forEach((day, index) => {
          expect(urgeToFeatures({ ...baseUrgeEvent, weekDay: day }).dayOfWeek).toBe(index);
        });
      });

      it('weekNumber is taken directly from the event', () => {
        expect(urgeToFeatures(baseUrgeEvent).weekNumber).toBe(2);
        expect(urgeToFeatures({ ...baseUrgeEvent, weekNumber: 5 }).weekNumber).toBe(5);
      });

      it('timeOfDay is the index of the value within Object.values(TIME_OF_DAY)', () => {
        const timeOfDayValues = Object.values(TIME_OF_DAY);
        Object.values(TIME_OF_DAY).forEach((tod) => {
          const features = urgeToFeatures({ ...baseUrgeEvent, timeOfDay: tod });
          expect(features.timeOfDay).toBe(timeOfDayValues.indexOf(tod));
        });
      });

      it('timeOfDay is a non-negative integer', () => {
        const { timeOfDay } = urgeToFeatures(baseUrgeEvent);
        expect(timeOfDay).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(timeOfDay)).toBe(true);
      });
    });

    describe('urge features', () => {
      it('intensityScore is 3 for URGE_INTENSITY.HIGH', () => {
        expect(urgeToFeatures(baseUrgeEvent).intensityScore).toBe(3);
      });

      it('intensityScore is 2 for URGE_INTENSITY.MEDIUM', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, intensity: URGE_INTENSITY.MEDIUM }).intensityScore).toBe(2);
      });

      it('intensityScore is 1 for URGE_INTENSITY.LOW', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, intensity: URGE_INTENSITY.LOW }).intensityScore).toBe(1);
      });

      it('intensityScore is 0 for an unrecognised intensity value', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, intensity: 'unknown' }).intensityScore).toBe(0);
      });

      it('moodScore is taken directly from the event', () => {
        expect(urgeToFeatures(baseUrgeEvent).moodScore).toBe(6);
      });

      it('moodScore defaults to 0 when event.moodScore is null', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, moodScore: null }).moodScore).toBe(0);
      });

      it('moodScore defaults to 0 when event.moodScore is undefined', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, moodScore: undefined }).moodScore).toBe(0);
      });

      it('stepsAtTime is taken directly from the event', () => {
        expect(urgeToFeatures(baseUrgeEvent).stepsAtTime).toBe(5000);
      });

      it('stepsAtTime defaults to 0 when event.stepsAtTime is null', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, stepsAtTime: null }).stepsAtTime).toBe(0);
      });

      it('stepsAtTime defaults to 0 when event.stepsAtTime is undefined', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, stepsAtTime: undefined }).stepsAtTime).toBe(0);
      });
    });

    describe('outcome label (supervised learning target: resisted)', () => {
      it('resisted is 1 when outcome is URGE_OUTCOME.RESISTED', () => {
        expect(urgeToFeatures(baseUrgeEvent).resisted).toBe(1);
      });

      it('resisted is 0 when outcome is URGE_OUTCOME.SLIPPED', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, outcome: URGE_OUTCOME.SLIPPED }).resisted).toBe(0);
      });

      it('resisted is 0 when outcome is URGE_OUTCOME.PENDING (null)', () => {
        expect(urgeToFeatures({ ...baseUrgeEvent, outcome: URGE_OUTCOME.PENDING }).resisted).toBe(0);
      });

      it('resisted is 0 for any non-RESISTED outcome', () => {
        [null, undefined, 'unknown', '', 'slipped'].forEach((outcome) => {
          expect(urgeToFeatures({ ...baseUrgeEvent, outcome }).resisted).toBe(0);
        });
      });
    });
  });
});
