# Streak System Test Cases

## Setup
- Start with a fresh user or reset program start date
- Use testing controls to advance days
- Check Dashboard for streak number and rollover banner
- Check Program screen for task marking

---

## Test Case 1: Day 1-2 Same-Day Advancement (Leniency Rule)
**Goal:** Verify that marking 1 task on Day 1-2 advances streak immediately.

### Steps:
1. **Day 1:**
   - Initial streak: 0
   - Mark 1 task
   - **Expected:** Streak advances to 1 immediately (same-day)
   - **Expected:** Alert shows "Streak advanced — strong start. Keep locking anchors."
   - Mark/unmark more tasks if desired
   - **Expected:** Streak stays at 1 (no duplicate increment on same day)

2. **Advance to Day 2:**
   - **Expected:** No rollover banner (Day 1 already counted)
   - Mark 1 task on Day 2
   - **Expected:** Streak advances to 2 immediately
   - **Expected:** No duplicate increment later

3. **Result:** ✅ Pass if streak = 2, no double increments

---

## Test Case 2: Day 3+ Threshold Met Same-Day
**Goal:** Verify threshold-based advancement (50% for Day 3-7).

### Steps:
1. **Day 3:**
   - Assigned tasks: 5 (threshold = 50% = 3 tasks needed)
   - Initial streak: 2
   - Mark 1 task: **Expected:** "Complete 2 more tasks to reach today's threshold"
   - Mark 2nd task: **Expected:** "Complete 1 more task to reach today's threshold"
   - Mark 3rd task: **Expected:** Streak advances to 3 immediately
   - **Expected:** Alert shows "Streak advanced — consistency is compounding."
   - Mark 4th task: **Expected:** Streak stays at 3 (no duplicate)

2. **Advance to Day 4:**
   - **Expected:** No rollover banner (Day 3 already counted)
   - **Expected:** Streak still 3

3. **Result:** ✅ Pass if streak = 3, advanced on 3rd task only

---

## Test Case 3: Grace Applied Overnight (30%-49% adherence)
**Goal:** Verify grace applies overnight when adherence is 30-49% and grace available.

### Steps:
1. **Day 4:**
   - Assigned: 5 tasks, threshold = 50% (3 needed), grace band = 30-49% (2 tasks)
   - Initial streak: 3
   - Mark 2 tasks only (40% adherence)
   - **Expected:** "Complete 1 more task to reach today's threshold. Grace checked overnight."
   - **Do NOT mark 3rd task** - stay at 2/5

2. **Advance to Day 5 (rollover happens):**
   - **Expected:** Rollover banner appears with blue border, scale icon
   - **Expected:** Banner title: "Grace Applied"
   - **Expected:** Message: "Grace applied for Day 4. You completed 2/5 tasks (needed 3). Streak held at 4. One grace per week — make today count!"
   - **Expected:** Streak = 4 (incremented overnight via grace)
   - Dismiss banner
   - **Expected:** Banner disappears and doesn't reappear

3. **Result:** ✅ Pass if grace applied once, streak = 4, banner dismissible

---

## Test Case 4: Grace Unavailable (Used Recently)
**Goal:** Verify streak breaks when grace is unavailable and below threshold.

### Steps:
1. **Day 5:**
   - Initial streak: 4 (grace used on Day 4)
   - Assigned: 5 tasks, threshold = 50%
   - Mark 2 tasks only (40% adherence, in grace band)
   - **Do NOT complete threshold**

2. **Advance to Day 6:**
   - **Expected:** No grace banner (grace used within last 7 days)
   - **Expected:** Message: "Grace unavailable (used recently). Aim higher today to keep momentum."
   - **Expected:** Streak dips by 1 → streak = 3 (soft penalty for streak ≥7, or breaks if lower)
   - Since streak was 4, no dip occurs (only applies when streak ≥7)
   - **Expected:** Streak stays at 4 with message about falling short

3. **Result:** ✅ Pass if grace not applied twice, streak held or adjusted correctly

---

## Test Case 5: Streak Reset (<30% adherence)
**Goal:** Verify streak resets to 0 when adherence < 30% overnight.

### Steps:
1. **Day 6:**
   - Initial streak: 4
   - Assigned: 5 tasks (30% = 1.5 tasks, need 2+ for grace band)
   - Mark 0 or 1 task only (0-20% adherence)

2. **Advance to Day 7:**
   - **Expected:** Rollover banner with red border, alert icon
   - **Expected:** Banner title: "Streak Reset"
   - **Expected:** Message: "Streak reset. Day 6: 0/5 tasks completed. Start fresh today with small wins."
   - **Expected:** Alert modal shows same message
   - **Expected:** Streak = 0
   - Dismiss banner

3. **Result:** ✅ Pass if streak = 0, banner + alert shown

