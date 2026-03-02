// src/utils/__tests__/timerUtils.test.js

import { parseTaskDuration, minutesToSeconds, secondsToMMSS, isTimerTask } from '../timerUtils';

describe('timerUtils', () => {
  describe('parseTaskDuration', () => {
    it('parses "X min" format', () => {
      const result = parseTaskDuration('Meditation 10 min');
      expect(result).toEqual({ duration: 10, unit: 'min' });
    });

    it('parses "X-Y min" range format', () => {
      const result = parseTaskDuration('Walk 10-15 min');
      expect(result).toEqual({ duration: 10, rangeEnd: 15, unit: 'min' });
    });

    it('parses "Xmin" without space', () => {
      const result = parseTaskDuration('Breathwork 5min');
      expect(result).toEqual({ duration: 5, unit: 'min' });
    });

    it('parses "X - Y min" with spaces around hyphen', () => {
      const result = parseTaskDuration('Study 20 - 25 min');
      expect(result).toEqual({ duration: 20, rangeEnd: 25, unit: 'min' });
    });

    it('parses full word "minutes"', () => {
      const result = parseTaskDuration('Yoga 15 minutes');
      expect(result).toEqual({ duration: 15, unit: 'min' });
    });

    it('parses "Xm" abbreviation', () => {
      const result = parseTaskDuration('Stretch 5m');
      expect(result).toEqual({ duration: 5, unit: 'min' });
    });

    it('returns null when no duration found', () => {
      expect(parseTaskDuration('Gratitude list')).toBeNull();
      expect(parseTaskDuration('Journal entry')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseTaskDuration(null)).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(parseTaskDuration(123)).toBeNull();
      expect(parseTaskDuration({})).toBeNull();
    });

    it('handles task names with duration at start', () => {
      const result = parseTaskDuration('10 min walk');
      expect(result).toEqual({ duration: 10, unit: 'min' });
    });

    it('matches time-relevant durations (e.g., "10 min" not "2 sets")', () => {
      const result = parseTaskDuration('Do 2 sets of 10 min yoga');
      // Matches "10 min" (the second number that's followed by "min")
      expect(result).toEqual({ duration: 10, unit: 'min' });
    });

    it('handles leading/trailing whitespace', () => {
      const result = parseTaskDuration('  Meditation 10 min  ');
      expect(result).toEqual({ duration: 10, unit: 'min' });
    });
  });

  describe('minutesToSeconds', () => {
    it('converts 1 minute to 60 seconds', () => {
      expect(minutesToSeconds(1)).toBe(60);
    });

    it('converts 10 minutes to 600 seconds', () => {
      expect(minutesToSeconds(10)).toBe(600);
    });

    it('converts 0.5 minutes to 30 seconds', () => {
      expect(minutesToSeconds(0.5)).toBe(30);
    });

    it('handles large values', () => {
      expect(minutesToSeconds(60)).toBe(3600);
    });
  });

  describe('secondsToMMSS', () => {
    it('formats 0 seconds as "00:00"', () => {
      expect(secondsToMMSS(0)).toBe('00:00');
    });

    it('formats 30 seconds as "00:30"', () => {
      expect(secondsToMMSS(30)).toBe('00:30');
    });

    it('formats 60 seconds as "01:00"', () => {
      expect(secondsToMMSS(60)).toBe('01:00');
    });

    it('formats 125 seconds as "02:05"', () => {
      expect(secondsToMMSS(125)).toBe('02:05');
    });

    it('formats 600 seconds as "10:00"', () => {
      expect(secondsToMMSS(600)).toBe('10:00');
    });

    it('formats 3661 seconds as "61:01"', () => {
      expect(secondsToMMSS(3661)).toBe('61:01');
    });

    it('pads single-digit values with leading zero', () => {
      expect(secondsToMMSS(65)).toBe('01:05');
      expect(secondsToMMSS(605)).toBe('10:05');
    });
  });

  describe('isTimerTask', () => {
    it('returns true for tasks with durations', () => {
      expect(isTimerTask('Meditation 10 min')).toBe(true);
      expect(isTimerTask('Walk 10-15 min')).toBe(true);
      expect(isTimerTask('5m yoga')).toBe(true);
    });

    it('returns false for tasks without durations', () => {
      expect(isTimerTask('Gratitude list')).toBe(false);
      expect(isTimerTask('Journal entry')).toBe(false);
      expect(isTimerTask('Write 1 fear + response')).toBe(false);
    });

    it('returns false for null or invalid input', () => {
      expect(isTimerTask(null)).toBe(false);
      expect(isTimerTask(undefined)).toBe(false);
      expect(isTimerTask(123)).toBe(false);
    });
  });
});
