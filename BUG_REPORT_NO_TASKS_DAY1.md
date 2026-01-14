# 🚨 BUG REPORT - No Tasks Display on Signup (Day 1)

## Issue Description

**Observed Behavior:**
- New user signs up
- Accepts legal terms/privacy
- Dashboard shows: "120 calm points" but **NO TASKS** for the day
- Expected: 5 tasks to select from during onboarding, OR at minimum 3 recommended tasks showing

**Severity:** CRITICAL (onboarding broken)
**Reproduction:** 100% reproducible (affects all new users)

---

## Root Cause Analysis

### Code Flow for New User Day 1

```
1. Signup.js creates user with:
   - calmPoints: 120 ✓
   - streak: 1
   - tasks: [3 default items] ✓
   - urges: []
   - todayPicks: NOT SET (undefined in Firestore)
   
2. App loads Dashboard
   
3. Dashboard.js line 30-40 calculates picks:
   const picks = (() => {
     const saved = todayPicks[currentDay];  // currentDay = 1
     if (Array.isArray(saved) && saved.length > 0) return saved;  // FALSE: todayPicks[1] undefined
     if (currentDay > 7) {  // FALSE: currentDay = 1
       return getGeneratedTasks(currentDay).map(t => t.task);
     }
     return getDailyRecommendations(3).map(t => t.title);  // ← SHOULD RETURN 3 TASKS
   })();
```

### Why getDailyRecommendations Might Return Empty

Checking the function at line 785 in AppContext.js:

```javascript
const getDailyRecommendations = (count = 6) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentUrges = urges.filter(u => u.timestamp >= sevenDaysAgo);  // [] for new user
  const prefs = { social: 0, mind: 0, focus: 0, physical: 0, morning: 0, creative: 0 };
  
  // Score tasks based on urges
  const scored = TASK_CATALOG.map(t => {
    let score = 0;
    score += prefs[t.category] || 0;  // All scores = 0 initially
    const meta = TASK_METADATA[t.title] || { friction: 'med' };
    if (streak < 4 && meta.friction === 'low') score += 2;  // Should add 2 for low-friction
    if (streak >= 4 && t.category === 'focus') score += 1;
    return { ...t, score };
  }).sort((a,b) => b.score - a.score);

  return scored.slice(0, count);  // Should return 3 items (TASK_CATALOG has 13 items)
};
```

**Expected:** Should return array of 3 task objects with scores

---

## Potential Root Causes

### Theory 1: TASK_METADATA Missing
If `TASK_METADATA` is undefined or empty, the scoring might fail. Let me check if this exists and is properly initialized.

**Check needed:** Does TASK_METADATA exist in AppContext.js and has entries for all tasks?

### Theory 2: getDailyRecommendations Called Before AppContext Ready
If AppContext hasn't finished initializing, functions might return empty.

**Check needed:** Is there a loading/initialization delay?

### Theory 3: My Atomic Lock Changes Broke Something
I added `streakEvaluatedForDay` state variable. Possible issues:
- Did I accidentally modify `getDailyRecommendations` during edits? ❌ No, I didn't touch it
- Did I break the context provider? ❌ Code location is far from getDailyRecommendations
- Did I change any dependencies? ❌ I only added new state, no dependency changes

**Likelihood:** Very low (my changes are isolated to streak logic)

### Theory 4: todayPicks Not Initialized on Load
When `loadUserData()` runs, if `todayPicks` is undefined in Firestore, local state might stay undefined.

**Check needed:** Does `loadUserData()` properly default `todayPicks` to `{}`?

---

## Code Review Needed

### 1. Check loadUserData() in AppContext.js (around line 320)

**Current code should look like:**
```javascript
setTodayPicks(data.todayPicks || {});  // Default to empty object
```

**If it says:** 
```javascript
setTodayPicks(data.todayPicks);  // No default!
```
This would cause `todayPicks = undefined`, breaking calculations.

### 2. Check if TASK_METADATA exists

