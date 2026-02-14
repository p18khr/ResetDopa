// src/utils/streakCalculations.js
// Pure functions for streak calculation logic

/**
 * Compute current program day (1..30+) from start date
 * @param {string} startDate - ISO date string
 * @param {number} devDayOffset - Dev offset for testing
 * @returns {number} Current day number (1-based)
 */
export function getCurrentDay(startDate, devDayOffset = 0) {
  const sd = startDate ? new Date(startDate) : new Date();
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const startMid = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.floor((nowMid - startMid) / msPerDay) + 1 + (devDayOffset || 0);
  return Math.max(diff, 1);
}

/**
 * Progressive threshold function - returns required adherence percentage for a given day
 * @param {number} day - Program day number
 * @returns {number} Threshold (0.0-1.0)
 */
export function getRampThreshold(day) {
  if (day <= 7) return 0.5;   // 50% during Week 1
  if (day <= 14) return 0.6;  // 60% during Week 2
  if (day <= 21) return 0.65; // 65% during Week 3
  if (day > 30) return 0.6;   // 60% in maintenance
  return 0.7;                 // 70% during Week 4
}

/**
 * Generate task picks for a given day using rotation logic
 * @param {number} dayNumber - Day to generate picks for
 * @param {Object} todayPicks - Existing picks map
 * @returns {string[]} Array of task titles for the day
 */
export function generatePicksForDay(dayNumber, todayPicks = {}) {
  const existing = todayPicks[dayNumber];
  if (Array.isArray(existing) && existing.length > 0) return existing;

  const MAINTENANCE_ROTATIONS = [
    ['10-min walk', '5-min breathing', 'Plan tomorrow 3-min', 'Text a friend'],
    ['Light stretch 5-min', '2-min tidy', 'Identity check-in', 'Gratitude x3'],
    ['Detox 30-min (screen-free)', 'Sip water often', 'Calm breath 4 cycles', 'Note 1 win'],
  ];

  // Post-Day 30: Use maintenance rotations
  if (dayNumber > 30) {
    return MAINTENANCE_ROTATIONS[(dayNumber - 31) % MAINTENANCE_ROTATIONS.length];
  }

  // Find most recent day with picks
  let fallback = [];
  for (let d = dayNumber - 1; d >= 1; d--) {
    const prior = todayPicks[d];
    if (Array.isArray(prior) && prior.length > 0) {
      fallback = prior;
      break;
    }
  }

  // Default fallback if no prior picks found
  if (!fallback || fallback.length === 0) {
    fallback = ['5 min breathing', 'Stretch 2 min', '2-min tidy'];
  }

  return fallback;
}

/**
 * Calculate rolling adherence score over a window of days
 * @param {number} currentDay - Current program day
 * @param {Object} todayPicks - Map of day -> task picks
 * @param {Object} todayCompletions - Map of day -> completion map
 * @param {number} windowDays - Number of days to look back
 * @returns {number} Adherence score (0.0-1.0)
 */
export function getAdherence(currentDay, todayPicks, todayCompletions, windowDays = 3) {
  let assignedSum = 0;
  let doneSum = 0;

  for (let d = Math.max(1, currentDay - windowDays + 1); d <= currentDay; d++) {
    const picks = todayPicks[d] || [];
    const assignedCount = picks.length > 0 ? picks.length : (d <= 7 ? 5 : 6);
    const doneMap = todayCompletions[d] || {};
    const doneCount = Object.values(doneMap).filter(Boolean).length;
    assignedSum += assignedCount;
    doneSum += doneCount;
  }

  if (assignedSum === 0) return 0;
  return doneSum / assignedSum;
}

/**
 * Check for missed days between last evaluated day and current day
 * Uses rolling 7-day grace window: max 2 graces in any 7-day period
 * @param {number} currentDay - Current program day
 * @param {number} lastEvaluatedDay - Last day that was evaluated
 * @param {Object} completionsState - Completion map
 * @param {Object} todayPicks - Task picks map
 * @param {Array<Object>} graceUsages - Array of {usedOnDay, expiresOnDay} objects
 * @returns {Object} Missed days analysis with updated grace usages
 */
