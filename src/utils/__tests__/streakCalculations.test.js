// src/utils/__tests__/streakCalculations.test.js
import {
  getCurrentDay,
  getRampThreshold,
  generatePicksForDay,
  getAdherence,
  evaluateStreakProgress,
  checkStreakMilestones,
  checkMissedDays,
} from '../streakCalculations';

describe('streakCalculations', () => {
  describe('getCurrentDay', () => {
    it('should return 1 for the start date', () => {
      const today = new Date();
      const startDate = today.toISOString();
      expect(getCurrentDay(startDate, 0)).toBe(1);
    });

    it('should return 2 for day after start date', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = yesterday.toISOString();
      expect(getCurrentDay(startDate, 0)).toBe(2);
    });

    it('should return 30 for 29 days after start', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      expect(getCurrentDay(startDate.toISOString(), 0)).toBe(30);
    });

    it('should handle devDayOffset correctly', () => {
      const today = new Date();
      const startDate = today.toISOString();
      expect(getCurrentDay(startDate, 5)).toBe(6); // 1 + 5 offset
    });

    it('should never return less than 1', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      expect(getCurrentDay(future.toISOString(), 0)).toBe(1);
    });
  });

  describe('getRampThreshold', () => {
    it('should return 0.5 for days 1-7 (Week 1)', () => {
      expect(getRampThreshold(1)).toBe(0.5);
      expect(getRampThreshold(7)).toBe(0.5);
    });

    it('should return 0.6 for days 8-14 (Week 2)', () => {
      expect(getRampThreshold(8)).toBe(0.6);
      expect(getRampThreshold(14)).toBe(0.6);
    });

    it('should return 0.65 for days 15-21 (Week 3)', () => {
      expect(getRampThreshold(15)).toBe(0.65);
      expect(getRampThreshold(21)).toBe(0.65);
    });

    it('should return 0.7 for days 22-30 (Week 4)', () => {
      expect(getRampThreshold(22)).toBe(0.7);
      expect(getRampThreshold(30)).toBe(0.7);
    });

    it('should return 0.6 for maintenance days (>30)', () => {
      expect(getRampThreshold(31)).toBe(0.6);
      expect(getRampThreshold(60)).toBe(0.6);
      expect(getRampThreshold(100)).toBe(0.6);
    });
  });

  describe('generatePicksForDay', () => {
    it('should return existing picks if available', () => {
      const todayPicks = {
        5: ['Task A', 'Task B', 'Task C'],
      };
      expect(generatePicksForDay(5, todayPicks)).toEqual(['Task A', 'Task B', 'Task C']);
    });

    it('should return maintenance rotation for day 31', () => {
      const picks = generatePicksForDay(31, {});
      expect(picks).toEqual

(['10-min walk', '5-min breathing', 'Plan tomorrow 3-min', 'Text a friend']);
    });

    it('should cycle through maintenance rotations correctly', () => {
      const rotation1 = generatePicksForDay(31, {});
      const rotation2 = generatePicksForDay(32, {});
      const rotation3 = generatePicksForDay(33, {});
      const rotation4 = generatePicksForDay(34, {}); // Should loop back to rotation1

      expect(rotation1).not.toEqual(rotation2);
      expect(rotation2).not.toEqual(rotation3);
      expect(rotation3).not.toEqual(rotation1);
      expect(rotation4).toEqual(rotation1);
    });

    it('should use most recent prior day picks as fallback', () => {
      const todayPicks = {
        3: ['Prior Task 1', 'Prior Task 2'],
        4: ['More Recent Task'],
      };
      const picks = generatePicksForDay(5, todayPicks);
      expect(picks).toEqual(['More Recent Task']);
    });

    it('should use default fallback if no prior picks exist', () => {
      const picks = generatePicksForDay(10, {});
      expect(picks).toEqual(['5 min breathing', 'Stretch 2 min', '2-min tidy']);
    });
  });

  describe('getAdherence', () => {
    it('should return 1.0 for perfect adherence', () => {
      const todayPicks = { 7: ['Task A', 'Task B', 'Task C'] };
      const todayCompletions = { 7: { 'Task A': true, 'Task B': true, 'Task C': true } };
      expect(getAdherence(7, todayPicks, todayCompletions, 1)).toBe(1);
    });

    it('should return 0.5 for 50% adherence', () => {
      const todayPicks = { 7: ['Task A', 'Task B'] };
      const todayCompletions = { 7: { 'Task A': true, 'Task B': false } };
      expect(getAdherence(7, todayPicks, todayCompletions, 1)).toBe(0.5);
    });

    it('should return 0 for zero adherence', () => {
      const todayPicks = { 7: ['Task A', 'Task B'] };
      const todayCompletions = { 7: { 'Task A': false, 'Task B': false } };
      expect(getAdherence(7, todayPicks, todayCompletions, 1)).toBe(0);
    });

    it('should calculate adherence across multiple days', () => {
      const todayPicks = {
        5: ['A', 'B'],
        6: ['C', 'D'],
        7: ['E', 'F'],
      };
      const todayCompletions = {
        5: { 'A': true, 'B': true },   // 2/2
        6: { 'C': true, 'D': false },  // 1/2
        7: { 'E': false, 'F': false }, // 0/2
      };
      // Total: 3 done out of 6 assigned = 0.5
      expect(getAdherence(7, todayPicks, todayCompletions, 3)).toBe(0.5);
    });

    it('should return 0 when no tasks assigned', () => {
      expect(getAdherence(7, {}, {}, 3)).toBe(0);
    });

    it('should handle missing completion data gracefully', () => {
      const todayPicks = { 7: ['Task A', 'Task B'] };
      const todayCompletions = {};
      expect(getAdherence(7, todayPicks, todayCompletions, 1)).toBe(0);
    });
  });

  describe('evaluateStreakProgress', () => {
    it('should advance streak on day 1 with 1 task complete (onboarding leniency)', () => {
      const result = evaluateStreakProgress({
        dayNumber: 1,
        completionsState: { 1: { 'Task A': true } },
        streak: 0,
        todayPicks: { 1: ['Task A', 'Task B', 'Task C'] },
        streakEvaluatedForDay: 0,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      expect(result.streakAdvanced).toBe(true);
      expect(result.newStreak).toBe(1);
      expect(result.message).toContain('strong start');
    });

    it('should advance streak on day 2 with 1 task complete (onboarding leniency)', () => {
      const result = evaluateStreakProgress({
        dayNumber: 2,
        completionsState: { 2: { 'Task A': true } },
        streak: 1,
        todayPicks: { 2: ['Task A', 'Task B', 'Task C', 'Task D', 'Task E'] },
        streakEvaluatedForDay: 1,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      expect(result.streakAdvanced).toBe(true);
      expect(result.newStreak).toBe(2);
    });

    it('should advance streak when meeting threshold on day 8', () => {
      const result = evaluateStreakProgress({
        dayNumber: 8,
        completionsState: { 8: { 'A': true, 'B': true, 'C': true, 'D': true } },
        streak: 7,
        todayPicks: { 8: ['A', 'B', 'C', 'D', 'E', 'F'] }, // 6 tasks
        streakEvaluatedForDay: 7,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      // Day 8: threshold is 0.6, need 4/6 = 0.667 > 0.6
      expect(result.streakAdvanced).toBe(true);
      expect(result.newStreak).toBe(8);
      expect(result.message).toContain('consistency is compounding');
    });

    it('should not advance streak when below threshold', () => {
      const result = evaluateStreakProgress({
        dayNumber: 8,
        completionsState: { 8: { 'A': true } },
        streak: 7,
        todayPicks: { 8: ['A', 'B', 'C', 'D', 'E', 'F'] }, // 6 tasks, only 1 done
        streakEvaluatedForDay: 7,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      // Day 8: threshold is 0.6, got 1/6 = 0.167 < 0.6
      expect(result.streakAdvanced).toBe(false);
    });

    it('should provide guidance message when 30%-60% complete', () => {
      const result = evaluateStreakProgress({
        dayNumber: 8,
        completionsState: { 8: { 'A': true, 'B': true } },
        streak: 7,
        todayPicks: { 8: ['A', 'B', 'C', 'D', 'E', 'F'] }, // 2/6 = 0.33
        streakEvaluatedForDay: 7,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      expect(result.streakAdvanced).toBe(false);
      expect(result.guidance).toBe(true);
      expect(result.message).toContain('more task');
    });

    it('should provide warning message when below 30% complete', () => {
      const result = evaluateStreakProgress({
        dayNumber: 8,
        completionsState: { 8: {} },
        streak: 7,
        todayPicks: { 8: ['A', 'B', 'C', 'D', 'E', 'F'] }, // 0/6 = 0
        streakEvaluatedForDay: 7,
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      expect(result.streakAdvanced).toBe(false);
      expect(result.warning).toBe(true);
      expect(result.message).toContain('Low progress');
    });

    it('should return alreadyEvaluated if day already counted', () => {
      const result = evaluateStreakProgress({
        dayNumber: 8,
        completionsState: { 8: { 'A': true, 'B': true, 'C': true, 'D': true } },
        streak: 8,
        todayPicks: { 8: ['A', 'B', 'C', 'D', 'E', 'F'] },
        streakEvaluatedForDay: 8, // Already evaluated
        rolloverBannerDismissedDay: 0,
        graceDayDates: [],
      });

      expect(result.alreadyEvaluated).toBe(true);
    });
  });

  describe('checkStreakMilestones', () => {
    it('should detect 7-day milestone', () => {
      const result = checkStreakMilestones(7, 6);
      expect(result.shouldBump).toBe(true);
      expect(result.milestones).toContain('streak_7');
    });

    it('should detect 30-day milestone', () => {
      const result = checkStreakMilestones(30, 29);
      expect(result.shouldBump).toBe(true);
      expect(result.milestones).toContain('streak_30');
    });

    it('should detect 90-day milestone', () => {
      const result = checkStreakMilestones(90, 89);
      expect(result.shouldBump).toBe(true);
      expect(result.milestones).toContain('streak_90');
    });

    it('should not detect milestone if already passed', () => {
      const result = checkStreakMilestones(8, 7);
      expect(result.milestones).not.toContain('streak_7');
    });

    it('should detect only current milestone when jumping (edge case)', () => {
      // Edge case: jumping streaks (e.g., manual override) only detects the final milestone
      const result = checkStreakMilestones(30, 6);
      expect(result.milestones).toContain('streak_30');
      expect(result.milestones).not.toContain('streak_7'); // Won't detect passed milestone
    });

    it('should return shouldBump false when streak decreases', () => {
      const result = checkStreakMilestones(5, 10);
      expect(result.shouldBump).toBe(false);
    });

    it('should return shouldBump false when streak stays same', () => {
      const result = checkStreakMilestones(10, 10);
      expect(result.shouldBump).toBe(false);
    });
  });

  describe('checkMissedDays', () => {
    it('should detect 3 missed days when reopening app after gap', () => {
      const completionsState = {
        1: { 'A': true, 'B': true, 'C': true },
        2: { 'A': true, 'B': true, 'C': true },
        3: { 'A': true, 'B': true, 'C': true },
        4: { 'A': true, 'B': true, 'C': true },
        5: { 'A': true, 'B': true, 'C': true },
        6: { 'A': true, 'B': true, 'C': true },
        // Days 7-9: App not opened (missed)
        // Day 10: Current day (will be checked separately)
      };

      const result = checkMissedDays(10, 6, completionsState, {}, []);

      expect(result.missedDays).toEqual([7, 8, 9]);
      expect(result.shouldResetStreak).toBe(true); // 3 missed days > 2 grace limit
      expect(result.graceUsages.length).toBe(2); // Used 2 graces before hitting limit
    });

    it('should mark missed days even with partial completions below threshold', () => {
      const completionsState = {
        6: { 'A': true, 'B': true, 'C': true },
        7: { 'A': true }, // Only 1/5 = 20% < 50% threshold for day 7 (week 1)
        8: {}, // 0/6 = 0% < 60% for day 8 (week 2)
      };

      const todayPicks = {
        7: ['A', 'B', 'C', 'D', 'E'], // Day 7: 5 tasks
        8: ['A', 'B', 'C', 'D', 'E', 'F'], // Day 8: 6 tasks
      };

      const result = checkMissedDays(9, 6, completionsState, todayPicks, []);

      expect(result.missedDays).toEqual([7, 8]);
      expect(result.shouldResetStreak).toBe(false); // 2 missed days = exactly 2 grace limit
      expect(result.graceUsages.length).toBe(2);
      expect(result.graceUsages[0]).toEqual({ usedOnDay: 7, expiresOnDay: 14 });
      expect(result.graceUsages[1]).toEqual({ usedOnDay: 8, expiresOnDay: 15 });
    });

    it('should not count days as missed if they meet threshold', () => {
      const completionsState = {
        6: { 'A': true, 'B': true, 'C': true },
        7: { 'A': true, 'B': true, 'C': true, 'D': true }, // 4/6 = 66% > 60%
        8: { 'A': true, 'B': true, 'C': true, 'D': true }, // 4/6 = 66% > 60%
      };

      const result = checkMissedDays(9, 6, completionsState, {}, []);

      expect(result.missedDays).toEqual([]); // No missed days
      expect(result.shouldResetStreak).toBe(false);
      expect(result.graceUsages.length).toBe(0);
    });

    it('should trigger streak reset if missed days exceed available grace days', () => {
      const completionsState = {
        6: { 'A': true, 'B': true, 'C': true },
        // Days 7-11: 5 missed days (no completions)
      };

      const result = checkMissedDays(12, 6, completionsState, {}, []);

      expect(result.missedDays).toEqual([7, 8, 9, 10, 11]);
      expect(result.shouldResetStreak).toBe(true); // 5 missed days > 2 grace limit
      expect(result.graceUsages.length).toBe(2); // Used max 2 graces before reset
    });

    it('should apply onboarding leniency for days 1-2 in missed day check', () => {
      const completionsState = {
        1: { 'A': true }, // Only 1 task but should pass (onboarding)
        2: { 'A': true }, // Only 1 task but should pass (onboarding)
        // Day 3: missed (no completions, needs 50% threshold)
      };

      const result = checkMissedDays(4, 0, completionsState, {}, []);

      expect(result.missedDays).toEqual([3]); // Days 1-2 are OK, day 3 failed
      expect(result.shouldResetStreak).toBe(false); // 1 missed day < 2 grace limit
      expect(result.graceUsages.length).toBe(1);
    });

    it('should handle no missed days when threshold met every day', () => {
      const completionsState = {
        10: { 'A': true, 'B': true, 'C': true, 'D': true },
        11: { 'A': true, 'B': true, 'C': true, 'D': true },
        12: { 'A': true, 'B': true, 'C': true, 'D': true },
      };

      const result = checkMissedDays(13, 10, completionsState, {}, []);

      expect(result.missedDays).toEqual([]);
      expect(result.shouldResetStreak).toBe(false);
      expect(result.graceUsages.length).toBe(0);
    });

    it('should correctly handle rolling 7-day window with 1 grace already used', () => {
      const completionsState = {
        6: { 'A': true, 'B': true, 'C': true },
        // Day 7: missed
      };

      // 1 grace already used on day 3 (expires day 10)
      const existingGraces = [{ usedOnDay: 3, expiresOnDay: 10 }];

      const result = checkMissedDays(8, 6, completionsState, {}, existingGraces);

      expect(result.missedDays).toEqual([7]);
      expect(result.shouldResetStreak).toBe(false); // 1 existing + 1 new = 2 total (at limit)
      expect(result.graceUsages.length).toBe(2);
      expect(result.graceUsages[0]).toEqual({ usedOnDay: 3, expiresOnDay: 10 });
      expect(result.graceUsages[1]).toEqual({ usedOnDay: 7, expiresOnDay: 14 });
    });

    it('should expire old graces from rolling window', () => {
      const completionsState = {
        15: { 'A': true, 'B': true, 'C': true },
        // Day 16: missed
      };

      // Grace used on day 5 expires on day 12, should be expired by day 16
      const existingGraces = [{ usedOnDay: 5, expiresOnDay: 12 }];

      const result = checkMissedDays(17, 15, completionsState, {}, existingGraces);

      expect(result.missedDays).toEqual([16]);
      expect(result.shouldResetStreak).toBe(false);
      expect(result.graceUsages.length).toBe(1); // Old grace expired, new grace added
      expect(result.graceUsages[0]).toEqual({ usedOnDay: 16, expiresOnDay: 23 });
    });

    it('should reset streak when 2 active graces already in window', () => {
      const completionsState = {
        10: { 'A': true, 'B': true, 'C': true },
        // Day 11: missed (would be 3rd grace)
      };

      // 2 graces already used
      const existingGraces = [
        { usedOnDay: 7, expiresOnDay: 14 },
        { usedOnDay: 9, expiresOnDay: 16 },
      ];

      const result = checkMissedDays(12, 10, completionsState, {}, existingGraces);

      expect(result.missedDays).toEqual([11]);
      expect(result.shouldResetStreak).toBe(true); // 2 grace limit already reached
      expect(result.graceUsages.length).toBe(2); // Still only 2 active graces
    });
  });

  describe('evaluateStreakProgress with Missed Days', () => {
    it('should reset streak when missed days exceed grace days', () => {
      const result = evaluateStreakProgress({
        dayNumber: 10,
        completionsState: {
          1: { 'A': true, 'B': true, 'C': true },
          2: { 'A': true, 'B': true, 'C': true },
          3: { 'A': true, 'B': true, 'C': true },
          4: { 'A': true, 'B': true, 'C': true },
          5: { 'A': true, 'B': true, 'C': true },
          6: { 'A': true, 'B': true, 'C': true },
          // Days 7-9: missed (3 days, no completions)
        },
        streak: 6,
        todayPicks: {},
        streakEvaluatedForDay: 6,
        rolloverBannerDismissedDay: 0,
        graceUsages: [{ usedOnDay: 2, expiresOnDay: 9 }], // Already used 1 grace
      });

      expect(result.streakReset).toBe(true);
      expect(result.newStreak).toBe(0);
      expect(result.missedDays).toEqual([7, 8, 9]);
      expect(result.message).toContain('Streak reset');
      expect(result.message).toContain('3 missed days');
      expect(result.updates.graceUsages).toEqual([]);
    });

    it('should preserve streak when missed days within grace day allowance', () => {
      const result = evaluateStreakProgress({
        dayNumber: 9,
        completionsState: {
          1: { 'A': true, 'B': true, 'C': true },
          2: { 'A': true, 'B': true, 'C': true },
          3: { 'A': true, 'B': true, 'C': true },
          4: { 'A': true, 'B': true, 'C': true },
          5: { 'A': true, 'B': true, 'C': true },
          6: { 'A': true, 'B': true, 'C': true },
          // Days 7-8: missed (2 days)
          9: { 'A': true, 'B': true, 'C': true, 'D': true }, // Current day meets threshold
        },
        streak: 6,
        todayPicks: { 9: ['A', 'B', 'C', 'D', 'E', 'F'] },
        streakEvaluatedForDay: 6,
        rolloverBannerDismissedDay: 0,
        graceUsages: [], // No grace days used yet
      });

      // Should use grace days and continue streak
      expect(result.streakReset).toBeUndefined();
      expect(result.streakAdvanced).toBe(true);
      expect(result.newStreak).toBe(7);
      // Grace days used for days 7-8
      expect(result.updates.graceUsages.length).toBe(2);
      expect(result.updates.graceUsages[0]).toEqual({ usedOnDay: 7, expiresOnDay: 14 });
      expect(result.updates.graceUsages[1]).toEqual({ usedOnDay: 8, expiresOnDay: 15 });
    });

    it('should handle consecutive missed days after previous streak', () => {
      const result = evaluateStreakProgress({
        dayNumber: 31,
        completionsState: {
          // Days 1-20: completed successfully (streak 20)
          ...Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [
              i + 1,
              { 'A': true, 'B': true, 'C': true, 'D': true },
            ])
          ),
          // Days 21-30: app not opened (10 missed days)
        },
        streak: 20,
        todayPicks: {},
        streakEvaluatedForDay: 20,
        rolloverBannerDismissedDay: 0,
        graceUsages: [],
      });

      expect(result.streakReset).toBe(true);
      expect(result.newStreak).toBe(0);
      expect(result.missedDays.length).toBe(10);
      expect(result.message).toContain('10 missed days');
    });

    it('should not check missed days when evaluating consecutive day', () => {
      const result = evaluateStreakProgress({
        dayNumber: 7,
        completionsState: {
          6: { 'A': true, 'B': true, 'C': true },
          7: { 'A': true, 'B': true, 'C': true, 'D': true },
        },
        streak: 6,
        todayPicks: { 7: ['A', 'B', 'C', 'D', 'E', 'F'] },
        streakEvaluatedForDay: 6,
        rolloverBannerDismissedDay: 0,
        graceUsages: [],
      });

      // No missed days check, direct evaluation of day 7
      expect(result.streakAdvanced).toBe(true);
      expect(result.newStreak).toBe(7);
      expect(result.missedDays).toBeUndefined();
    });

    it('should handle edge case: exactly at grace day limit', () => {
      const result = evaluateStreakProgress({
        dayNumber: 9,
        completionsState: {
          6: { 'A': true, 'B': true, 'C': true },
          // Days 7-8: missed (exactly 2 days = grace limit)
          9: { 'A': true, 'B': true, 'C': true, 'D': true }, // Current day meets threshold
        },
        streak: 6,
        todayPicks: { 9: ['A', 'B', 'C', 'D', 'E', 'F'] },
        streakEvaluatedForDay: 6,
        rolloverBannerDismissedDay: 0,
        graceUsages: [],
      });

      // Should use all grace days but preserve streak
      expect(result.streakReset).toBeUndefined();
      expect(result.streakAdvanced).toBe(true);
      expect(result.updates.graceUsages.length).toBe(2);
      expect(result.updates.graceUsages[0]).toEqual({ usedOnDay: 7, expiresOnDay: 14 });
      expect(result.updates.graceUsages[1]).toEqual({ usedOnDay: 8, expiresOnDay: 15 });
    });
  });
});
