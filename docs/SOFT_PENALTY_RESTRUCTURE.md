# Soft Penalty Logic Restructuring - Summary

## 🎯 What Was Done

Restructured the rollover penalty system to make **soft penalty** functional and properly tested.

---

## 🐛 Problem Identified

The original soft penalty code (Case 4 in AppContext.js) was **unreachable dead code**:

### Why It Was Dead Code:
```
Case 1: Met threshold (≥60%) → return early
Case 2: Grace band (30-60%) → ALL branches return early
  - 2a: Grace available → Apply grace, return
  - 2b: Already used grace → return
  - 2c: Grace unavailable → Hold streak, return ← Returns here!
Case 3: Very low (<30%) → return early
Case 4: Soft penalty ← NEVER REACHED!
```

The grace band (Case 2) covered the entire 30-60% range and returned in all scenarios, so Case 4 at 40-60% could **never** execute.

---

## ✅ Solution Implemented

### Restructured Logic:

Moved soft penalty into **Case 2c** (grace unavailable):

```javascript
// Case 2c: Grace unavailable
if (streak >= 7 && adherencePrev >= 0.4) {
  // Soft penalty: -1 streak
  streak = streak - 1;
  return;
} else {
  // Hold: no change
  return;
}
```

### New Flow:

1. **Case 1:** Met threshold (≥60%) → Streak +1
2. **Case 2:** Grace band (30-60%)
   - **2a:** Grace available → Apply grace, streak +1
   - **2b:** Already used grace → Return (protected)
   - **2c:** Grace unavailable → Check soft penalty conditions:
     - If streak ≥7 AND adherence ≥40%: **Streak -1** (soft penalty)
     - Else: **Streak holds** (no change)
3. **Case 3:** Very low (<30%) → Streak = 0 (hard reset)

---

## 📊 Soft Penalty Rules

**Soft penalty applies when ALL conditions are met:**
1. ✅ Adherence in grace band: **30-60%** (trying but not meeting threshold)
2. ✅ Grace unavailable: **2 active graces** in rolling 7-day window
3. ✅ Established streak: **≥7 days**
4. ✅ Reasonable effort: **≥40% adherence**

**Result:** Streak drops by **1** (not reset to 0)

---

## 📈 Examples

### Example 1: Soft Penalty Applied
- **Day 10:** Streak = 10
- **Adherence:** 50% (3/6 tasks)
- **Threshold:** 60%
- **Active graces:** 2 (Day 6 expires Day 13, Day 8 expires Day 15)
- **Result:** Streak = 9 (soft penalty)
- **Message:** "Streak dipped by 1 — rebuild momentum today. Grace unavailable (used recently)."

### Example 2: Streak Holds (No Soft Penalty)
- **Day 5:** Streak = 4
- **Adherence:** 33% (2/6 tasks)
- **Threshold:** 50%
- **Active graces:** 2
- **Result:** Streak = 4 (holds, no change)
- **Why:** Streak < 7 (doesn't meet soft penalty requirement)
- **Message:** "Day 5: 2/6 tasks (33%). Grace unavailable (used recently). Streak holding at 4."

### Example 3: Grace Applied (No Soft Penalty)
- **Day 10:** Streak = 10
- **Adherence:** 50%
- **Threshold:** 60%
- **Active graces:** 0
- **Result:** Streak = 11 via grace
- **Why:** Grace available (not unavailable)

---

## 🧪 Testing

### Files Updated:
1. **`src/context/AppContext.js`**: Restructured Case 2c, removed dead Case 4/5 code (lines 1280-1308)
2. **`src/utils/__tests__/rolloverLogic.test.js`**: Created comprehensive rollover logic tests

### Test Coverage:
- ✅ **29 rollover-specific tests** covering all 5 cases
- ✅ **49 streak calculation tests** (original)
- ✅ **14 AuthContext tests** (original)
- **Total: 92/92 tests passing** ✅

### Test Scenarios:
- Onboarding leniency (Days 1-2)
- Met threshold (50%/60%/65%/70% at different day ranges)
- Grace application (30-60% band, grace available)
- Grace unavailable with soft penalty (streak ≥7, adherence ≥40%)
- Grace unavailable without soft penalty (streak <7 or adherence <40%)
- Hard reset (<30% adherence)
- Edge cases (grace expiration, 0 tasks, already counted days)
- Comprehensive multi-day scenarios

---

## 🎮 Updated System Rules

### Complete Penalty/Reward Table:

| Adherence | Grace Available? | Streak | Result |
|-----------|------------------|--------|--------|
| ≥60% (threshold) | Any | Any | ✅ +1 (advance) |
| 30-60% | Yes (<2 active) | Any | ✅ +1 via grace |
| 30-60% | No (2 active) | ≥7, ≥40% | 🟡 -1 (soft penalty) |
| 30-60% | No (2 active) | <7 or <40% | ⚪ Hold (no change) |
| <30% | Any | Any | 🔴 = 0 (hard reset) |
| Days 1-2, 1+ task | Any | Any | ✅ +1 (leniency) |

---

## 🔗 Related Files

### Implementation:
- `src/context/AppContext.js:1280-1308` - Restructured grace unavailable logic with soft penalty

### Tests:
- `src/utils/__tests__/rolloverLogic.test.js` - Comprehensive rollover logic tests (29 tests)
- `src/utils/__tests__/streakCalculations.test.js` - Pure function tests (49 tests)
- `src/context/__tests__/AuthContext.test.js` - Auth integration tests (14 tests)

### Documentation:
- `GRACE_SYSTEM_TESTING_GUIDE.md` - Updated with soft penalty scenarios

---

## 🎯 Impact

### Before:
- Soft penalty was **dead code** (never executed)
- Grace band with 2 active graces → Always held streak (no consequences)
- No differentiation between established streaks (≥7) and new streaks (<7)

### After:
- Soft penalty is **functional** and tested
- Grace band with 2 active graces → Nuanced behavior:
  - **Established streaks with effort** (≥7 days, ≥40%) → -1 penalty
  - **New streaks or low effort** (<7 days or <40%) → Hold
- More balanced progression system rewarding consistency

---

## ✅ Verification

Run tests to verify:
```bash
npm test
```

Expected: **92/92 tests passing** ✅

All penalty and grace scenarios are now properly tested and functional!