export function checkMissedDays(currentDay, lastEvaluatedDay, completionsState, todayPicks, graceUsages = []) {
  const missedDays = [];

  // Check each day between last evaluated and current
  for (let day = lastEvaluatedDay + 1; day < currentDay; day++) {
    const picks = generatePicksForDay(day, todayPicks);
    const assignedCount = picks.length > 0 ? picks.length : (day <= 7 ? 5 : 6);
    const doneMap = completionsState[day] || {};
    const doneCount = Object.values(doneMap).filter(Boolean).length;
    const adherence = assignedCount === 0 ? 0 : doneCount / assignedCount;
    const threshold = getRampThreshold(day);

    // Onboarding leniency: Days 1-2 get pass if any task done
    if (day <= 2 && doneCount >= 1) {
      continue; // This day is OK
    }

    // Check if day failed threshold
    if (adherence < threshold) {
      missedDays.push(day);
    }
  }

  // No missed days - streak safe
  if (missedDays.length === 0) {
    return {
      missedDays: [],
      shouldResetStreak: false,
      graceUsages,
    };
  }

  // Process missed days with rolling 7-day grace window
  let currentGraceUsages = [...graceUsages];

  for (const missedDay of missedDays) {
    // Remove expired graces (older than 7 days from missed day)
    currentGraceUsages = currentGraceUsages.filter(g => missedDay < g.expiresOnDay);

    // Check if grace available (less than 2 active graces in rolling window)
    if (currentGraceUsages.length < 2) {
      // Use grace for this missed day
      currentGraceUsages.push({
        usedOnDay: missedDay,
        expiresOnDay: missedDay + 7, // Grace expires 7 days after usage
      });
    } else {
      // No grace available - streak must reset
      return {
        missedDays,
        shouldResetStreak: true,
        graceUsages: currentGraceUsages,
        gracesUsedInWindow: currentGraceUsages.length,
      };
    }
  }

  // All missed days covered by grace
  return {
    missedDays,
    shouldResetStreak: false,
    graceUsages: currentGraceUsages,
  };
}

/**
 * Evaluate streak progress for a day and return evaluation result
 * @param {Object} params - Evaluation parameters
 * @param {number} params.dayNumber - Day to evaluate
 * @param {Object} params.completionsState - Completion map
 * @param {number} params.streak - Current streak value
 * @param {Object} params.todayPicks - Task picks map
 * @param {number} params.streakEvaluatedForDay - Last evaluated day
 * @param {number} params.rolloverBannerDismissedDay - Last dismissed banner day
 * @param {Array<Object>} params.graceUsages - Array of {usedOnDay, expiresOnDay} grace objects
 * @returns {Object|null} Evaluation result or null if already evaluated
 */
