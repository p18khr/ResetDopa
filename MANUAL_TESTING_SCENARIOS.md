# Manual Testing Scenarios - Grace System
## Rolling 7-Day Grace Window

Follow these scenarios step-by-step in the running app to verify the grace system works correctly.

---

## 🛠️ Setup Instructions

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Navigate to Settings** → Testing Controls

3. **Enable Grace Debug panel:** Click "Grace Debug" button

4. **Start fresh:** Click "Start Fresh (Day 1)" button

---

## 📋 Test Scenario 1: Basic Grace Application

**Goal:** Verify grace is applied when falling into grace band (30-60%)

### Steps:

1. **Day 1:** Complete 3/5 tasks (60%)
   - Action: Mark 3 tasks as done
   - Click "Advance Day (+1)"

2. **Expected Result - Day 2:**
   - ✅ Streak = 1
   - ✅ Banner: "Streak advanced overnight"
   - Grace Debug: Active Graces: 0/2

3. **Day 2:** Complete 2/5 tasks (40% - grace band)
   - Action: Mark 2 tasks as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 3:**
   - ✅ Streak = 2
   - ✅ Banner: "Grace applied for Day 2. You completed 2/5 tasks (needed 3). Streak advanced to 2 via grace. Max 2 graces in rolling 7-day window — make today count!"
   - Grace Debug:
     - Active Graces: 1/2
     - Days Used (active): 2
     - Grace History: Day 2 → expires Day 9 (active)

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 2: Second Grace Application

**Goal:** Verify second grace can be applied while first is still active

### Prerequisites:
- Continue from Scenario 1 (Day 3, Streak 2, 1 grace active)

### Steps:

1. **Day 3:** Complete 4/6 tasks (67% - meets threshold)
   - Action: Mark 4 tasks as done
   - Click "Advance Day (+1)"

2. **Expected Result - Day 4:**
   - ✅ Streak = 3
   - ✅ Banner: "Streak advanced overnight — great consistency!"
   - Grace Debug: Active Graces: 1/2 (still Day 2 grace)

3. **Day 4:** Complete 2/6 tasks (33% - grace band)
   - Action: Mark 2 tasks as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 5:**
   - ✅ Streak = 4
   - ✅ Banner: "Grace applied for Day 4..."
   - Grace Debug:
     - Active Graces: 2/2 ⚠️ AT LIMIT
     - Days Used (active): 2, 4
     - Grace History:
       - Day 2 → expires Day 9 (active)
       - Day 4 → expires Day 11 (active)

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 3: Grace Unavailable - Hold Streak

**Goal:** Verify streak holds when 2 graces active, streak < 7, adherence in grace band

### Prerequisites:
- Continue from Scenario 2 (Day 5, Streak 4, 2 graces active)

### Steps:

1. **Day 5:** Complete 2/6 tasks (33% - grace band)
   - Action: Mark 2 tasks as done
   - Click "Advance Day (+1)"

2. **Expected Result - Day 6:**
   - ✅ Streak = 4 (HOLDS - no change)
   - ✅ Banner: "Day 5: 2/6 tasks (33%). Grace unavailable (used recently). Streak holding at 4."
   - Grace Debug:
     - Grace Available: NO
     - Active Graces: 2/2
     - Next Available: Day 9 (when first grace expires)

3. **Day 6:** Complete 2/6 tasks (33% - grace band)
   - Action: Mark 2 tasks as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 7:**
   - ✅ Streak = 4 (HOLDS again)
   - ✅ Banner: "Day 6: 2/6 tasks (33%). Grace unavailable (used recently). Streak holding at 4."
   - Grace Debug: Still 2/2 active graces

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 4: Grace Expiration - Becomes Available Again

**Goal:** Verify grace expires after 7 days and becomes available

### Prerequisites:
- Continue from Scenario 3 (Day 7, Streak 4)
- First grace (Day 2) expires on Day 9

### Steps:

1. **Days 7-8:** Complete 4/6 tasks each day (67% - meets threshold)
   - Action: Mark 4 tasks as done each day
   - Click "Advance Day (+1)" twice

2. **Expected Result - Day 9:**
   - ✅ Streak = 6
   - Grace Debug:
     - Active Graces: 1/2 (Day 2 grace expired!)
     - Days Used (active): 4 only
     - Grace History shows Day 2 as (expired)

3. **Day 9:** Complete 2/6 tasks (33% - grace band)
   - Action: Mark 2 tasks as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 10:**
   - ✅ Streak = 7
   - ✅ Banner: "Grace applied for Day 9..."
   - Grace Debug:
     - Active Graces: 2/2 (Day 4 still active, Day 9 new)
     - Days Used (active): 4, 9

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 5: Soft Penalty (Streak ≥7, Adherence ≥40%)

**Goal:** Verify soft penalty (-1) applies when streak ≥7, adherence ≥40%, grace unavailable

### Prerequisites:
- Continue from Scenario 4 (Day 10, Streak 7, 2 graces active)

### Steps:

1. **Day 10:** Complete 3/6 tasks (50% - grace band, ≥40%)
   - Action: Mark 3 tasks as done
   - Click "Advance Day (+1)"

2. **Expected Result - Day 11:**
   - ✅ Streak = 6 (DROPPED BY 1! Soft penalty)
   - ✅ Banner: "Streak dipped by 1 — rebuild momentum today. Grace unavailable (used recently)."
   - Grace Debug:
     - Active Graces: 2/2 (Day 4 expired, but Day 9 and Day 10 active? NO - only Day 9 active)
     - Wait, Day 4 expires Day 11, so on Day 10 it's still active
     - So we should have 2 active: Day 4 (expires 11) and Day 9 (expires 16)

