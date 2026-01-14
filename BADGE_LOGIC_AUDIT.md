# Badge Logic Audit - Critical Issues Found

## ❌ Issue 1: Hardcoded Baseline Badges Mismatch

**Problem:**
- New users created with baseline badges: `b1` (Awareness Rising), `b2` (Deep Worker)
- checkAndClaimBadges checks for badges: `first_day`, `streak_3`, `streak_7`, `streak_30`, etc.
- **These badge IDs don't match!**

**Scenario:**
1. New user signs up
2. Badges initialized: `[{ id: 'b1', got: true }, { id: 'b2', got: false }]`
3. User completes first day
4. checkAndClaimBadges runs, checks `!badges.some(b => b.id === 'first_day' && b.got)`
5. `first_day` badge doesn't exist, so condition is TRUE
6. claimBadge('first_day') called
7. Badge NOT FOUND in badges array (idx = -1)
8. Fallback logic appends it: `[{ id: 'b1', got: true }, { id: 'b2', got: false }, { id: 'first_day', title: 'Badge', got: true }]`
9. **Result**: Duplicates badges array with mix of old and new badge IDs ❌

**Impact:**
- `b1` and `b2` are never claimed even if criteria met
- Real achievement badges (`first_day`, `streak_3`, etc.) get added dynamically
- Inconsistent badge state in Firestore
- UI might show wrong badges

---

## ❌ Issue 2: Badge Check Logic Doesn't Account for Missing Badges

**Problem in checkAndClaimBadges:**
```javascript
if (!badges.some(b => b.id === 'first_day' && b.got)) {
  badgesToClaim.push('first_day');
}
```

When new user has `[{ id: 'b1', ... }, { id: 'b2', ... }]`, this correctly identifies `first_day` as unclaimed. But the condition is:
- TRUE if badge doesn't exist at all
- TRUE if badge exists but `got: false`
- FALSE if badge exists and `got: true`

This is correct logic, but **doesn't initialize the badge correctly on creation**.

---

## ❌ Issue 3: New User Badge Initialization is Wrong

**Signup.js Lines 112-115:**
```javascript
badges: [
  { id: 'b1', title: 'Awareness Rising', got: true },
  { id: 'b2', title: 'Deep Worker', got: false },
],
```

**Should be initialized as:**
```javascript
badges: [
  { id: 'first_day', title: 'First Day', got: false },
  { id: 'streak_3', title: '3-Day Streak', got: false },
  { id: 'streak_7', title: '7-Day Streak', got: false },
  { id: 'streak_30', title: '30-Day Streak', got: false },
  { id: 'streak_90', title: '90-Day Streak', got: false },
  { id: 'tasks_10', title: '10 Tasks Done', got: false },
  { id: 'tasks_50', title: '50 Tasks Completed', got: false },
  { id: 'tasks_100', title: '100 Tasks', got: false },
  { id: 'calm_100', title: '100 Calm Points', got: false },
  { id: 'calm_500', title: '500 Calm Points', got: false },
  { id: 'calm_1000', title: '1000 Calm Points', got: false },
  { id: 'urge_resist_10', title: '10 Urges Resisted', got: false },
  { id: 'urge_resist_50', title: '50 Urges Resisted', got: false },
]
```

---

## ❌ Issue 4: Task Completion Badge Check Has Logic Error

**Problem in checkAndClaimBadges (Line 1097):**
```javascript
const completedTasks = (tasksVal || []).filter(t => t.done).length;
if (completedTasks >= 10 && !badges.some(b => b.id === 'tasks_10' && b.got)) {
  badgesToClaim.push('tasks_10');
}
```

**Issue:**
- `tasksVal` is the default tasks array: `[{ id: 't1', ... }, { id: 't2', ... }, { id: 't3', ... }]`
- It counts tasks WHERE `t.done === true`
- But in the app, completed tasks are tracked in `todayCompletions` state, NOT in `tasks` array
- `tasks` array is a STATIC template, not updated with completion status

**Result**: This badge will NEVER trigger because `tasks` are never marked as done ❌

**Should check:**
```javascript
// Count total completed tasks from ALL days
const completedCount = Object.values(todayCompletions).reduce((sum, dayMap) => {
  return sum + Object.values(dayMap).filter(Boolean).length;
}, 0);
```

---

## ⚠️ Issue 5: Calm Points Badge Might Trigger Multiple Times

**Problem:**
- checkAndClaimBadges is called frequently (on every state change)
- Each call checks: `!badges.some(b => b.id === 'calm_100' && b.got)`
- If somehow badge is unclaimed, it gets added to badgesToClaim
- claimBadge is called multiple times

**But** the check `!badges.some(b => b.id === 'calm_100' && b.got)` should prevent duplicates...

**Actual issue:** If checkAndClaimBadges is called multiple times in same render cycle, badgesToClaim could be built multiple times before setBadges completes.

**Example:**
1. calmPoints changes from 99 → 100
2. checkAndClaimBadges called
3. badgesToClaim = ['calm_100']
4. claimBadge('calm_100') called
5. setBadges updates state (async)
6. Before state updates, checkAndClaimBadges called AGAIN
7. Reads OLD badges state (still missing calm_100)
8. Builds badgesToClaim = ['calm_100'] again
9. claimBadge called twice
10. Duplicate notifications

**Result**: Multiple notifications for single achievement ⚠️

---

## Fix Priority

1. **CRITICAL**: Fix badge initialization in Signup.js - use correct badge IDs
2. **CRITICAL**: Fix task completion count - use todayCompletions not tasks array
3. **HIGH**: Add deduplication logic to prevent multiple claimBadge calls in same cycle
4. **MEDIUM**: Verify all other badge criteria are using correct state variables

---

## Summary

**Currently broken:**
- ❌ Task completion badges (tasks_10, tasks_50, tasks_100) will NEVER unlock
- ❌ New user badges initialized with wrong IDs
- ❌ Badge state gets mixed with old b1/b2 and new achievement badges
- ⚠️ Potential for duplicate notifications
- ⚠️ checkAndClaimBadges called too frequently without debounce

**Rating: 3/10** - Badge system is fundamentally broken

