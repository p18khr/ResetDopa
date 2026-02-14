# Test Coverage Gap Analysis - Overnight Rollover Logic

## Executive Summary

**Status**: ⚠️ **CRITICAL GAP IDENTIFIED**

After detailed analysis, I've identified that while we have 154 passing tests, they **do NOT fully test the actual overnight rollover logic** in AppContext.js that handles:
- Soft penalties (30-49% adherence with no grace available)
- Hard resets (<30% adherence)
- Grace system in real overnight context
- 30-day journeys through actual rollover logic

## What IS Tested ✅

### 1. Pure Function Tests (49 tests)
**File**: `src/utils/__tests__/streakCalculations.test.js`

**Coverage**:
- ✅ `getCurrentDay` - Day calculations
- ✅ `getRampThreshold` - Threshold progression (50% → 60% → 65% → 70% → 60%)
- ✅ `generatePicksForDay` - Task generation
- ✅ `getAdherence` - Adherence calculation
- ✅ `evaluateStreakProgress` - Same-day evaluation logic
- ✅ `checkMissedDays` - Grace system for MISSED days (app not opened)
- ✅ `checkStreakMilestones` - Milestone detection

**What This Covers**: Pure utility functions in isolation

**What This DOESN'T Cover**: Overnight rollover in AppContext.js

### 2. Optimistic UI Simulation Tests (22 tests)
**File**: `src/context/__tests__/optimistic-ui-scenarios.test.js`

**Coverage**:
- ✅ Same-day evaluation (flag setting)
- ✅ Helper function simulating overnight confirmation
- ✅ Display logic (optimistic +1)
- ✅ Guard 4 double-counting prevention
- ✅ 30-day, 90-day, 100-day simulations

**What This Covers**: Optimistic UI coordination using SIMULATED helpers

**What This DOESN'T Cover**: ACTUAL AppContext.js overnight rollover logic

## What IS NOT Tested ❌

### Critical Gap: Actual Overnight Rollover Logic

**File**: `src/context/AppContext.js` (Lines 1278-1416)

This is the REAL overnight rollover implementation that runs every day at midnight. It has complex branching logic that is **NOT covered by existing tests**.

### Case 1: Threshold Met (Lines 1278-1301)
```javascript
if (adherencePrev >= thresholdPrev) {
  const newStreakVal = streak + 1;
  updateStreak(newStreakVal);
  setLastStreakDayCounted(prevDay);
  setLastStreakMessage('Streak confirmed — excellent consistency!');
  setThresholdMetToday(0);
  // ... save and return
}
```

**Test Coverage**: ❌ **NOT TESTED** in actual overnight context
- Unit tests check pure function logic ✓
- Optimistic UI tests simulate this with helpers ✓
- NO tests actually invoke AppContext overnight rollover ✗

### Case 2: Grace Band (30-49% adherence) (Lines 1303-1386)

This has **4 sub-paths** depending on grace availability:

#### Path 2A: Grace Available (Lines 1306-1334)
```javascript
if (graceAvailable && !graceUsedForPrevDay) {
  const updatedGrace = [...graceUsages, { usedOnDay: prevDay, expiresOnDay: prevDay + 7 }];
  setGraceUsages(updatedGrace);
  const newStreakVal = streak + 1;
  updateStreak(newStreakVal);
  setLastStreakDayCounted(prevDay);
  const msg = `Grace applied for Day ${prevDay}. You completed ${donePrev}/${assignedCount} tasks...`;
  setThresholdMetToday(0);
  // ... save and return
}
```

**Test Coverage**: ❌ **NOT TESTED** in actual overnight context
- checkMissedDays tests grace for MISSED days (different scenario)
- NO tests for grace applied during overnight rollover when adherence is 30-49%

#### Path 2B: Grace Already Used (Lines 1335-1339)
```javascript
else if (graceUsedForPrevDay) {
  lastRolloverPrevDayEvaluatedRefRef.current = prevDay;
  setLastRolloverPrevDayEvaluated(prevDay);
  saveUserData({ lastRolloverPrevDayEvaluated: prevDay });
  return; // Already grace-protected
}
```

**Test Coverage**: ❌ **NOT TESTED**

#### Path 2C: Soft Penalty (Lines 1344-1364)
```javascript
// Grace unavailable - soft penalty applies
if (streak >= 7 && adherencePrev >= 0.4) {
  const newStreakVal = Math.max(0, streak - 1);
  updateStreak(newStreakVal);
  const msg = `Streak dipped by 1 — rebuild momentum today. Grace unavailable (used recently).`;
  setLastStreakMessage(msg);
  setThresholdMetToday(0);
  // ... save and return
}
```

**Test Coverage**: ❌ **NOT TESTED**
- This is a CRITICAL path (soft penalty)
- Conditions: 30-49% adherence, no grace, streak >= 7, adherence >= 40%
- Result: Lose 1 streak day
- **NO TESTS FOR THIS PATH**

#### Path 2D: Hold Streak (Lines 1366-1384)
```javascript
else {
  // Hold streak - low streak or low adherence
  const msg = `Day ${prevDay}: ${donePrev}/${assignedCount} tasks (${Math.round(adherencePrev*100)}%). Grace unavailable (used recently). Streak holding at ${streak}.`;
  setLastStreakMessage(msg);
  setThresholdMetToday(0);
  // ... save and return
}
```

**Test Coverage**: ❌ **NOT TESTED**
- Conditions: 30-49% adherence, no grace, (streak < 7 OR adherence < 40%)
- Result: Streak holds (no change)
- **NO TESTS FOR THIS PATH**

