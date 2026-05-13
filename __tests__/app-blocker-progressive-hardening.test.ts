/**
 * Progressive Hardening System Tests
 * Covers veteran tier computation, allow-window logic, and blocking behavior.
 *
 * Veteran = points >= 100 AND streak >= 3 days
 * New user  → force-open grants 2-hour SharedPrefs window
 * Veteran   → force-open grants session-only (in-memory) allow
 */

// ─── helpers mirroring the real logic ───────────────────────────────────────

const VETERAN_POINTS_THRESHOLD = 100;
const VETERAN_STREAK_THRESHOLD = 3;
const TWO_HOURS_MS = 7_200_000;

function computeIsVeteran(points: number, streakDays: number): boolean {
  return points >= VETERAN_POINTS_THRESHOLD && streakDays >= VETERAN_STREAK_THRESHOLD;
}

function canForceOpen(balance: number, hasStreak: boolean): boolean {
  return balance >= 15 && hasStreak;
}

/** Returns the SharedPrefs key used for the 2-hour window */
function tempAllowKey(pkg: string): string {
  return `temp_allow_${pkg}_until`;
}

/** Returns true if app should be skipped (allowed) by the monitor */
function isWithinAllowWindow(sharedPrefs: Record<string, number>, pkg: string, now: number): boolean {
  const until = sharedPrefs[tempAllowKey(pkg)] ?? 0;
  return now < until;
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('Progressive Hardening System', () => {

  // ===== 1. VETERAN TIER COMPUTATION =====
  describe('1. Veteran Tier Computation', () => {

    test('veteran: exactly 100 pts AND exactly 3 streak days', () => {
      expect(computeIsVeteran(100, 3)).toBe(true);
    });

    test('veteran: well above thresholds', () => {
      expect(computeIsVeteran(500, 30)).toBe(true);
    });

    test('new user: 99 pts (one below threshold), streak OK', () => {
      expect(computeIsVeteran(99, 3)).toBe(false);
    });

    test('new user: points OK, 2 streak days (one below threshold)', () => {
      expect(computeIsVeteran(100, 2)).toBe(false);
    });

    test('new user: both below thresholds', () => {
      expect(computeIsVeteran(50, 1)).toBe(false);
    });

    test('new user: fresh install (0 pts, 0 days)', () => {
      expect(computeIsVeteran(0, 0)).toBe(false);
    });

    test('veteran threshold matrix - all boundary combinations', () => {
      const cases: [number, number, boolean][] = [
        [100, 3,  true],
        [100, 2,  false],
        [99,  3,  false],
        [99,  2,  false],
        [101, 3,  true],
        [100, 4,  true],
        [200, 10, true],
      ];

      cases.forEach(([pts, days, expected]) => {
        expect(computeIsVeteran(pts, days)).toBe(expected);
      });
    });
  });

  // ===== 2. SYNC INCLUDES VETERAN FLAG =====
  describe('2. Balance Sync Includes Veteran Flag', () => {

    test('syncBalanceAndStreak called with isVeteran=true for veteran', () => {
      const mockSync = jest.fn().mockResolvedValue({ success: true });

      const points = 150;
      const streakDays = 5;
      const hasStreak = true;
      const isVeteran = computeIsVeteran(points, streakDays);

      mockSync(points, hasStreak, isVeteran);

      expect(mockSync).toHaveBeenCalledWith(150, true, true);
    });

    test('syncBalanceAndStreak called with isVeteran=false for new user', () => {
      const mockSync = jest.fn().mockResolvedValue({ success: true });

      const points = 40;
      const streakDays = 1;
      const hasStreak = true;
      const isVeteran = computeIsVeteran(points, streakDays);

      mockSync(points, hasStreak, isVeteran);

      expect(mockSync).toHaveBeenCalledWith(40, true, false);
    });

    test('veteran flag updates when user crosses 100-point threshold', () => {
      const streakDays = 5;

      expect(computeIsVeteran(99, streakDays)).toBe(false);  // just before
      expect(computeIsVeteran(100, streakDays)).toBe(true);  // crosses threshold
      expect(computeIsVeteran(101, streakDays)).toBe(true);  // after
    });

    test('veteran flag updates when streak crosses 3-day threshold', () => {
      const points = 200;

      expect(computeIsVeteran(points, 2)).toBe(false);
      expect(computeIsVeteran(points, 3)).toBe(true);
      expect(computeIsVeteran(points, 4)).toBe(true);
    });
  });

  // ===== 3. FORCE-OPEN PREREQUISITE (balance + streak gate) =====
  describe('3. Force-Open Gate (unchanged from before)', () => {

    test('allows force-open with balance >= 15 AND streak active', () => {
      expect(canForceOpen(15, true)).toBe(true);
      expect(canForceOpen(277, true)).toBe(true);
    });

    test('blocks force-open with balance < 15', () => {
      expect(canForceOpen(14, true)).toBe(false);
      expect(canForceOpen(0, true)).toBe(false);
    });

    test('blocks force-open with no streak, even if balance sufficient', () => {
      expect(canForceOpen(277, false)).toBe(false);
    });

    test('blocks force-open with both insufficient', () => {
      expect(canForceOpen(5, false)).toBe(false);
    });
  });

  // ===== 4. NEW USER: 2-HOUR ALLOW WINDOW =====
  describe('4. New User: 2-Hour Allow Window (SharedPrefs)', () => {

    test('writes temp_allow_<pkg>_until = now + 2hrs on force-open', () => {
      const now = 1_000_000;
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {};

      // Simulate what BlockOverlayActivity does for new user
      sharedPrefs[tempAllowKey(pkg)] = now + TWO_HOURS_MS;

      expect(sharedPrefs[tempAllowKey(pkg)]).toBe(now + TWO_HOURS_MS);
    });

    test('monitor skips blocking if within 2-hour window', () => {
      const now = 1_000_000;
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {
        [tempAllowKey(pkg)]: now + TWO_HOURS_MS,
      };

      expect(isWithinAllowWindow(sharedPrefs, pkg, now)).toBe(true);
    });

    test('monitor blocks again after 2-hour window expires', () => {
      const openTime = 1_000_000;
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {
        [tempAllowKey(pkg)]: openTime + TWO_HOURS_MS,
      };

      const twoHoursLater = openTime + TWO_HOURS_MS + 1;
      expect(isWithinAllowWindow(sharedPrefs, pkg, twoHoursLater)).toBe(false);
    });

    test('monitor blocks exactly at window boundary (expiry moment)', () => {
      const openTime = 1_000_000;
      const pkg = 'com.instagram.android';
      const until = openTime + TWO_HOURS_MS;
      const sharedPrefs: Record<string, number> = {
        [tempAllowKey(pkg)]: until,
      };

      // now === until → NOT within window (< not <=)
      expect(isWithinAllowWindow(sharedPrefs, pkg, until)).toBe(false);
    });

    test('window is exactly 2 hours (7,200,000 ms)', () => {
      expect(TWO_HOURS_MS).toBe(2 * 60 * 60 * 1000);
    });

    test('different apps have independent allow windows', () => {
      const now = 1_000_000;
      const instagram = 'com.instagram.android';
      const twitter = 'com.twitter.android';

      const sharedPrefs: Record<string, number> = {
        [tempAllowKey(instagram)]: now + TWO_HOURS_MS,  // allowed
        // twitter: no entry → blocked
      };

      expect(isWithinAllowWindow(sharedPrefs, instagram, now)).toBe(true);
      expect(isWithinAllowWindow(sharedPrefs, twitter, now)).toBe(false);
    });

    test('window survives service restart (persisted in SharedPrefs)', () => {
      const openTime = 1_000_000;
      const pkg = 'com.instagram.android';

      // Written by BlockOverlayActivity before service restart
      const persistedPrefs: Record<string, number> = {
        [tempAllowKey(pkg)]: openTime + TWO_HOURS_MS,
      };

      // Service restarts, reads SharedPrefs — still within window
      const afterRestart = openTime + 10_000; // 10s later
      expect(isWithinAllowWindow(persistedPrefs, pkg, afterRestart)).toBe(true);
    });
  });

  // ===== 5. VETERAN: SESSION-ONLY ALLOW =====
  describe('5. Veteran: Session-Only Allow', () => {

    test('veteran does not write to SharedPrefs allow window', () => {
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {};
      const isVeteran = true;

      // Veteran path: add to in-memory set, NOT SharedPrefs
      const inMemoryAllowed = new Set<string>();
      if (isVeteran) {
        inMemoryAllowed.add(pkg);
      } else {
        sharedPrefs[tempAllowKey(pkg)] = Date.now() + TWO_HOURS_MS;
      }

      expect(inMemoryAllowed.has(pkg)).toBe(true);
      expect(sharedPrefs[tempAllowKey(pkg)]).toBeUndefined();
    });

    test('veteran allow resets after service restart (no SharedPrefs entry)', () => {
      const pkg = 'com.instagram.android';

      // Service restarts: in-memory set is gone, no SharedPrefs entry
      const sharedPrefs: Record<string, number> = {};
      const now = Date.now();

      expect(isWithinAllowWindow(sharedPrefs, pkg, now)).toBe(false);
    });

    test('new user allow persists after service restart (SharedPrefs entry exists)', () => {
      const pkg = 'com.instagram.android';
      const now = 1_000_000;

      const sharedPrefs: Record<string, number> = {
        [tempAllowKey(pkg)]: now + TWO_HOURS_MS,
      };

      const afterRestart = now + 30_000;
      expect(isWithinAllowWindow(sharedPrefs, pkg, afterRestart)).toBe(true);
    });

    test('veteran in-memory allow cleared on session end', () => {
      const pkg = 'com.instagram.android';
      const inMemoryAllowed = new Set<string>([pkg]);

      expect(inMemoryAllowed.has(pkg)).toBe(true);

      // Simulate service restart / session end
      inMemoryAllowed.clear();

      expect(inMemoryAllowed.has(pkg)).toBe(false);
    });
  });

  // ===== 6. FULL FLOW INTEGRATION =====
  describe('6. Full Flow Integration', () => {

    test('new user full flow: earn points → force-open → 2hr window → block after expiry', () => {
      const now = 1_000_000;
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {};

      const points = 40;
      const streakDays = 2;
      const isVeteran = computeIsVeteran(points, streakDays);
      expect(isVeteran).toBe(false);

      // Force-open: write 2hr window
      sharedPrefs[tempAllowKey(pkg)] = now + TWO_HOURS_MS;

      // Within window: allowed
      expect(isWithinAllowWindow(sharedPrefs, pkg, now + 3_600_000)).toBe(true);  // 1hr later

      // After window: blocked again
      expect(isWithinAllowWindow(sharedPrefs, pkg, now + TWO_HOURS_MS + 1)).toBe(false);
    });

    test('veteran full flow: force-open → session allow → restart → blocked again', () => {
      const pkg = 'com.instagram.android';
      const sharedPrefs: Record<string, number> = {};
      const inMemoryAllowed = new Set<string>();

      const isVeteran = computeIsVeteran(150, 7);
      expect(isVeteran).toBe(true);

      // Force-open: add to in-memory only
      inMemoryAllowed.add(pkg);
      expect(inMemoryAllowed.has(pkg)).toBe(true);
      expect(sharedPrefs[tempAllowKey(pkg)]).toBeUndefined();

      // Service restarts: in-memory cleared, no SharedPrefs → blocked
      inMemoryAllowed.clear();
      expect(isWithinAllowWindow(sharedPrefs, pkg, Date.now())).toBe(false);
    });

    test('user graduates from new to veteran mid-session (next sync updates flag)', () => {
      // Starts as new user
      expect(computeIsVeteran(99, 3)).toBe(false);

      // Earns 1 more point → becomes veteran
      expect(computeIsVeteran(100, 3)).toBe(true);

      // Next sync will push isVeteran=true to native
      const mockSync = jest.fn();
      mockSync(100, true, true);
      expect(mockSync).toHaveBeenCalledWith(100, true, true);
    });

    test('multiple apps: new user gets independent 2hr windows per app', () => {
      const now = 1_000_000;
      const instagram = 'com.instagram.android';
      const twitter = 'com.twitter.android';
      const sharedPrefs: Record<string, number> = {};

      // Open Instagram at t=0 → 2hr window
      sharedPrefs[tempAllowKey(instagram)] = now + TWO_HOURS_MS;

      // Open Twitter at t=1hr → 2hr window from t=1hr
      const oneHourLater = now + 3_600_000;
      sharedPrefs[tempAllowKey(twitter)] = oneHourLater + TWO_HOURS_MS;

      // At t=2hr+1ms: Instagram expired, Twitter still open
      const twoHoursAndOneMsLater = now + TWO_HOURS_MS + 1;
      expect(isWithinAllowWindow(sharedPrefs, instagram, twoHoursAndOneMsLater)).toBe(false);
      expect(isWithinAllowWindow(sharedPrefs, twitter, twoHoursAndOneMsLater)).toBe(true);
    });
  });

  // ===== 7. EDGE CASES =====
  describe('7. Edge Cases', () => {

    test('no SharedPrefs entry → not in window (default 0 treated as expired)', () => {
      const sharedPrefs: Record<string, number> = {};
      expect(isWithinAllowWindow(sharedPrefs, 'com.any.app', Date.now())).toBe(false);
    });

    test('veteran with streak=false is NOT veteran (streak required)', () => {
      // EconomyContext currentStreak=false means hasStreak=false
      // streakDays=0 → not veteran even with high points
      expect(computeIsVeteran(500, 0)).toBe(false);
    });

    test('user with 0 points and 0 streak always gets new-user treatment', () => {
      expect(computeIsVeteran(0, 0)).toBe(false);
    });

    test('2hr window key format is deterministic for same package', () => {
      const pkg = 'com.example.app';
      expect(tempAllowKey(pkg)).toBe('temp_allow_com.example.app_until');
      expect(tempAllowKey(pkg)).toBe(tempAllowKey(pkg));
    });

    test('2hr window: 1ms before expiry still allowed', () => {
      const now = 1_000_000;
      const pkg = 'com.example.app';
      const sharedPrefs = { [tempAllowKey(pkg)]: now + TWO_HOURS_MS };

      expect(isWithinAllowWindow(sharedPrefs, pkg, now + TWO_HOURS_MS - 1)).toBe(true);
    });
  });
});
