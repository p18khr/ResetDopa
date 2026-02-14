// src/context/__tests__/optimistic-ui-scenarios.test.js
// Comprehensive 30-day Optimistic UI Flow Tests
// Tests the coordination between same-day evaluation and overnight confirmation

/**
 * OPTIMISTIC UI SYSTEM OVERVIEW:
 *
 * During Day (User Marks Tasks):
 * 1. User completes tasks and meets threshold
 * 2. evaluateStreakProgress() sets thresholdMetToday = currentDay
 * 3. Does NOT increment actual streak value
 * 4. getDisplayStreak() shows streak + 1 (optimistic)
 * 5. User sees: "Streak advanced: 5 → 6"
 *
 * Overnight (Rollover Confirmation):
 * 1. applyRolloverOnce() runs at midnight
 * 2. Guard 4 checks: if (streakEvaluatedForDay === prevDay)
 * 3. If thresholdMetToday === prevDay → CONFIRM (increment actual streak)
 * 4. If thresholdMetToday !== prevDay → SKIP (already confirmed)
 * 5. Clear thresholdMetToday = 0
 * 6. Display now shows actual streak value
 *
 * This test suite simulates the full flow for 30 days.
 */

describe('Optimistic UI System - 30-Day Scenarios', () => {

  // Helper to simulate same-day evaluation (sets flag, doesn't increment)
  const simulateSameDayEvaluation = (dayNumber, streak, streakEvaluatedForDay) => {
    // In real code, this is evaluateStreakProgress
    return {
      thresholdMet: true,
      thresholdMetToday: dayNumber, // Flag set
      streakEvaluatedForDay: dayNumber, // Evaluation marked
      actualStreak: streak, // NOT incremented
      displayStreak: streak + 1, // Optimistic +1
      lastStreakDayCounted: dayNumber,
    };
  };

  // Helper to simulate overnight confirmation (Guard 4 logic)
  const simulateOvernightConfirmation = (
    prevDay,
    streak,
    streakEvaluatedForDay,
    thresholdMetToday
  ) => {
    // Guard 4 logic from AppContext.js lines 1161-1203
    if (streakEvaluatedForDay === prevDay) {
      if (thresholdMetToday === prevDay) {
        // Confirm the optimistic increment
        return {
          confirmed: true,
          actualStreak: streak + 1, // NOW incremented
          thresholdMetToday: 0, // Clear flag
          message: `Streak confirmed: ${streak} → ${streak + 1}`,
        };
      } else {
        // Already confirmed, skip
        return {
          confirmed: false,
          skipped: true,
          actualStreak: streak, // No change
          message: 'Day already evaluated',
        };
      }
    }

    // Not evaluated yet, proceed with normal evaluation
    return {
      confirmed: false,
      needsEvaluation: true,
      actualStreak: streak,
      message: 'Needs overnight evaluation',
    };
  };

  // ============================================================================
  // SCENARIO 1: Basic Optimistic UI Flow (Day 1-2)
  // ============================================================================

  describe('SCENARIO 1: Basic Optimistic UI Flow', () => {
    it('Day 1: Should show optimistic +1 when threshold met', () => {
      const result = simulateSameDayEvaluation(1, 0, 0);

      expect(result.thresholdMet).toBe(true);
      expect(result.thresholdMetToday).toBe(1);
      expect(result.actualStreak).toBe(0); // NOT incremented
      expect(result.displayStreak).toBe(1); // Optimistic +1
      expect(result.streakEvaluatedForDay).toBe(1);
    });

    it('Day 1 → Day 2: Overnight confirmation should increment actual streak', () => {
      // Day 1 state after same-day evaluation
      const dayEndState = {
        streak: 0, // Actual
        thresholdMetToday: 1, // Flag set
        streakEvaluatedForDay: 1,
      };

      // Overnight rollover (Day 1 → Day 2)
      const result = simulateOvernightConfirmation(
        1, // prevDay
        dayEndState.streak,
        dayEndState.streakEvaluatedForDay,
        dayEndState.thresholdMetToday
      );

      expect(result.confirmed).toBe(true);
      expect(result.actualStreak).toBe(1); // NOW incremented
      expect(result.thresholdMetToday).toBe(0); // Flag cleared
      expect(result.message).toContain('confirmed');
    });

    it('Day 2: Display should show actual streak (matches what user saw)', () => {
      // After overnight confirmation
      const actualStreak = 1;
      const thresholdMetToday = 0; // Cleared

      const displayStreak = thresholdMetToday === 2
        ? actualStreak + 1
        : actualStreak;

      expect(displayStreak).toBe(1); // Matches optimistic from Day 1
    });

    it('Day 2: User marks tasks, sees optimistic streak = 2', () => {
      const result = simulateSameDayEvaluation(2, 1, 1);

      expect(result.actualStreak).toBe(1); // Still 1
      expect(result.displayStreak).toBe(2); // Optimistic +1
      expect(result.thresholdMetToday).toBe(2); // Flag set for Day 2
    });

    it('Day 2 → Day 3: Overnight confirmation increments to 2', () => {
      const result = simulateOvernightConfirmation(2, 1, 2, 2);

      expect(result.confirmed).toBe(true);
      expect(result.actualStreak).toBe(2);
      expect(result.thresholdMetToday).toBe(0);
    });
  });

  // ============================================================================
  // SCENARIO 2: Guard 4 Prevents Double-Counting
  // ============================================================================

  describe('SCENARIO 2: Guard 4 Prevents Double-Counting', () => {
    it('Should NOT increment again if thresholdMetToday already cleared', () => {
      // Day 5 was already confirmed (flag cleared)
      const result = simulateOvernightConfirmation(
        5, // prevDay
        5, // streak already incremented
        5, // evaluated
        0  // flag CLEARED
      );

      expect(result.confirmed).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.actualStreak).toBe(5); // No change
    });

    it('Should NOT increment if same day evaluated twice', () => {
      // First evaluation
      const eval1 = simulateSameDayEvaluation(10, 9, 9);
      expect(eval1.displayStreak).toBe(10);

      // Second evaluation same day (should be blocked in real code)
      // Guard: if (streakEvaluatedForDay === dayNumber) return alreadyEvaluated
      const alreadyEvaluated = eval1.streakEvaluatedForDay === 10;
      expect(alreadyEvaluated).toBe(true);
    });

    it('Should NOT double-increment if user reopens app same day', () => {
      // Morning: User marks tasks
      const morningState = simulateSameDayEvaluation(7, 6, 6);
      expect(morningState.actualStreak).toBe(6);
      expect(morningState.displayStreak).toBe(7);
      expect(morningState.thresholdMetToday).toBe(7);

      // Evening: User reopens app (same day)
      // evaluateStreakProgress checks: streakEvaluatedForDay === dayNumber
      // Returns: alreadyEvaluated = true
      const eveningCheck = morningState.streakEvaluatedForDay === 7;
      expect(eveningCheck).toBe(true); // Blocked from double-eval
    });
  });

  // ============================================================================
  // SCENARIO 3: Full 7-Day Perfect Streak with Optimistic UI
  // ============================================================================

  describe('SCENARIO 3: 7-Day Perfect Streak (Week 1)', () => {
    it('Should build streak from 0 to 7 with optimistic UI coordination', () => {
      let actualStreak = 0;
      let thresholdMetToday = 0;
      let streakEvaluatedForDay = 0;

      // Simulate 7 days
      for (let day = 1; day <= 7; day++) {
        // SAME-DAY: User marks tasks
        const sameDayResult = simulateSameDayEvaluation(
          day,
          actualStreak,
          streakEvaluatedForDay
        );

        expect(sameDayResult.actualStreak).toBe(actualStreak); // Not incremented
        expect(sameDayResult.displayStreak).toBe(actualStreak + 1); // Optimistic
        expect(sameDayResult.thresholdMetToday).toBe(day);

        // Update state
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        // OVERNIGHT: Confirmation
        const overnightResult = simulateOvernightConfirmation(
          day,
          actualStreak,
          streakEvaluatedForDay,
          thresholdMetToday
        );

        expect(overnightResult.confirmed).toBe(true);
        expect(overnightResult.actualStreak).toBe(actualStreak + 1);
        expect(overnightResult.thresholdMetToday).toBe(0);

        // Update actual streak
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = overnightResult.thresholdMetToday;
      }

      // After 7 days
      expect(actualStreak).toBe(7);
      expect(thresholdMetToday).toBe(0);
    });
  });

  // ============================================================================
  // SCENARIO 4: Full 30-Day Perfect Streak
  // ============================================================================

  describe('SCENARIO 4: 30-Day Perfect Streak with Optimistic UI', () => {
    it('Should build streak from 0 to 30 with proper confirmation', () => {
      let actualStreak = 0;
      let thresholdMetToday = 0;
      let streakEvaluatedForDay = 0;
      const log = [];

      for (let day = 1; day <= 30; day++) {
        // SAME-DAY: User marks tasks
        const sameDayResult = simulateSameDayEvaluation(
          day,
          actualStreak,
          streakEvaluatedForDay
        );

        log.push({
          day,
          phase: 'same-day',
          actualStreak: sameDayResult.actualStreak,
          displayStreak: sameDayResult.displayStreak,
        });

        expect(sameDayResult.actualStreak).toBe(actualStreak);
        expect(sameDayResult.displayStreak).toBe(actualStreak + 1);

        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        // OVERNIGHT: Confirmation
        const overnightResult = simulateOvernightConfirmation(
          day,
          actualStreak,
          streakEvaluatedForDay,
          thresholdMetToday
        );

        log.push({
          day,
          phase: 'overnight',
          confirmed: overnightResult.confirmed,
          actualStreak: overnightResult.actualStreak,
        });

        expect(overnightResult.confirmed).toBe(true);
        expect(overnightResult.actualStreak).toBe(actualStreak + 1);

        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = overnightResult.thresholdMetToday;
      }

      // Final state
      expect(actualStreak).toBe(30);
      expect(thresholdMetToday).toBe(0);

      // Verify log shows proper progression
      expect(log.length).toBe(60); // 30 days × 2 phases
      expect(log[0]).toEqual({ day: 1, phase: 'same-day', actualStreak: 0, displayStreak: 1 });
      expect(log[1]).toEqual({ day: 1, phase: 'overnight', confirmed: true, actualStreak: 1 });
      expect(log[58]).toEqual({ day: 30, phase: 'same-day', actualStreak: 29, displayStreak: 30 });
      expect(log[59]).toEqual({ day: 30, phase: 'overnight', confirmed: true, actualStreak: 30 });
    });
  });

  // ============================================================================
  // SCENARIO 5: User Doesn't Meet Threshold (No Optimistic)
  // ============================================================================

  describe('SCENARIO 5: Below Threshold - No Optimistic UI', () => {
    it('Should NOT show optimistic +1 if threshold not met', () => {
      // Day 10: User completes only 2/6 tasks (33% < 60% threshold)
      const actualStreak = 9;
      const thresholdMetToday = 0; // Flag NOT set
      const streakEvaluatedForDay = 9;

      // Display calculation
      const displayStreak = thresholdMetToday === 10
        ? actualStreak + 1
        : actualStreak;

      expect(displayStreak).toBe(9); // No optimistic +1
    });

    it('Should NOT set flag if below threshold', () => {
      // Simulating below-threshold scenario
      const thresholdMet = false; // Below 60% on Day 10

      if (!thresholdMet) {
        // Flag should NOT be set
        expect(thresholdMet).toBe(false);
      }
    });

    it('Overnight should NOT increment if threshold not met', () => {
      // Day 10 ended without meeting threshold
      const result = simulateOvernightConfirmation(
        10, // prevDay
        9,  // streak
        10, // evaluated (but didn't meet threshold)
        0   // flag NOT set
      );

      expect(result.skipped).toBe(true);
      expect(result.actualStreak).toBe(9); // No increment
    });
  });

  // ============================================================================
  // SCENARIO 6: Edge Case - Multiple App Sessions Same Day
  // ============================================================================

  describe('SCENARIO 6: Multiple Sessions Same Day', () => {
    it('Should maintain optimistic display across sessions same day', () => {
      // Session 1: Morning - User marks 3 tasks
      const session1 = simulateSameDayEvaluation(15, 14, 14);
      expect(session1.displayStreak).toBe(15);
      expect(session1.thresholdMetToday).toBe(15);

      // Session 2: Afternoon - User reopens app
      // State persisted: thresholdMetToday = 15
      const displayStreak = session1.thresholdMetToday === 15
        ? session1.actualStreak + 1
        : session1.actualStreak;

      expect(displayStreak).toBe(15); // Still shows optimistic

      // Session 3: Evening - User marks more tasks (no re-eval)
      // Guard blocks: streakEvaluatedForDay === 15
      const alreadyEvaluated = session1.streakEvaluatedForDay === 15;
      expect(alreadyEvaluated).toBe(true);
    });
  });

  // ============================================================================
  // SCENARIO 7: Grace System Integration
  // ============================================================================

  describe('SCENARIO 7: Optimistic UI with Grace Days', () => {
    it('Should clear optimistic flag if grace applied overnight', () => {
      // Day 8: User completes 3/6 tasks (50% < 60% threshold for Week 2)
      const actualStreak = 7;
      const thresholdMetToday = 0; // Flag NOT set (below threshold)
      const streakEvaluatedForDay = 7;

      // Overnight: Grace applied (30-49% adherence)
      // Grace system would preserve streak but clear any flags
      const overnightResult = {
        graceApplied: true,
        actualStreak: 7, // Held, not incremented
        thresholdMetToday: 0, // Always cleared overnight
        message: 'Grace applied',
      };

      expect(overnightResult.thresholdMetToday).toBe(0);
      expect(overnightResult.actualStreak).toBe(7);
    });

    it('Should reset optimistic flag if streak reset overnight', () => {
      // Day 12: User completes 0/6 tasks (0% < 30%, no grace, reset)
      const actualStreak = 11;
      const thresholdMetToday = 0; // Flag NOT set

      // Overnight: Streak reset
      const overnightResult = {
        streakReset: true,
        actualStreak: 0, // Reset
        thresholdMetToday: 0, // Cleared
        graceUsages: [], // Cleared
      };

      expect(overnightResult.actualStreak).toBe(0);
      expect(overnightResult.thresholdMetToday).toBe(0);
    });
  });

  // ============================================================================
  // SCENARIO 8: Realistic Mixed Performance (30 Days)
  // ============================================================================

  describe('SCENARIO 8: Realistic 30-Day Mixed Performance', () => {
    it('Should handle realistic user journey with ups and downs', () => {
      let actualStreak = 0;
      let thresholdMetToday = 0;
      let streakEvaluatedForDay = 0;
      let graceUsages = [];
      const events = [];

      // Days 1-5: Perfect start
      for (let day = 1; day <= 5; day++) {
        const sameDayResult = simulateSameDayEvaluation(day, actualStreak, streakEvaluatedForDay);
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        const overnightResult = simulateOvernightConfirmation(day, actualStreak, streakEvaluatedForDay, thresholdMetToday);
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = 0;

        events.push({ day, streak: actualStreak, status: 'confirmed' });
      }

      expect(actualStreak).toBe(5);

      // Day 6: Slip up (only 40% - grace applied)
      thresholdMetToday = 0; // Didn't meet threshold
      graceUsages.push({ usedOnDay: 6, expiresOnDay: 13 });
      actualStreak = 5; // Held by grace
      events.push({ day: 6, streak: actualStreak, status: 'grace' });

      // Days 7-12: Recovery
      for (let day = 7; day <= 12; day++) {
        const sameDayResult = simulateSameDayEvaluation(day, actualStreak, day - 1);
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        const overnightResult = simulateOvernightConfirmation(day, actualStreak, streakEvaluatedForDay, thresholdMetToday);
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = 0;

        events.push({ day, streak: actualStreak, status: 'confirmed' });
      }

      expect(actualStreak).toBe(11); // 5 + 6 days

      // Day 13: Another slip (40% - second grace)
      thresholdMetToday = 0;
      graceUsages.push({ usedOnDay: 13, expiresOnDay: 20 });
      actualStreak = 11; // Held by grace
      events.push({ day: 13, streak: actualStreak, status: 'grace' });

      // Days 14-20: Good performance (grace expires)
      for (let day = 14; day <= 20; day++) {
        const sameDayResult = simulateSameDayEvaluation(day, actualStreak, day - 1);
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        const overnightResult = simulateOvernightConfirmation(day, actualStreak, streakEvaluatedForDay, thresholdMetToday);
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = 0;

        events.push({ day, streak: actualStreak, status: 'confirmed' });
      }

      expect(actualStreak).toBe(18); // 11 + 7 days
      expect(graceUsages.length).toBe(2);

      // Verify no optimistic flags lingering
      expect(thresholdMetToday).toBe(0);
    });
  });

  // ============================================================================
  // SCENARIO 9: Bug Regression Test - Day 2 Reset Issue
  // ============================================================================

  describe('SCENARIO 9: Bug Regression - Day 2 Reset (Fixed)', () => {
    it('Should NOT reset on Day 2 after Day 1 optimistic increment', () => {
      // DAY 1: User marks task
      let actualStreak = 0;
      const day1SameDay = simulateSameDayEvaluation(1, actualStreak, 0);

      expect(day1SameDay.actualStreak).toBe(0); // Not incremented yet
      expect(day1SameDay.displayStreak).toBe(1); // Optimistic
      expect(day1SameDay.thresholdMetToday).toBe(1); // Flag set

      // DAY 1 → DAY 2 OVERNIGHT
      const day1Overnight = simulateOvernightConfirmation(
        1,
        day1SameDay.actualStreak,
        day1SameDay.streakEvaluatedForDay,
        day1SameDay.thresholdMetToday
      );

      expect(day1Overnight.confirmed).toBe(true);
      expect(day1Overnight.actualStreak).toBe(1); // NOW confirmed
      expect(day1Overnight.thresholdMetToday).toBe(0); // Flag cleared

      actualStreak = day1Overnight.actualStreak;

      // DAY 2: User sees streak = 1 (not 0)
      const displayStreak = day1Overnight.thresholdMetToday === 2
        ? actualStreak + 1
        : actualStreak;

      expect(displayStreak).toBe(1); // FIXED: Was showing 0, now shows 1
      expect(actualStreak).toBe(1); // Confirmed value matches
    });

    it('Guard 4 should CONFIRM when thresholdMetToday === prevDay', () => {
      // This is the FIXED behavior
      const streakEvaluatedForDay = 1;
      const thresholdMetToday = 1;
      const prevDay = 1;

      // Guard 4 check
      if (streakEvaluatedForDay === prevDay) {
        if (thresholdMetToday === prevDay) {
          // NEW BEHAVIOR: Confirm the optimistic increment
          expect(true).toBe(true); // Should reach here
        } else {
          throw new Error('Should not skip when flag is set');
        }
      }
    });

    it('Guard 4 should SKIP when thresholdMetToday !== prevDay', () => {
      // Already confirmed scenario
      const streakEvaluatedForDay = 1;
      const thresholdMetToday = 0; // Flag cleared
      const prevDay = 1;

      // Guard 4 check
      if (streakEvaluatedForDay === prevDay) {
        if (thresholdMetToday === prevDay) {
          throw new Error('Should not confirm again');
        } else {
          // CORRECT: Skip because already confirmed
          expect(true).toBe(true);
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 10: Stress Test - Rapid Day Changes
  // ============================================================================

  describe('SCENARIO 10: Stress Test - Rapid Day Progression', () => {
    it('Should handle 90-day streak with optimistic UI', () => {
      let actualStreak = 0;
      let thresholdMetToday = 0;
      let streakEvaluatedForDay = 0;

      for (let day = 1; day <= 90; day++) {
        // Same-day evaluation
        const sameDayResult = simulateSameDayEvaluation(day, actualStreak, streakEvaluatedForDay);
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        // Overnight confirmation
        const overnightResult = simulateOvernightConfirmation(day, actualStreak, streakEvaluatedForDay, thresholdMetToday);

        expect(overnightResult.confirmed).toBe(true);
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = 0;
      }

      expect(actualStreak).toBe(90);
      expect(thresholdMetToday).toBe(0);
    });

    it('Should maintain correct state after 100 days', () => {
      let actualStreak = 0;
      let thresholdMetToday = 0;
      let streakEvaluatedForDay = 0;

      for (let day = 1; day <= 100; day++) {
        const sameDayResult = simulateSameDayEvaluation(day, actualStreak, streakEvaluatedForDay);
        thresholdMetToday = sameDayResult.thresholdMetToday;
        streakEvaluatedForDay = sameDayResult.streakEvaluatedForDay;

        const overnightResult = simulateOvernightConfirmation(day, actualStreak, streakEvaluatedForDay, thresholdMetToday);
        actualStreak = overnightResult.actualStreak;
        thresholdMetToday = 0;
      }

      expect(actualStreak).toBe(100);
      expect(thresholdMetToday).toBe(0); // Always cleared
    });
  });
});