### Case 3: Hard Reset (<30% adherence) (Lines 1388-1416)
```javascript
if (adherencePrev < 0.3) {
  if (streak > 0) {
    updateStreak(0);
    const msg = `Streak reset. Day ${prevDay}: ${donePrev}/${assignedCount} tasks completed. Start fresh today with small wins.`;
    setLastStreakMessage(msg);
    setThresholdMetToday(0);
    // ... save and return
  }
}
```

**Test Coverage**: ❌ **NOT TESTED** in actual overnight context
- checkMissedDays tests reset for MISSED days
- NO tests for reset during overnight rollover when adherence < 30%

## Specific Scenarios NOT Tested

### 1. Soft Penalty Flow (0 tests)
**Scenario**: User on 10-day streak, completes 3/6 tasks on Day 11 (50% adherence)
- Day 11: 50% < 60% threshold (Week 2)
- No grace available (used 2 graces in last 7 days)
- Streak >= 7 ✓
- Adherence >= 40% ✓
- **Expected**: Soft penalty → streak drops to 9
- **Test Coverage**: ❌ **NONE**

### 2. Grace Applied in Overnight Rollover (0 tests)
**Scenario**: User completes 3/6 tasks (50%), grace available
- Day 10: 50% < 60% threshold
- Grace available (only 1 grace in last 7 days)
- **Expected**: Grace applied, streak increments, grace counter updates
- **Test Coverage**: ❌ **NONE**

### 3. Hard Reset in Overnight Rollover (0 tests)
**Scenario**: User completes 1/6 tasks (17% < 30%)
- Day 15: 17% < 30%
- **Expected**: Hard reset, streak → 0
- **Test Coverage**: ❌ **NONE**

### 4. Grace Expiration with New Grace Available (0 tests)
**Scenario**:
- Day 5: Grace 1 used (expires Day 12)
- Day 8: Grace 2 used (expires Day 15)
- Days 9-12: Perfect performance
- Day 13: 40% adherence (Grace 1 expired, should get NEW grace)
- **Expected**: New grace applied (only 1 active grace now)
- **Test Coverage**: ❌ **NONE** in overnight context

### 5. 30-Day Journey Through Real Rollover (0 tests)
**Scenario**: Realistic 30-day journey with:
- Days 1-10: Perfect
- Day 11: 45% → Grace 1 applied
- Days 12-15: Perfect
- Day 16: 48% → Grace 2 applied
- Days 17-18: Perfect (2 graces active)
- Day 19: 42% → No grace (soft penalty? hold?)
- Day 20: Grace 1 expires
- Day 21: 40% → New grace available
- Days 22-30: Perfect

**Expected**: Complex state progression with grace management
- **Test Coverage**: ❌ **NONE** through actual overnight rollover

## Why This Matters

### 1. Complex Branching Logic

The overnight rollover has **7 distinct paths**:
1. Guard 4 with thresholdMetToday === prevDay → Confirm
2. Guard 4 with thresholdMetToday !== prevDay → Skip
3. Met threshold → Confirm
4. Grace band + grace available → Apply grace
5. Grace band + grace used → Hold
6. Grace band + no grace + soft penalty conditions → -1 streak
7. Grace band + no grace + hold conditions → Hold
8. <30% → Hard reset

**Current Test Coverage**: Only paths 1-3 are simulated (not actually tested)

### 2. State Mutations

Each path:
- Updates multiple state variables
- Clears thresholdMetToday flag
- Updates grace usage array
- Saves to Firestore
- Shows banners/alerts

**Current Test Coverage**: State mutations NOT verified

### 3. Edge Cases

- What if grace expires exactly on the day it's needed?
- What if user has 1.99 graces worth (rounding)?
- What if streak is exactly 7 on soft penalty day?
- What if adherence is exactly 30% or 40%?

**Current Test Coverage**: Edge cases NOT tested

## Confidence Level Assessment

### Before This Analysis
**Confidence**: High ✅ (154 tests passing)

### After This Analysis
**Confidence**: ⚠️ **MEDIUM-LOW** for overnight rollover logic

**Why**:
- ✅ Pure functions tested well
- ✅ Optimistic UI coordination simulated
- ❌ Actual overnight rollover paths NOT tested
- ❌ Soft penalty path has 0 tests
- ❌ Grace application in overnight context has 0 tests
- ❌ Hard reset in overnight context has 0 tests
- ❌ 30-day journey through REAL rollover has 0 tests

## Recommendation

### Option 1: Manual Testing Protocol (Faster)
Create a detailed manual test protocol covering all 7 overnight paths.

### Option 2: Integration Tests (Better)
Write integration tests that actually invoke `applyRolloverOnce()` with realistic state.

### Option 3: Both (Recommended)
- Write integration tests for critical paths (soft penalty, grace, reset)
- Manual test the full 30-day journey

## Conclusion

While we have **154 passing tests**, they primarily cover:
- ✅ Pure utility functions
- ✅ Simulated optimistic UI flow

They do NOT cover:
- ❌ Actual overnight rollover logic (7 paths)
- ❌ Soft penalty scenarios
- ❌ Grace application in overnight context
- ❌ Hard reset in overnight context
- ❌ 30-day journey through real rollover

**Answer to User's Question**:
No, the current test suite does NOT adequately cover soft penalties, hard resets, and the 2-grace-per-7-days flow in the actual overnight rollover context for 30 days.

**Confidence in Current Implementation**: Medium (simulations work, but actual context untested)

**Recommended Action**: Add integration tests or comprehensive manual testing before production deployment.
