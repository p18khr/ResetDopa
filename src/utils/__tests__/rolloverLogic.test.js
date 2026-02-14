// src/utils/__tests__/rolloverLogic.test.js
// Tests for rollover penalty and grace system logic

import { getRampThreshold } from '../streakCalculations';

/**
 * Simulates the rollover logic from AppContext.js
 * This is extracted for testing purposes
 */
function simulateRollover({
  prevDay,
  donePrev,
  assignedCount,
  streak,
  graceUsages = [],
  lastStreakDayCounted,
}) {
  const adherencePrev = assignedCount === 0 ? 0 : donePrev / assignedCount;
  const thresholdPrev = getRampThreshold(prevDay);

  // Guard: If no tasks and streak already 0
  if (donePrev === 0 && streak === 0) {
    return {
      type: 'guard-zero',
      streak: 0,
      graceUsages,
      message: `Day ${prevDay}: 0/${assignedCount} tasks completed. Build momentum today with small wins.`,
    };
  }

  // Check active graces
  const activeGraces = graceUsages.filter(g => prevDay < g.expiresOnDay);
  const graceAvailable = activeGraces.length < 2;
  const graceUsedForPrevDay = graceUsages.some(g => g.usedOnDay === prevDay);

  // Already counted same-day
  if (lastStreakDayCounted === prevDay) {
    return {
      type: 'already-counted',
      streak,
      graceUsages,
      message: `Day ${prevDay} counted — streak holding strong!`,
    };
  }

  // Case 0: Onboarding leniency (Days 1-2)
  if (prevDay <= 2 && donePrev >= 1) {
    return {
      type: 'onboarding-advance',
      streak: streak + 1,
      graceUsages,
      message: 'Streak advanced overnight — strong start! Keep locking anchors.',
    };
  }

  // Case 1: Met threshold
  if (adherencePrev >= thresholdPrev) {
    return {
      type: 'threshold-met',
      streak: streak + 1,
      graceUsages,
      message: 'Streak advanced overnight — great consistency!',
    };
  }

  // Case 2: Grace band (30-60%)
  if (adherencePrev >= 0.3 && adherencePrev < thresholdPrev) {
    // Sub-case 2a: Grace available
    if (graceAvailable && !graceUsedForPrevDay) {
      const updatedGrace = [...graceUsages, { usedOnDay: prevDay, expiresOnDay: prevDay + 7 }];
      const tasksNeeded = Math.ceil(thresholdPrev * assignedCount);
      return {
        type: 'grace-applied',
        streak: streak + 1,
        graceUsages: updatedGrace,
        message: `Grace applied for Day ${prevDay}. You completed ${donePrev}/${assignedCount} tasks (needed ${tasksNeeded}). Streak advanced to ${streak + 1} via grace. Max 2 graces in rolling 7-day window — make today count!`,
      };
    }

    // Sub-case 2b: Already used grace for this day
    if (graceUsedForPrevDay) {
      return {
        type: 'already-grace-protected',
        streak,
        graceUsages,
        message: null,
      };
    }

    // Sub-case 2c: Grace unavailable - check soft penalty
    if (streak >= 7 && adherencePrev >= 0.4) {
      const newStreakVal = Math.max(0, streak - 1);
      return {
        type: 'soft-penalty',
        streak: newStreakVal,
        graceUsages,
        message: `Streak dipped by 1 — rebuild momentum today. Grace unavailable (used recently).`,
      };
    } else {
      return {
        type: 'grace-unavailable-hold',
        streak,
        graceUsages,
        message: `Day ${prevDay}: ${donePrev}/${assignedCount} tasks (${Math.round(adherencePrev * 100)}%). Grace unavailable (used recently). Streak holding at ${streak}.`,
      };
    }
  }

  // Case 3: Very low adherence (<30%)
  if (adherencePrev < 0.3) {
    if (streak > 0) {
      return {
        type: 'hard-reset',
        streak: 0,
        graceUsages,
        message: `Streak reset. Day ${prevDay}: ${donePrev}/${assignedCount} tasks completed. Start fresh today with small wins.`,
      };
    } else {
      return {
        type: 'already-zero',
        streak: 0,
        graceUsages,
        message: null,
      };
    }
  }
}

