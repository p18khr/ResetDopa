// src/context/ProgramContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { BatchSaveManager } from '../services/firestore.service';
import { TASK_METADATA, getTaskExplanation, generateDayTasks, PROGRAM_DAY_TITLES, getCanonicalTask } from '../utils/programData';
import { scheduleMilestoneNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
  getCurrentDay as calculateCurrentDay,
  getRampThreshold as calculateRampThreshold,
  generatePicksForDay,
  getAdherence as calculateAdherence,
  evaluateStreakProgress as evaluateStreak,
  checkStreakMilestones,
} from '../utils/streakCalculations';

const ProgramContext = createContext({
  streak: 0,
  startDate: null,
  getCurrentDay: () => 1,
});

export function ProgramProvider({ children }) {
  const { user } = useAuth();

  // Program state
  const [streak, setStreak] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [startDateResets, setStartDateResets] = useState(0);
  const [todayPicks, setTodayPicks] = useState({});
  const [todayCompletions, setTodayCompletions] = useState({});
  const [dailyMetrics, setDailyMetrics] = useState({});
  const [adherenceWindowDays, setAdherenceWindowDays] = useState(3);
  const [devDayOffset, setDevDayOffset] = useState(0);

  // Week 1 state
  const [week1SetupDone, setWeek1SetupDone] = useState(false);
  const [week1Anchors, setWeek1Anchors] = useState([]);
  const [week1RotationApplied, setWeek1RotationApplied] = useState(false);
  const [week1Completed, setWeek1Completed] = useState(false);
  const [backfillDisabledBeforeDay, setBackfillDisabledBeforeDay] = useState(0);

  // Streak tracking state
  const [graceUsages, setGraceUsages] = useState([]);
  const [lastStreakDayCounted, setLastStreakDayCounted] = useState(0);
  const [streakEvaluatedForDay, setStreakEvaluatedForDay] = useState(0);
  const [thresholdMetToday, setThresholdMetToday] = useState(0);
  const [lastStreakMessage, setLastStreakMessage] = useState('');
  const [lastRolloverPrevDayEvaluated, setLastRolloverPrevDayEvaluated] = useState(0);
  const [rolloverBannerInfo, setRolloverBannerInfo] = useState(null);
  const [rolloverBannerDismissedDay, setRolloverBannerDismissedDay] = useState(0);
  const [streakBumpSeq, setStreakBumpSeq] = useState(0);

  // Refs for atomic locks
  const generatedDayTasksRef = React.useRef({});
  const streakEvaluatedForDayRefRef = React.useRef(0);
  const lastRolloverPrevDayEvaluatedRefRef = React.useRef(0);
  const evaluationQueueRef = React.useRef(Promise.resolve());

  // Helper: virtual date key respecting devDayOffset
  const getVirtualDateKey = () => {
    const d = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) d.setDate(d.getDate() + devDayOffset); } catch {}
    return d.toISOString().slice(0,10);
  };

  const [observedDayKey, setObservedDayKey] = useState(getVirtualDateKey());

  useEffect(() => { setObservedDayKey(getVirtualDateKey()); }, [devDayOffset]);

  useEffect(() => {
    const id = setInterval(() => {
      try {
        const key = getVirtualDateKey();
        if (key !== observedDayKey) setObservedDayKey(key);
      } catch {}
    }, 60000);
    return () => clearInterval(id);
  }, [observedDayKey, devDayOffset]);

  // Queue evaluation helper
  const queueEvaluation = (fn) => {
    evaluationQueueRef.current = evaluationQueueRef.current.then(fn).catch(err => {
      if (__DEV__) console.error('Queued evaluation error:', err?.message);
    });
    return evaluationQueueRef.current;
  };

  // BatchSaveManager for optimized writes
  const batchSaveManagerRef = React.useRef(null);

  // Initialize BatchSaveManager when user changes
  useEffect(() => {
    if (user?.uid) {
      batchSaveManagerRef.current = new BatchSaveManager(user.uid, {
        debounceMs: 50,
        retryOnFailure: true,
        retryDelayMs: 1000,
      });
    } else {
      // Cleanup on logout
      if (batchSaveManagerRef.current) {
        batchSaveManagerRef.current.destroy();
      }
      batchSaveManagerRef.current = null;
    }
  }, [user?.uid]);

  const saveUserData = (updates) => {
    if (batchSaveManagerRef.current) {
      batchSaveManagerRef.current.queueUpdates(updates);
    }
  };

  // Compute current day (1..30) from startDate
  const getCurrentDay = () => {
    return calculateCurrentDay(startDate, devDayOffset);
  };

  // Progressive threshold function
  const getRampThreshold = (day) => {
    return calculateRampThreshold(day);
  };

  // Ensure picks for a given day
  const ensurePicksForDay = (dayNumber) => {
    const existing = todayPicks[dayNumber];
    if (Array.isArray(existing) && existing.length > 0) return existing;

    const picks = generatePicksForDay(dayNumber, todayPicks);
    const updated = { ...todayPicks, [dayNumber]: picks };
    setTodayPicks(updated);
    saveUserData({ todayPicks: updated });
    return picks;
  };

  // Update streak with milestone notifications
  const updateStreak = (newStreak) => {
    const { shouldBump, milestones } = checkStreakMilestones(newStreak, streak);

    // Schedule milestone notifications
    milestones.forEach(milestone => {
      scheduleMilestoneNotification(milestone);
    });

    // Bump streak overlay sequence if streak increased
    if (shouldBump) {
      setStreakBumpSeq(s => s + 1);
    }

    setStreak(newStreak);
    saveUserData({ streak: newStreak });
  };

  // Get display streak - shows optimistic +1 if threshold met today
  const getDisplayStreak = () => {
    const currentDay = getCurrentDay();
    if (thresholdMetToday === currentDay) {
      // User met threshold today - show optimistic increment
      return streak + 1;
    }
    return streak;
  };

  // Evaluate streak progress during the day
  const evaluateStreakProgress = (dayNumber, completionsState) => {
    if (streakEvaluatedForDayRefRef.current === dayNumber) {
      setLastStreakMessage('Threshold already met — great consistency!');
      return;
    }

    if (streakEvaluatedForDay === dayNumber && streakEvaluatedForDay > 0) {
      streakEvaluatedForDayRefRef.current = dayNumber;
      setLastStreakMessage('Threshold already met — great consistency!');
      return;
    }

    // Use utility function for streak evaluation
    const result = evaluateStreak({
      dayNumber,
      completionsState,
      streak,
      todayPicks,
      streakEvaluatedForDay,
      rolloverBannerDismissedDay,
      graceUsages,
    });

    if (!result) return;

    // Handle already evaluated case
    if (result.alreadyEvaluated) {
      setLastStreakMessage(result.message);
      return;
    }

    // Set message for guidance/warning cases
    setLastStreakMessage(result.message);

    // Handle streak advanced case - SET OPTIMISTIC UI FLAG ONLY
    if (result.streakAdvanced) {
      // DON'T increment streak here - just set flag for optimistic UI
      // Actual increment happens in overnight rollover
      setThresholdMetToday(dayNumber);
      setLastStreakDayCounted(dayNumber);
      streakEvaluatedForDayRefRef.current = dayNumber;
      setStreakEvaluatedForDay(dayNumber);
      setRolloverBannerInfo(result.bannerInfo);

      // Show confident message - don't reveal optimistic nature
      const newStreakValue = streak + 1;
      setLastStreakMessage(`Streak advanced: ${streak} → ${newStreakValue}`);

      // Trigger streak bump animation for UI feedback
      setStreakBumpSeq(s => s + 1);

      // Save threshold flag to Firestore
      saveUserData({
        ...result.updates,
        thresholdMetToday: dayNumber,
      });
    }
  };

  // Rolling adherence score
  const getAdherence = (windowDays = adherenceWindowDays) => {
    const day = getCurrentDay();
    return calculateAdherence(day, todayPicks, todayCompletions, windowDays);
  };

  // Expose setters for external use
  const setProgramState = (updates) => {
    if (updates.streak !== undefined) setStreak(updates.streak);
    if (updates.startDate !== undefined) setStartDate(updates.startDate);
    if (updates.startDateResets !== undefined) setStartDateResets(updates.startDateResets);
    if (updates.todayPicks !== undefined) setTodayPicks(updates.todayPicks);
    if (updates.todayCompletions !== undefined) setTodayCompletions(updates.todayCompletions);
    if (updates.dailyMetrics !== undefined) setDailyMetrics(updates.dailyMetrics);
    if (updates.week1SetupDone !== undefined) setWeek1SetupDone(updates.week1SetupDone);
    if (updates.week1Anchors !== undefined) setWeek1Anchors(updates.week1Anchors);
    if (updates.week1RotationApplied !== undefined) setWeek1RotationApplied(updates.week1RotationApplied);
    if (updates.week1Completed !== undefined) setWeek1Completed(updates.week1Completed);
    if (updates.backfillDisabledBeforeDay !== undefined) setBackfillDisabledBeforeDay(updates.backfillDisabledBeforeDay);
    if (updates.graceUsages !== undefined) setGraceUsages(updates.graceUsages);
    if (updates.lastStreakDayCounted !== undefined) setLastStreakDayCounted(updates.lastStreakDayCounted);
    if (updates.streakEvaluatedForDay !== undefined) {
      setStreakEvaluatedForDay(updates.streakEvaluatedForDay);
      streakEvaluatedForDayRefRef.current = updates.streakEvaluatedForDay;
    }
    if (updates.thresholdMetToday !== undefined) setThresholdMetToday(updates.thresholdMetToday);
    if (updates.lastStreakMessage !== undefined) setLastStreakMessage(updates.lastStreakMessage);
    if (updates.lastRolloverPrevDayEvaluated !== undefined) {
      setLastRolloverPrevDayEvaluated(updates.lastRolloverPrevDayEvaluated);
      lastRolloverPrevDayEvaluatedRefRef.current = updates.lastRolloverPrevDayEvaluated;
    }
    if (updates.rolloverBannerInfo !== undefined) setRolloverBannerInfo(updates.rolloverBannerInfo);
    if (updates.rolloverBannerDismissedDay !== undefined) setRolloverBannerDismissedDay(updates.rolloverBannerDismissedDay);
  };

  // Load dev day offset
  useEffect(() => {
    const initDevOffset = async () => {
      try {
        const v = await AsyncStorage.getItem('devDayOffset');
        setDevDayOffset(v ? parseInt(v, 10) || 0 : 0);
      } catch {}
    };
    initDevOffset();
  }, []);

  return (
    <ProgramContext.Provider
      value={{
        // State
        streak,
        startDate,
        startDateResets,
        todayPicks,
        todayCompletions,
        dailyMetrics,
        adherenceWindowDays,
        devDayOffset,
        week1SetupDone,
        week1Anchors,
        week1RotationApplied,
        week1Completed,
        backfillDisabledBeforeDay,
        graceUsages,
        lastStreakDayCounted,
        streakEvaluatedForDay,
        thresholdMetToday,
        lastStreakMessage,
        lastRolloverPrevDayEvaluated,
        rolloverBannerInfo,
        rolloverBannerDismissedDay,
        streakBumpSeq,
        observedDayKey,

        // Functions
        getCurrentDay,
        getAdherence,
        getRampThreshold,
        ensurePicksForDay,
        evaluateStreakProgress,
        updateStreak,
        getDisplayStreak,
        saveUserData,
        setProgramState,
        queueEvaluation,
        getVirtualDateKey,

        // Refs (for internal use)
        generatedDayTasksRef,
        streakEvaluatedForDayRefRef,
        lastRolloverPrevDayEvaluatedRefRef,

        // Setters
        setTodayPicks,
        setTodayCompletions,
        setWeek1SetupDone,
        setWeek1Anchors,
        setWeek1RotationApplied,
        setWeek1Completed,
        setBackfillDisabledBeforeDay,
        setGraceUsages,
        setLastStreakDayCounted,
        setStreakEvaluatedForDay,
        setThresholdMetToday,
        setLastStreakMessage,
        setLastRolloverPrevDayEvaluated,
        setRolloverBannerInfo,
        setRolloverBannerDismissedDay,
        setStartDate,
        setDevDayOffset,
        setAdherenceWindowDays,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within ProgramProvider');
  }
  return context;
}

export default ProgramContext;