---

## Test Case 6: No Double Increment (Same Day + Rollover Guard)
**Goal:** Verify that marking threshold today does NOT also increment overnight.

### Steps:
1. **Day 7:**
   - Initial streak: 0
   - Assigned: 5 tasks, threshold = 50%
   - Mark 3 tasks (meets threshold)
   - **Expected:** Streak advances to 1 immediately
   - **Expected:** lastStreakDayCounted = 7

2. **Advance to Day 8:**
   - **Expected:** Rollover checks Day 7, sees lastStreakDayCounted = 7
   - **Expected:** Rollover skips increment (already counted)
   - **Expected:** Banner shows "Yesterday counted already — keep momentum today." (or no banner)
   - **Expected:** Streak still 1 (no double increment)

3. **Result:** ✅ Pass if streak = 1, no double increment

---

## Test Case 7: Rollover Banner Dismissal Persistence
**Goal:** Verify banner dismissal persists across navigation.

### Steps:
1. **Day 8:**
   - Mark tasks to advance streak (e.g., 3/5)
   - Streak advances to 2

2. **Advance to Day 9:**
   - **Expected:** No rollover banner (Day 8 counted same-day)

3. **Navigate:** Dashboard → Program → Stats → Dashboard
   - **Expected:** No banner reappears (dismissal remembered for Day 8)

4. **Result:** ✅ Pass if banner doesn't reappear after dismissal + navigation

---

## Test Case 8: Grace Window (1 per Rolling 7 Days)
**Goal:** Verify grace is only available once per 7-day window.

### Steps:
1. **Day 9:**
   - Mark 2/5 tasks (40% adherence, grace band)

2. **Advance to Day 10:**
   - **Expected:** Grace applied (if none used in Days 3-9)
   - Streak advances via grace

3. **Day 10:**
   - Mark 2/5 tasks again

4. **Advance to Day 11:**
   - **Expected:** Grace NOT applied (used on Day 9)
   - **Expected:** Streak dips or soft penalty message

5. **Result:** ✅ Pass if grace limited to 1 per rolling 7 days

---

## Test Case 9: Variety Formula (Categories/8)
**Goal:** Verify variety calculation uses uniqueCategories/8.

### Steps:
1. **Any Day:**
   - Mark 3 tasks from 3 different categories (Morning, Physical, Mind)
   - Navigate to Stats

2. **Stats Screen:**
   - **Expected:** Insights show "Variety: Morning, Physical, Mind (3/8)"
   - **Expected:** Variety chart shows 37-38% for today

3. **Result:** ✅ Pass if variety = 3/8 and category names displayed

---

## Test Case 10: Completions Graph Y-Axis (No Missing Labels)
**Goal:** Verify Y-axis shows consecutive integers (0,1,2,3,4,5,6).

### Steps:
1. **Mark tasks across multiple days:**
   - Day 1: 1 task
   - Day 2: 2 tasks
   - Day 3: 3 tasks
   - Day 4: 4 tasks
   - Day 5: 6 tasks

2. **Navigate to Stats:**
   - Check Completions vs Target graph
   - **Expected:** Y-axis labels: 0, 1, 2, 3, 4, 5, 6 (no gaps)

3. **Result:** ✅ Pass if all integers shown consecutively

---

## Quick Checklist
- [ ] Day 1-2: 1 task advances streak same-day
- [ ] Day 3+: Threshold met advances streak same-day
- [ ] Grace applies overnight (30-49% adherence)
- [ ] Grace limited to 1 per 7 days
- [ ] Streak resets overnight (<30% adherence)
- [ ] No double increment (same-day + rollover guard)
- [ ] Rollover banner shows correct type (advance/grace/reset)
- [ ] Banner dismissible and doesn't reappear
- [ ] Variety shows category names (X/8)
- [ ] Completions graph Y-axis has no gaps

---

## Expected Behaviors Summary

| Day | Action | Same-Day Result | Overnight Result (Next Day) | Banner Type |
|-----|--------|-----------------|------------------------------|-------------|
| 1-2 | 1 task | Streak +1 | No rollover increment | None (or "already counted") |
| 3+ | Meet threshold | Streak +1 | No rollover increment | None (or "already counted") |
| 3+ | 30-49% adherence | Guidance only | Grace → Streak +1 (if available) | Grace (blue) |
| 3+ | <30% adherence | Warning | Streak reset to 0 | Reset (red) |
| Any | Mark/unmark same day | Max 1 increment per day | No duplicate | None |

---

## Notes for Developer
- Use TestingControls component to advance days quickly
- Check lastStreakDayCounted in context to verify guards
- Check graceDayDates array for grace usage tracking
- Check rolloverBannerInfo for banner state
- All state persists to Firestore, so refresh won't lose progress