describe('Rollover Logic - Penalty and Grace System', () => {
  // ==================== CASE 0: ONBOARDING LENIENCY ====================
  describe('Case 0: Onboarding Leniency (Days 1-2)', () => {
    it('should advance streak on Day 1 with just 1 task completed', () => {
      const result = simulateRollover({
        prevDay: 1,
        donePrev: 1,
        assignedCount: 5,
        streak: 0,
        graceUsages: [],
        lastStreakDayCounted: 0,
      });

      expect(result.type).toBe('onboarding-advance');
      expect(result.streak).toBe(1);
      expect(result.graceUsages).toEqual([]);
    });

    it('should advance streak on Day 2 with just 1 task completed', () => {
      const result = simulateRollover({
        prevDay: 2,
        donePrev: 1,
        assignedCount: 5,
        streak: 1,
        graceUsages: [],
        lastStreakDayCounted: 1,
      });

      expect(result.type).toBe('onboarding-advance');
      expect(result.streak).toBe(2);
    });

    it('should NOT apply onboarding leniency on Day 3', () => {
      const result = simulateRollover({
        prevDay: 3,
        donePrev: 1,
        assignedCount: 6,
        streak: 2,
        graceUsages: [],
        lastStreakDayCounted: 2,
      });

      // 1/6 = 16.7% < 30% = hard reset
      expect(result.type).toBe('hard-reset');
      expect(result.streak).toBe(0);
    });
  });

  // ==================== CASE 1: MET THRESHOLD ====================
  describe('Case 1: Met Threshold', () => {
    it('should advance streak when meeting 50% threshold (Day 1-7)', () => {
      const result = simulateRollover({
        prevDay: 5,
        donePrev: 3,
        assignedCount: 6,
        streak: 4,
        graceUsages: [],
        lastStreakDayCounted: 4,
      });

      // 3/6 = 50% = threshold
      expect(result.type).toBe('threshold-met');
      expect(result.streak).toBe(5);
    });

    it('should advance streak when meeting 60% threshold (Day 8-14)', () => {
      const result = simulateRollover({
        prevDay: 10,
        donePrev: 4,
        assignedCount: 6,
        streak: 9,
        graceUsages: [],
        lastStreakDayCounted: 9,
      });

      // 4/6 = 66.7% > 60% threshold
      expect(result.type).toBe('threshold-met');
      expect(result.streak).toBe(10);
    });

    it('should advance streak when meeting 65% threshold (Day 15-21)', () => {
      const result = simulateRollover({
        prevDay: 18,
        donePrev: 4,
        assignedCount: 6,
        streak: 17,
        graceUsages: [],
        lastStreakDayCounted: 17,
      });

      // 4/6 = 66.7% > 65% threshold
      expect(result.type).toBe('threshold-met');
      expect(result.streak).toBe(18);
    });

    it('should advance streak when meeting 70% threshold (Day 22+)', () => {
      const result = simulateRollover({
        prevDay: 25,
        donePrev: 5,
        assignedCount: 6,
        streak: 24,
        graceUsages: [],
        lastStreakDayCounted: 24,
      });

      // 5/6 = 83.3% > 70% threshold
      expect(result.type).toBe('threshold-met');
      expect(result.streak).toBe(25);
    });
  });

  // ==================== CASE 2A: GRACE APPLIED ====================
  describe('Case 2a: Grace Applied (30-60%, grace available)', () => {
    it('should apply grace and advance streak when in grace band', () => {
      const result = simulateRollover({
        prevDay: 5,
        donePrev: 2,
        assignedCount: 6,
        streak: 4,
        graceUsages: [],
        lastStreakDayCounted: 4,
      });

      // 2/6 = 33.3% (grace band)
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(5);
      expect(result.graceUsages).toEqual([
        { usedOnDay: 5, expiresOnDay: 12 },
      ]);
    });

    it('should apply second grace when first is still active', () => {
      const existingGrace = [{ usedOnDay: 5, expiresOnDay: 12 }];

      const result = simulateRollover({
        prevDay: 7,
        donePrev: 2,
        assignedCount: 6,
        streak: 6,
        graceUsages: existingGrace,
        lastStreakDayCounted: 6,
      });

      // 2/6 = 33.3% (grace band), 1 grace active
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(7);
      expect(result.graceUsages).toEqual([
        { usedOnDay: 5, expiresOnDay: 12 },
        { usedOnDay: 7, expiresOnDay: 14 },
      ]);
    });

    it('should apply grace even at 30% boundary', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 6,
        streak: 7,
        graceUsages: [],
        lastStreakDayCounted: 7,
      });

      // 2/6 = 33.3% ≈ 30% (grace band)
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(8);
    });
  });

  // ==================== CASE 2C: GRACE UNAVAILABLE ====================
  describe('Case 2c: Grace Unavailable (30-60%, 2 active graces)', () => {
    it('should hold streak when in grace band but 2 graces already active', () => {
      const twoGraces = [
        { usedOnDay: 5, expiresOnDay: 12 },
        { usedOnDay: 7, expiresOnDay: 14 },
      ];

      const result = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 6,
        streak: 7,
        graceUsages: twoGraces,
        lastStreakDayCounted: 7,
      });

      // 2/6 = 33.3% (grace band), but 2 graces active (8 < 12 and 8 < 14)
      expect(result.type).toBe('grace-unavailable-hold');
      expect(result.streak).toBe(7); // Holds at 7
      expect(result.graceUsages).toEqual(twoGraces); // No new grace
    });

    it('should hold streak on consecutive days with no grace', () => {
      const twoGraces = [
        { usedOnDay: 5, expiresOnDay: 12 },
        { usedOnDay: 7, expiresOnDay: 14 },
      ];

      // Day 8
      const result8 = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 6,
        streak: 7,
        graceUsages: twoGraces,
        lastStreakDayCounted: 7,
      });

      expect(result8.type).toBe('grace-unavailable-hold');
      expect(result8.streak).toBe(7);

      // Day 9 (still both graces active)
      const result9 = simulateRollover({
        prevDay: 9,
        donePrev: 2,
        assignedCount: 6,
        streak: 7,
        graceUsages: twoGraces,
        lastStreakDayCounted: 7,
      });

      expect(result9.type).toBe('grace-unavailable-hold');
      expect(result9.streak).toBe(7);
    });
  });

  // ==================== CASE 3: HARD RESET ====================
  describe('Case 3: Hard Reset (<30% adherence)', () => {
    it('should reset streak when adherence is below 30%', () => {
      const result = simulateRollover({
        prevDay: 10,
        donePrev: 1,
        assignedCount: 6,
        streak: 9,
        graceUsages: [],
        lastStreakDayCounted: 9,
      });

      // 1/6 = 16.7% < 30%
      expect(result.type).toBe('hard-reset');
      expect(result.streak).toBe(0);
    });

    it('should reset streak when 0 tasks completed and streak > 0', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 0,
        assignedCount: 6,
        streak: 7,
        graceUsages: [],
        lastStreakDayCounted: 7,
      });

      // 0/6 = 0% < 30%
      expect(result.type).toBe('hard-reset');
      expect(result.streak).toBe(0);
    });

    it('should reset streak even with graces available', () => {
      const result = simulateRollover({
        prevDay: 10,
        donePrev: 1,
        assignedCount: 6,
        streak: 9,
        graceUsages: [{ usedOnDay: 5, expiresOnDay: 12 }],
        lastStreakDayCounted: 9,
      });

      // 1/6 = 16.7% < 30% (too low even for grace)
      expect(result.type).toBe('hard-reset');
      expect(result.streak).toBe(0);
    });

    it('should NOT reset if streak already 0', () => {
      const result = simulateRollover({
        prevDay: 5,
        donePrev: 1,
        assignedCount: 6,
        streak: 0,
        graceUsages: [],
        lastStreakDayCounted: 3,
      });

      // 1/6 = 16.7% < 30%, but streak already 0
      expect(result.type).toBe('already-zero');
      expect(result.streak).toBe(0);
    });
  });

  // ==================== CASE 4: SOFT PENALTY ====================
  describe('Case 4: Soft Penalty (streak ≥7, adherence ≥40%, grace unavailable)', () => {
    it('should apply soft penalty (-1) when streak ≥7, adherence 40-60%, and grace unavailable', () => {
      const twoGraces = [
        { usedOnDay: 6, expiresOnDay: 13 },
        { usedOnDay: 8, expiresOnDay: 15 },
      ];

      const result = simulateRollover({
        prevDay: 10,
        donePrev: 3,
        assignedCount: 6,
        streak: 10,
        graceUsages: twoGraces,
        lastStreakDayCounted: 9,
      });

      // 3/6 = 50%, threshold = 60%, streak = 10, 2 graces active
      expect(result.type).toBe('soft-penalty');
      expect(result.streak).toBe(9); // 10 - 1
    });

    it('should apply soft penalty at 40% adherence boundary', () => {
      const twoGraces = [
        { usedOnDay: 5, expiresOnDay: 12 },
        { usedOnDay: 6, expiresOnDay: 13 },
      ];

      const result = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 5,
        streak: 7,
        graceUsages: twoGraces,
        lastStreakDayCounted: 7,
      });

      // 2/5 = 40%, threshold = 60%, 2 graces active
      expect(result.type).toBe('soft-penalty');
      expect(result.streak).toBe(6); // 7 - 1
    });

    it('should apply soft penalty when both graces are active', () => {
      const twoGraces = [
        { usedOnDay: 5, expiresOnDay: 12 },
        { usedOnDay: 7, expiresOnDay: 14 },
      ];

      const result = simulateRollover({
        prevDay: 10,
        donePrev: 3,
        assignedCount: 6,
        streak: 10,
        graceUsages: twoGraces,
        lastStreakDayCounted: 9,
      });

      // 3/6 = 50%, threshold = 60%
      // 50% >= 30% and < 60% = grace band
      // Graces unavailable, streak ≥7, adherence ≥40% → Soft penalty!
      expect(result.type).toBe('soft-penalty');
      expect(result.streak).toBe(9); // 10 - 1
    });

    it('should NOT apply soft penalty if streak < 7', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 3,
        assignedCount: 6,
        streak: 6,
        graceUsages: [],
        lastStreakDayCounted: 7,
      });

      // 3/6 = 50%, threshold = 60%, streak = 6 (< 7)
      // Falls into grace band, not soft penalty
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(7); // Advances with grace
    });

    it('should NOT apply soft penalty if adherence < 40%', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 6,
        streak: 10,
        graceUsages: [],
        lastStreakDayCounted: 7,
      });

      // 2/6 = 33.3% < 40%
      // Falls into grace band (30-60%), not soft penalty
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(11); // Advances with grace
    });
  });

  // ==================== CASE 5: HOLD BELOW THRESHOLD ====================
  describe('Case 5: Hold Below Threshold', () => {
    it('should hold streak when below threshold, streak < 7, adherence < 40%', () => {
      const result = simulateRollover({
        prevDay: 5,
        donePrev: 2,
        assignedCount: 6,
        streak: 4,
        graceUsages: [{ usedOnDay: 3, expiresOnDay: 10 }, { usedOnDay: 4, expiresOnDay: 11 }],
        lastStreakDayCounted: 4,
      });

      // 2/6 = 33.3% (grace band but no grace available)
      expect(result.type).toBe('grace-unavailable-hold');
      expect(result.streak).toBe(4); // Holds
    });

    it('should hold streak when adherence just below 40%', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 2,
        assignedCount: 6,
        streak: 5,
        graceUsages: [{ usedOnDay: 6, expiresOnDay: 13 }, { usedOnDay: 7, expiresOnDay: 14 }],
        lastStreakDayCounted: 7,
      });

      // 2/6 = 33.3% < 40%, grace unavailable
      expect(result.type).toBe('grace-unavailable-hold');
      expect(result.streak).toBe(5);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle 0 tasks with streak 0 (guard)', () => {
      const result = simulateRollover({
        prevDay: 5,
        donePrev: 0,
        assignedCount: 6,
        streak: 0,
        graceUsages: [],
        lastStreakDayCounted: 3,
      });

      expect(result.type).toBe('guard-zero');
      expect(result.streak).toBe(0);
    });

    it('should handle exactly 60% adherence on Day 8', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 3,
        assignedCount: 5,
        streak: 7,
        graceUsages: [],
        lastStreakDayCounted: 7,
      });

      // 3/5 = 60% = threshold (should advance)
      expect(result.type).toBe('threshold-met');
      expect(result.streak).toBe(8);
    });

    it('should handle grace expiration correctly', () => {
      const expiredGrace = [{ usedOnDay: 5, expiresOnDay: 12 }];

      const result = simulateRollover({
        prevDay: 13, // After expiration
        donePrev: 2,
        assignedCount: 6,
        streak: 12,
        graceUsages: expiredGrace,
        lastStreakDayCounted: 12,
      });

      // Grace expired (13 >= 12), so grace available again
      // 2/6 = 33.3% (grace band)
      expect(result.type).toBe('grace-applied');
      expect(result.streak).toBe(13);
      expect(result.graceUsages).toHaveLength(2);
      expect(result.graceUsages[1]).toEqual({ usedOnDay: 13, expiresOnDay: 20 });
    });

    it('should not double-count already counted day', () => {
      const result = simulateRollover({
        prevDay: 8,
        donePrev: 5,
        assignedCount: 6,
        streak: 8,
        graceUsages: [],
        lastStreakDayCounted: 8, // Already counted this day
      });

      expect(result.type).toBe('already-counted');
      expect(result.streak).toBe(8); // No change
    });
  });

  // ==================== COMPREHENSIVE SCENARIOS ====================
  describe('Comprehensive Scenarios', () => {
    it('Scenario: 10-day streak with declining performance', () => {
      // Day 11: 50% (below 60% threshold, but ≥40%)
      const day11 = simulateRollover({
        prevDay: 11,
        donePrev: 3,
        assignedCount: 6,
        streak: 10,
        graceUsages: [],
        lastStreakDayCounted: 10,
      });

      // Should apply grace (30-60% band, grace available)
      expect(day11.type).toBe('grace-applied');
      expect(day11.streak).toBe(11);

      // Day 12: 50% again (second grace)
      const day12 = simulateRollover({
        prevDay: 12,
        donePrev: 3,
        assignedCount: 6,
        streak: 11,
        graceUsages: day11.graceUsages,
        lastStreakDayCounted: 11,
      });

      expect(day12.type).toBe('grace-applied');
      expect(day12.streak).toBe(12);

      // Day 13: 50% (no graces left, soft penalty applies)
      const day13 = simulateRollover({
        prevDay: 13,
        donePrev: 3,
        assignedCount: 6,
        streak: 12,
        graceUsages: day12.graceUsages,
        lastStreakDayCounted: 12,
      });

      // Grace unavailable, streak ≥7, adherence ≥40% → Soft penalty
      expect(day13.type).toBe('soft-penalty');
      expect(day13.streak).toBe(11); // 12 - 1
    });

    it('Scenario: Early streak building', () => {
      // Day 3: 33% (below 50%)
      const day3 = simulateRollover({
        prevDay: 3,
        donePrev: 2,
        assignedCount: 6,
        streak: 2,
        graceUsages: [],
        lastStreakDayCounted: 2,
      });

      expect(day3.type).toBe('grace-applied');
      expect(day3.streak).toBe(3);

      // Day 4: 0% (hard reset)
      const day4 = simulateRollover({
        prevDay: 4,
        donePrev: 0,
        assignedCount: 6,
        streak: 3,
        graceUsages: day3.graceUsages,
        lastStreakDayCounted: 3,
      });

      expect(day4.type).toBe('hard-reset');
      expect(day4.streak).toBe(0);
    });
  });
});