Search for: `const TASK_METADATA =` in AppContext.js

If missing or empty, `getDailyRecommendations()` would fail when accessing `TASK_METADATA[title]`

### 3. Check Dashboard.js getDailyRecommendations call

Line 39 in Dashboard.js:
```javascript
return getDailyRecommendations(3).map(t => t.title);
```

If `getDailyRecommendations(3)` returns `[]`, then `.map()` returns `[]`, and `picks = []`.

### 4. Verify Week 1 Onboarding Modal

Even if `picks` is empty on dashboard, the user should see Week 1 onboarding modal (line 127-250 in Dashboard.js):

```javascript
if (day === 1 && !week1SetupDone) {
  setShowOnboarding(true);  // Should show modal to select 5 tasks
}
```

If this modal isn't showing, that's a separate bug.

---

## Symptoms to Check

When user is on Dashboard after signup, ask:

1. **Is the Week 1 onboarding modal visible?** (titled "Set Your Week 1 Anchors")
   - If YES: Bug might only be visual (tasks don't show on main dashboard, but modal works)
   - If NO: Onboarding logic broken

2. **Do they see a button to "View Today's Program"?**
   - If YES: Click it, does Program show tasks?
   - If NO: UI rendering broken

3. **What does the screen actually show?**
   - Just calm points and "120 calm points"?
   - Or is there empty task area?

---

## What I Didn't Change

✅ `getDailyRecommendations()` - untouched
✅ `loadUserData()` - didn't modify todayPicks loading
✅ `TASK_CATALOG` - untouched
✅ `TASK_METADATA` - untouched
✅ Dashboard.js - untouched
✅ Signup.js - untouched

---

## What I Did Change (Potentially Relevant)

❌ Added `streakEvaluatedForDay` state variable
- Location: Line 97 in AppContext.js
- Reason: For streak bug fix
- Side effects on tasks: **NONE** (completely separate concern)

❌ Updated `loadUserData()` at line 331
- Added: `if (typeof data.streakEvaluatedForDay === 'number') setStreakEvaluatedForDay(data.streakEvaluatedForDay);`
- This is AFTER the todayPicks line, so shouldn't affect it

---

## Most Likely Scenarios

### Scenario A: Pre-existing bug, not caused by me
User's issue might be unrelated to my changes:
- Firestore saved new user doc without `todayPicks` field
- `loadUserData()` doesn't default it to `{}`
- Dashboard gets undefined todayPicks

### Scenario B: My changes corrupted file during save
Unlikely but possible:
- JSON formatting error in AppContext.js
- Syntax error breaking the file
- Dependencies messed up

**Check:** `get_errors` should catch this

### Scenario C: Network/Cloud issue
New user doc hasn't synced yet:
- Signup saves to Firestore
- Dashboard loads before Firestore responds
- `loadUserData()` gets empty result

**Check:** Look at Firestore console, verify user doc exists

---

## Immediate Actions Required

Before fixing anything, I need to verify:

1. **Are there syntax errors?** Run `get_errors`
2. **What does the Firestore document show for new user?** Check console
3. **What does `todayPicks` actually contain?** Add debug logging
4. **Is TASK_METADATA properly initialized?** Search AppContext.js
5. **What does loadUserData do with todayPicks?** Check line ~320
6. **Did my changes somehow break file structure?** Review my edits

---

## Hypothesis for Discussion

Based on code review, I believe the issue is **NOT caused by my atomic lock changes**, but rather:

1. **Most likely:** `todayPicks` not defaulting to `{}` on new user load → undefined → calculations fail
2. **Also possible:** TASK_METADATA is missing or empty
3. **Less likely:** My changes somehow corrupted the file (get_errors should catch)

---

## Requested Actions

✅ **DO NOT FIX YET**

**Wait for user clarification on:**
- Does Week 1 onboarding modal appear? (this would tell us if logic works at all)
- What's actually visible on the screen after signup?
- Can they navigate to Program screen?

Then I'll know exactly where to look before making changes.