3. **Verify soft penalty criteria:**
   - Streak before: 7 (≥7 ✓)
   - Adherence: 50% (≥40% ✓)
   - Grace available: NO (2 active ✓)
   - Result: Streaked dropped from 7 → 6 ✓

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 6: Hard Reset (<30% Adherence)

**Goal:** Verify streak resets to 0 when adherence drops below 30%

### Setup:
- Click "Start Fresh (Day 1)"
- Build streak to Day 5

### Steps:

1. **Days 1-4:** Complete 4/5 or 4/6 tasks each day
   - Action: Mark tasks as done
   - Advance to Day 5

2. **Verify - Day 5:**
   - Streak should be 4

3. **Day 5:** Complete 1/6 tasks (16.7% < 30%)
   - Action: Mark only 1 task as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 6:**
   - ✅ Streak = 0 (HARD RESET)
   - ✅ Banner: "Streak reset. Day 5: 1/6 tasks completed. Start fresh today with small wins."
   - ✅ Alert popup: "Streak Reset"
   - Grace Debug: Graces unchanged (reset happens regardless of graces)

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 7: Multiple Missed Days

**Goal:** Verify rolling window when user doesn't open app for multiple days

### Setup:
- Click "Start Fresh (Day 1)"

### Steps:

1. **Days 1-6:** Complete all tasks properly
   - Action: Complete 3/5 or 4/6 tasks each day
   - Build 6-day streak

2. **Verify - Day 7:**
   - Streak = 6
   - Grace Debug: 0 graces used

3. **Simulate missing 3 days:** Use "Advance Day" button 3 times WITHOUT completing tasks
   - Click "Advance Day" → Day 8 (0 tasks)
   - Click "Advance Day" → Day 9 (0 tasks)
   - Click "Advance Day" → Day 10 (0 tasks)

4. **Expected Result - Day 10:**
   - Console logs should show:
     ```
     Day 7: 0% → Grace #1 applied (expires Day 14)
     Day 8: 0% → Grace #2 applied (expires Day 15)
     Day 9: 0% → NO GRACE AVAILABLE → STREAK RESET
     ```
   - ✅ Streak = 0 (reset on Day 9)
   - ✅ Banner: "Streak reset due to 3 missed days..."
   - Grace Debug:
     - Active Graces: 2/2 (Days 7-8 still show if < Day 14-15)

### Result: ✅ PASS / ❌ FAIL

---

## 📋 Test Scenario 8: Onboarding Leniency (Days 1-2)

**Goal:** Verify Days 1-2 advance with just 1 task completed

### Setup:
- Click "Start Fresh (Day 1)"

### Steps:

1. **Day 1:** Complete ONLY 1/5 tasks (20%)
   - Action: Mark 1 task as done
   - Click "Advance Day (+1)"

2. **Expected Result - Day 2:**
   - ✅ Streak = 1 (advanced with onboarding leniency!)
   - ✅ Banner: "Streak advanced overnight — strong start!"
   - Grace Debug: 0 graces used (leniency, not grace)

3. **Day 2:** Complete ONLY 1/5 tasks (20%)
   - Action: Mark 1 task as done
   - Click "Advance Day (+1)"

4. **Expected Result - Day 3:**
   - ✅ Streak = 2 (advanced with onboarding leniency again!)
   - Grace Debug: 0 graces used

5. **Day 3:** Complete ONLY 1/6 tasks (16.7% < 30%)
   - Action: Mark 1 task as done
   - Click "Advance Day (+1)"

6. **Expected Result - Day 4:**
   - ✅ Streak = 0 (RESET - no more leniency after Day 2)
   - ✅ Banner: "Streak reset. Day 3: 1/6 tasks completed..."

### Result: ✅ PASS / ❌ FAIL

---

## 🔍 Debugging Tips

If a scenario fails:

1. **Check Grace Debug Panel:**
   - Active grace count correct?
   - Expiration days calculated correctly?
   - Next available day matches expectations?

2. **Check Console Logs** (Dev mode):
   - Look for `[Rollover Day X]` logs
   - `[Grace Check Day X]` logs
   - `[Grace Apply Day X]` logs

3. **Check Banner Messages:**
   - Do they match expected text?
   - Is the math correct (X/Y tasks, needed Z)?

4. **Common Issues:**
   - Grace not expiring? Check day number vs expiration day
   - Soft penalty not applying? Verify streak ≥7 AND adherence ≥40%
   - Graces not available? Check if 2 are already active

---

## 📊 Test Results Summary

Fill in after testing:

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Basic Grace Application | ⬜ | |
| 2. Second Grace Application | ⬜ | |
| 3. Grace Unavailable - Hold | ⬜ | |
| 4. Grace Expiration | ⬜ | |
| 5. Soft Penalty | ⬜ | |
| 6. Hard Reset | ⬜ | |
| 7. Multiple Missed Days | ⬜ | |
| 8. Onboarding Leniency | ⬜ | |

**Overall Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 Success Criteria

All scenarios should **PASS** with:
- Correct streak values
- Correct grace counts
- Expected banner messages
- Proper grace expiration
- Soft penalty applies when expected
- Hard reset when < 30%

---

**Ready to test!** Follow each scenario in order and mark PASS/FAIL. 🚀
