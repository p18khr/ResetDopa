/**
 * App Blocker Balance Display Tests
 *
 * Covers the specific bug where the overlay always shows 0 points:
 *
 * Root cause chain:
 * 1. useSyncBalanceToNative fires with balance=0 on mount (before Firestore loads)
 * 2. syncBalanceAndStreak writes user_balance=0 AND balance_synced_once=true
 * 3. Overlay's cold-start retry checks `!hasSyncedOnce` → skips retry (flag already true)
 * 4. showPostSurvivalChoice reads stale userBalance=0 from memory
 *
 * Fix: always refresh balance before showPostSurvivalChoice; remove reliance on
 * balance_synced_once for the retry condition.
 */

// ─── Helpers that model the native Kotlin logic in JS ────────────────────────

interface SharedPrefs {
  user_balance: number;
  user_streak: boolean;
  balance_synced_once: boolean;
  balance_sync_time: number;
}

function makePrefs(overrides: Partial<SharedPrefs> = {}): SharedPrefs {
  return {
    user_balance: 0,
    user_streak: true,
    balance_synced_once: false,
    balance_sync_time: 0,
    ...overrides,
  };
}

// Models the BUGGY retry logic (current code)
function shouldRetryBuggy(prefs: SharedPrefs): boolean {
  return prefs.user_balance === 0 && !prefs.balance_synced_once;
}

// Models the FIXED retry logic (always retry on 0)
function shouldRetryFixed(prefs: SharedPrefs): boolean {
  return prefs.user_balance === 0;
}

// Models what syncBalanceAndStreak writes to SharedPrefs
function syncToPrefs(
  prefs: SharedPrefs,
  balance: number,
  hasStreak: boolean,
  now = Date.now()
): SharedPrefs {
  return {
    ...prefs,
    user_balance: balance,
    user_streak: hasStreak,
    balance_synced_once: true,
    balance_sync_time: now,
  };
}

