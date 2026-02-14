# Quick Reference - Expected Behaviors
## For Manual Testing

---

## 🎯 Adherence Thresholds

| Day Range | Threshold | What You Need |
|-----------|-----------|---------------|
| Days 1-7 | 50% | 3/5 or 3/6 tasks |
| Days 8-14 | 60% | 3/5 or 4/6 tasks |
| Days 15-21 | 65% | 4/6 tasks |
| Days 22+ | 70% | 5/6 tasks |

---

## 🎮 What Happens Based on Performance

### ✅ Above Threshold (≥60%)
→ **Streak +1** (advances)

### 🟡 Grace Band (30-60%)
**With grace available (<2 active):**
→ **Grace applied, Streak +1**
→ Grace expires in 7 days

**With 2 active graces:**
- **Streak ≥7 AND adherence ≥40%:** Streak -1 (soft penalty)
- **Streak <7 OR adherence <40%:** Streak holds (no change)

### 🔴 Below 30%
→ **Streak = 0** (hard reset)

### 🌟 Days 1-2 Special
**1+ task completed:**
→ **Streak +1** (onboarding leniency)

---

## 📊 Grace System Rules

### Maximum Graces
**2 graces** in any rolling 7-day window

### Grace Duration
Each grace expires **7 days** after use
- Used Day 5 → Expires Day 12
- Used Day 7 → Expires Day 14

### Grace Expiration
Old graces automatically expire and don't count toward the 2-grace limit

---

## 🔍 What to Check in Grace Debug Panel

### Active Graces: X/2
- **0/2** = 2 graces available
- **1/2** = 1 grace available
- **2/2** = NO grace available ⚠️

### Days Used (active)
Shows which days have active (not expired) graces

### Next Available Day
Shows when next grace becomes available
- If 0 or 1 active: Current day
- If 2 active: Day when oldest expires

### Grace History
Lists all graces with expiration status:
- `(active)` = Still counts toward limit
- `(expired)` = No longer counts

---

## 📝 Example Streak Math

### Example 1: Day 8 with 3/6 tasks
- Adherence: 50%
- Threshold: 60%
- **Result:** Grace band → Apply grace (if available)

### Example 2: Day 8 with 2/6 tasks
- Adherence: 33.3%
- Threshold: 60%
- **Result:** Grace band → Apply grace (if available)

### Example 3: Day 8 with 1/6 tasks
- Adherence: 16.7%
- Threshold: 60%
- **Result:** <30% → Hard reset

### Example 4: Day 10, Streak 10, 2 graces active, 3/6 tasks
- Adherence: 50%
- Threshold: 60%
- Streak ≥7 ✓, Adherence ≥40% ✓, Grace unavailable ✓
- **Result:** Soft penalty → Streak becomes 9

---

## 🚨 Common Scenarios

### Scenario: Miss 1 day with graces available
→ Grace applied, streak continues

### Scenario: Miss 2 days with 0 graces
→ 2 graces applied, streak continues

### Scenario: Miss 3 days with 0 graces
→ Graces applied on days 1-2, RESET on day 3

### Scenario: 2 graces active, good streak (≥7), decent effort (≥40%)
→ Soft penalty (-1) when missing threshold

### Scenario: 2 graces active, new streak (<7)
→ Streak holds (no penalty)

### Scenario: Below 30% adherence
→ ALWAYS resets, regardless of graces

---

## ✅ Testing Checklist

Quick checks for each test:

- [ ] Streak value matches expected?
- [ ] Banner message correct?
- [ ] Grace count correct in debug panel?
- [ ] Grace expiration days calculated correctly?
- [ ] No console errors?
- [ ] Behavior matches the rules above?

---

## 🎯 Quick Streak States

| State | Symbol | What It Means |
|-------|--------|---------------|
| Advancing | ✅ +1 | Met threshold or grace applied |
| Soft penalty | 🟡 -1 | Streak ≥7, adherence ≥40%, no grace |
| Holding | ⚪ No change | Grace band, no grace, low streak |
| Hard reset | 🔴 = 0 | Below 30% adherence |

---

**Keep this reference handy while testing!** 📋