export function evaluateStreakProgress({
  dayNumber,
  completionsState,
  streak,
  todayPicks,
  streakEvaluatedForDay,
  rolloverBannerDismissedDay,
  graceUsages = [],
}) {
  // Already evaluated for this day
  if (streakEvaluatedForDay === dayNumber && streakEvaluatedForDay > 0) {
    return {
      alreadyEvaluated: true,
      message: 'Threshold already counted today — keep momentum going.',
    };
  }

  // Check for missed days if there's a gap
  if (dayNumber > streakEvaluatedForDay + 1) {
    const missedDaysAnalysis = checkMissedDays(
      dayNumber,
      streakEvaluatedForDay,
      completionsState,
      todayPicks,
      graceUsages
    );

    if (missedDaysAnalysis.shouldResetStreak) {
      const activeGraces = graceUsages.filter(g => dayNumber < g.expiresOnDay).length;
      const msg = `Streak reset due to ${missedDaysAnalysis.missedDays.length} missed days (2 graces in rolling 7-day window, ${activeGraces} active). Starting fresh.`;
      return {
        streakReset: true,
        newStreak: 0,
        message: msg,
        missedDays: missedDaysAnalysis.missedDays,
        updates: {
          graceUsages: [],
          lastStreakDayCounted: 0,
          streakEvaluatedForDay: dayNumber,
          lastStreakMessage: msg,
        },
      };
    } else if (missedDaysAnalysis.missedDays.length > 0) {
      // Used grace days but streak preserved - update grace usages
      graceUsages = missedDaysAnalysis.graceUsages;
    }
  }

  const picks = generatePicksForDay(dayNumber, todayPicks);
  const assignedCount = picks.length > 0 ? picks.length : (dayNumber <= 7 ? 5 : 6);
  const doneMap = completionsState[dayNumber] || {};
  const doneCount = Object.values(doneMap).filter(Boolean).length;
  const adherence = assignedCount === 0 ? 0 : doneCount / assignedCount;
  const threshold = getRampThreshold(dayNumber);
  const tasksNeeded = Math.ceil(threshold * assignedCount);

  // Early onboarding leniency (Days 1-2: any 1 task counts)
  if (dayNumber <= 2 && doneCount >= 1) {
    const newStreakVal = streak + 1;
    const msg = 'Streak advanced — strong start. Keep locking anchors.';
    const bannerInfo = rolloverBannerDismissedDay !== dayNumber
      ? { day: dayNumber, type: 'advance', message: msg }
      : null;

    return {
      streakAdvanced: true,
      newStreak: newStreakVal,
      message: msg,
      bannerInfo,
      updates: {
        graceUsages,
        lastStreakDayCounted: dayNumber,
        streakEvaluatedForDay: dayNumber,
        lastStreakMessage: msg,
        rolloverBannerInfo: bannerInfo,
      },
    };
  }

  // Met threshold - streak advances
  if (adherence >= threshold) {
    const newStreakVal = streak + 1;
    const msg = 'Streak advanced — consistency is compounding.';
    const bannerInfo = rolloverBannerDismissedDay !== dayNumber
      ? { day: dayNumber, type: 'advance', message: msg }
      : null;

    return {
      streakAdvanced: true,
      newStreak: newStreakVal,
      message: msg,
      bannerInfo,
      updates: {
        graceUsages,
        lastStreakDayCounted: dayNumber,
        streakEvaluatedForDay: dayNumber,
        lastStreakMessage: msg,
        rolloverBannerInfo: bannerInfo,
      },
    };
  }

  // Below threshold but above 30% - guidance message
  if (adherence >= 0.3 && adherence < threshold) {
    const needed = Math.max(1, tasksNeeded - doneCount);
    const msg = `Complete ${needed} more task${needed > 1 ? 's' : ''} to reach today's threshold (${doneCount}/${assignedCount}). You're close — keep going!`;

    return {
      streakAdvanced: false,
      message: msg,
      guidance: true,
    };
  }

  // Very low progress - warning message
  const warnMsg = `Low progress — aim for ${tasksNeeded}/${assignedCount} tasks to secure your streak.`;
  return {
    streakAdvanced: false,
    message: warnMsg,
    warning: true,
  };
}

/**
 * Check if streak should be incremented based on milestone thresholds
 * @param {number} newStreak - New streak value
 * @param {number} oldStreak - Previous streak value
 * @returns {Object} Object with milestone notifications to schedule
 */
export function checkStreakMilestones(newStreak, oldStreak) {
  const milestones = [];

  if (newStreak === 7 && oldStreak < 7) {
    milestones.push('streak_7');
  }
  if (newStreak === 30 && oldStreak < 30) {
    milestones.push('streak_30');
  }
  if (newStreak === 90 && oldStreak < 90) {
    milestones.push('streak_90');
  }

  return {
    shouldBump: typeof newStreak === 'number' && newStreak > (typeof oldStreak === 'number' ? oldStreak : 0),
    milestones,
  };
}