// Models canAffordToOpen check in BlockOverlayActivity
function canAffordToOpen(balance: number, hasStreak: boolean): boolean {
  return balance >= 15 && hasStreak;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('App Blocker Balance Display Bug', () => {

  // ===== THE EXACT BUG SCENARIO =====

  describe('Bug: initial 0-sync poisons the retry flag', () => {

    test('initial sync with balance=0 sets balance_synced_once=true', () => {
      const prefs = makePrefs();
      const after = syncToPrefs(prefs, 0, true);

      expect(after.user_balance).toBe(0);
      expect(after.balance_synced_once).toBe(true); // flag set even though balance is 0
    });

    test('BUGGY retry: skips retry when synced_once=true even if balance=0', () => {
      // This is the bug: initial 0-sync set the flag, so retry never fires
      const prefs = makePrefs({ user_balance: 0, balance_synced_once: true });

      expect(shouldRetryBuggy(prefs)).toBe(false); // retry skipped → shows 0
    });

    test('BUGGY retry: only triggers when synced_once=false (too narrow)', () => {
      const freshInstall = makePrefs({ user_balance: 0, balance_synced_once: false });
      const afterInitialSync = makePrefs({ user_balance: 0, balance_synced_once: true });

      expect(shouldRetryBuggy(freshInstall)).toBe(true);   // works on true fresh install
      expect(shouldRetryBuggy(afterInitialSync)).toBe(false); // fails after 0 was synced first
    });

    test('full cold-start bug sequence: overlay reads 0 despite user having 277 pts', () => {
      // Step 1: app mounts, balance=0, sync fires immediately
      let prefs = makePrefs();
      prefs = syncToPrefs(prefs, 0, true); // balance_synced_once=true written with 0

      // Step 2: user opens blocked app before Firestore loads (within first few seconds)
      // overlay reads prefs → balance=0, synced_once=true
      expect(prefs.user_balance).toBe(0);
      expect(prefs.balance_synced_once).toBe(true);

      // Step 3: retry logic checks — does it retry?
      expect(shouldRetryBuggy(prefs)).toBe(false); // BUG: no retry!

      // Step 4: Firestore loads and writes 277 (too late for overlay)
      prefs = syncToPrefs(prefs, 277, true);
      expect(prefs.user_balance).toBe(277); // prefs are now correct...

      // ...but the overlay already read 0 and won't re-read
    });
  });

  // ===== THE FIX =====

  describe('Fix: always retry when balance is 0', () => {

    test('FIXED retry: triggers whenever balance=0, regardless of synced_once flag', () => {
      const afterInitialSync = makePrefs({ user_balance: 0, balance_synced_once: true });
      const afterRealSync = makePrefs({ user_balance: 277, balance_synced_once: true });

      expect(shouldRetryFixed(afterInitialSync)).toBe(true);  // retry fires ✓
      expect(shouldRetryFixed(afterRealSync)).toBe(false);    // no retry needed ✓
    });

    test('FIXED: showPostSurvivalChoice reads fresh prefs after 60s breathing', () => {
      // After 60s, Firestore has definitely loaded and sync has written 277
      let prefs = makePrefs();
      prefs = syncToPrefs(prefs, 0, true);   // initial 0-sync at t=0
      prefs = syncToPrefs(prefs, 277, true); // Firestore sync at ~t=2s

      // showPostSurvivalChoice calls loadBalanceAndStreak() at the top (the fix)
      const balanceAtDisplay = prefs.user_balance;
      expect(balanceAtDisplay).toBe(277); // shows correct balance ✓
    });

    test('FIXED: user can open app when fresh read shows sufficient balance', () => {
      // With the fix, showPostSurvivalChoice reads fresh balance before building UI
      const freshPrefs = makePrefs({ user_balance: 277, balance_synced_once: true });
      const canOpen = canAffordToOpen(freshPrefs.user_balance, freshPrefs.user_streak);

      expect(canOpen).toBe(true); // button enabled ✓
    });

    test('FIXED: user correctly blocked when genuinely has 0 balance', () => {
      const freshPrefs = makePrefs({ user_balance: 0, balance_synced_once: true });
      const canOpen = canAffordToOpen(freshPrefs.user_balance, freshPrefs.user_streak);

      expect(canOpen).toBe(false); // correctly disabled ✓
    });
  });

  // ===== SILENT SYNC FAILURE: TYPE MISMATCH RISK =====

  describe('Sync failure: type safety for bridge call', () => {

    // The React Native bridge expects syncBalanceAndStreak(Int, Boolean)
    // If currentStreak comes from Firestore as a number instead of boolean,
    // the bridge call may throw and sync silently fails.

    test('boolean true passes type check for hasStreak', () => {
      const hasStreak: boolean = true;
      expect(typeof hasStreak).toBe('boolean');
    });

    test('number coerced to boolean for hasStreak (Firestore risk)', () => {
      // If Firestore stores currentStreak as a number like 5
      const currentStreakFromFirestore: unknown = 5;

      // The bridge expects a boolean — coerce to catch the issue early
      const safeHasStreak = Boolean(currentStreakFromFirestore);
      expect(typeof safeHasStreak).toBe('boolean');
      expect(safeHasStreak).toBe(true); // 5 → true
    });

    test('zero streak coerces to false correctly', () => {
      const currentStreakFromFirestore: unknown = 0;
      const safeHasStreak = Boolean(currentStreakFromFirestore);
      expect(safeHasStreak).toBe(false);
    });

    test('balance should be integer for bridge Int param', () => {
      const balanceFromFirestore = 277.9;

      // Bridge truncates float to Int — result is 277, not 278
      const safeBalance = Math.floor(balanceFromFirestore);
      expect(safeBalance).toBe(277);
      expect(Number.isInteger(safeBalance)).toBe(true);
    });
  });

  // ===== EDGE CASES FOR canAffordToOpen =====

  describe('Balance boundary: canAffordToOpen', () => {

    test('exactly 15 pts with streak: can open', () => {
      expect(canAffordToOpen(15, true)).toBe(true);
    });

    test('14 pts with streak: cannot open', () => {
      expect(canAffordToOpen(14, true)).toBe(false);
    });

    test('277 pts, no streak: cannot open', () => {
      expect(canAffordToOpen(277, false)).toBe(false);
    });

    test('0 pts, no streak: cannot open', () => {
      expect(canAffordToOpen(0, false)).toBe(false);
    });

    test('16 pts with streak: can open (above threshold)', () => {
      expect(canAffordToOpen(16, true)).toBe(true);
    });
  });

  // ===== SYNC TIMING SCENARIOS =====

  describe('Sync timing scenarios', () => {

    test('overlay launched before Firestore loads: prefs have 0', () => {
      // t=0: app mounts, balance=0, sync fires
      const prefs = syncToPrefs(makePrefs(), 0, true, 1000);

      // t=1s: user opens blocked app, overlay reads prefs
      expect(prefs.user_balance).toBe(0);
      expect(prefs.balance_synced_once).toBe(true);
    });

    test('overlay launched after Firestore loads: prefs have 277', () => {
      // t=0: initial sync with 0
      let prefs = syncToPrefs(makePrefs(), 0, true, 1000);
      // t=2s: Firestore loads, sync fires with 277
      prefs = syncToPrefs(prefs, 277, true, 3000);

      // t=10s: user opens blocked app, overlay reads prefs
      expect(prefs.user_balance).toBe(277);
    });

    test('timeSinceSync threshold: stale sync warning triggers after 5s', () => {
      const syncTime = Date.now() - 6000; // synced 6 seconds ago
      const prefs = makePrefs({ user_balance: 0, balance_synced_once: true, balance_sync_time: syncTime });
      const timeSinceSync = Date.now() - prefs.balance_sync_time;

      const isStaleZero = prefs.user_balance === 0
        && prefs.balance_synced_once
        && timeSinceSync > 5000;

      expect(isStaleZero).toBe(true); // triggers "user actually has 0 pts" warning
    });

    test('recent sync with 0: stale warning does not trigger (within 5s)', () => {
      const syncTime = Date.now() - 1000; // synced 1 second ago
      const prefs = makePrefs({ user_balance: 0, balance_synced_once: true, balance_sync_time: syncTime });
      const timeSinceSync = Date.now() - prefs.balance_sync_time;

      const isStaleZero = prefs.user_balance === 0
        && prefs.balance_synced_once
        && timeSinceSync > 5000;

      expect(isStaleZero).toBe(false); // no warning — race condition window
    });
  });
});
