// src/context/AppContext.js
import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { TASK_METADATA, getTaskExplanation, generateDayTasks, PROGRAM_DAY_TITLES, getCanonicalTask } from '../utils/programData';
import { scheduleMilestoneNotification, scheduleThresholdNotification, scheduleBadgeUnlockNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BadgeToast from '../components/BadgeToast';
import StreakBumpOverlay from '../components/StreakBumpOverlay';

export const AppContext = createContext({
  week1Completed: false,
  backfillDisabledBeforeDay: 0,
});

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [calmPoints, setCalmPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [urges, setUrges] = useState([]);
  const [todayPicks, setTodayPicks] = useState({});
  const [todayCompletions, setTodayCompletions] = useState({});
  const [tasks, setTasks] = useState([
    { id: 't1', title: '10 min sunlight', points: 5, done: false },
    { id: 't2', title: '5 min meditation', points: 8, done: false },
    { id: 't3', title: '25 min deep work', points: 10, done: false },
  ]);
  const [badges, setBadges] = useState([
    { id: 'b1', title: 'Awareness Rising', got: true },
    { id: 'b2', title: 'Deep Worker', got: false },
  ]);
  // UI signals
  const [badgeToast, setBadgeToast] = useState(null); // { id, title }
  const [streakBumpSeq, setStreakBumpSeq] = useState(0); // increments on +1
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null); // ISO string
  const [startDateResets, setStartDateResets] = useState(0); // limit 2
  const [dailyMetrics, setDailyMetrics] = useState({}); // { 'YYYY-MM-DD': { urges: n, completions: n, target: n, adherence: 0-1, variety: 0-1, calmDelta: n, streak: n } }
  const [week1SetupDone, setWeek1SetupDone] = useState(false);
  const [adherenceWindowDays, setAdherenceWindowDays] = useState(3);
  const [completedWeeksWithFireworks, setCompletedWeeksWithFireworks] = useState([]); // Track which weeks have already fired fireworks
  const generatedDayTasksRef = React.useRef({});
  const [dailyQuote, setDailyQuote] = useState(null);
  const [dailyQuoteSource, setDailyQuoteSource] = useState(null); // 'cloud' | 'local' | 'generated'
  const [devDayOffset, setDevDayOffset] = useState(0); // Demo: advance day without changing calendar
    // Helper: virtual date key respecting devDayOffset (testing/demo)
    const getVirtualDateKey = () => {
      const d = new Date();
      try { if (devDayOffset && Number.isFinite(devDayOffset)) d.setDate(d.getDate() + devDayOffset); } catch {}
      return d.toISOString().slice(0,10);
    };
  // Track the observed day using the virtual date key; triggers daily updates
  const [observedDayKey, setObservedDayKey] = useState(getVirtualDateKey());
  useEffect(() => { setObservedDayKey(getVirtualDateKey()); }, [devDayOffset]);
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const key = getVirtualDateKey();
        if (key !== observedDayKey) setObservedDayKey(key);
      } catch {}
    }, 60000); // check every minute
    return () => clearInterval(id);
  }, [observedDayKey, devDayOffset]);
  // Threshold notification: Schedule on Days 8, 15, 22 at 8 AM
  useEffect(() => {
    const scheduleThresholdNotif = async () => {
      const day = getCurrentDay();
      const thresholdDays = { 8: 2, 15: 3, 22: 4 }; // day -> weekNumber
      const weekNumber = thresholdDays[day];
      if (!weekNumber) return;
      
      // Check if already scheduled for this week
      const key = `thresholdNotif_week${weekNumber}`;
      const alreadyScheduled = await AsyncStorage.getItem(key);
      if (alreadyScheduled === 'true') return;
      
      try {
        await scheduleThresholdNotification(weekNumber, 8, 0); // 8 AM
        await AsyncStorage.setItem(key, 'true');
      } catch (e) {
        if (__DEV__) console.warn('Failed to schedule threshold notification:', e);
      }
    };
    scheduleThresholdNotif();
  }, [observedDayKey]);
  // Daily quest (micro-challenge)
  const [dailyQuest, setDailyQuest] = useState(null);
  const [dailyQuestDone, setDailyQuestDone] = useState({}); // { 'YYYY-MM-DD': true }
  // Daily mood capture (YYYY-MM-DD -> 'Better' | 'Neutral' | 'Worse')
  const [dailyMood, setDailyMoodState] = useState({});
  // Progressive streak system helpers
  const [graceDayDates, setGraceDayDates] = useState([]); // array of YYYY-MM-DD for grace days
  const [lastStreakDayCounted, setLastStreakDayCounted] = useState(0); // day number last advanced
  const [streakEvaluatedForDay, setStreakEvaluatedForDay] = useState(0); // atomic lock: day number where streak was evaluated same-day
  const [lastStreakMessage, setLastStreakMessage] = useState('');
  const [lastRolloverPrevDayEvaluated, setLastRolloverPrevDayEvaluated] = useState(0); // prev day last processed
  const [rolloverBannerInfo, setRolloverBannerInfo] = useState(null); // { day, type: 'advance'|'grace'|'reset', message }
  const [rolloverBannerDismissedDay, setRolloverBannerDismissedDay] = useState(0);
  // Week 1 anchors & rotation
  const [week1Anchors, setWeek1Anchors] = useState([]); // user selected 5 core tasks
  const [week1RotationApplied, setWeek1RotationApplied] = useState(false); // ensure single application
  const [week1Completed, setWeek1Completed] = useState(false);
  const [backfillDisabledBeforeDay, setBackfillDisabledBeforeDay] = useState(0);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [acceptanceLoaded, setAcceptanceLoaded] = useState(false);
  const enableEnhancedFeatures = true; // global flag to safely toggle enhancements
  
  // Prevent concurrent streak evaluations using a queue (not just a flag)
  const evaluationQueueRef = React.useRef(Promise.resolve());
  const queueEvaluation = (fn) => {
    evaluationQueueRef.current = evaluationQueueRef.current.then(fn).catch(err => {
      if (__DEV__) console.error('Queued evaluation error:', err?.message);
    });
    return evaluationQueueRef.current;
  };

  // Atomic lock using Ref (synchronous, not state) to prevent double-increment
  // Survives across renders, guarantees no race conditions
  const streakEvaluatedForDayRefRef = React.useRef(0);
  // Curated rotating daily quotes with tags
  const QUOTES = [
    { text: 'Small wins compound into big change.', author: 'Unknown', tag: 'small wins' },
    { text: 'Neurons that fire together wire together.', author: 'Hebbian principle', tag: 'neuroplasticity' },
    { text: 'Focus is the art of saying no.', author: 'Unknown', tag: 'focus' },
    { text: 'Discipline equals freedom.', author: 'Jocko Willink', tag: 'discipline' },
    { text: 'Your attention is your most valuable asset.', author: 'Unknown', tag: 'focus' },
    { text: 'Mood follows action — start small.', author: 'Andrew Huberman (paraphrased)', tag: 'small wins' },
    { text: 'What you repeatedly do shapes who you become.', author: 'Aristotle (paraphrased)', tag: 'identity' },
    { text: 'One day itself is a lifetime.', author: 'Heraclitus', tag: 'presence' },
    { text: 'Make the hard thing easy by starting tiny.', author: 'Unknown', tag: 'behavior change' },
    { text: 'Detox the feed; reclaim your mind.', author: 'Unknown', tag: 'social media detox' },
    { text: 'Consistency beats intensity.', author: 'Unknown', tag: 'consistency' },
    { text: 'Energy flows where attention goes.', author: 'Tony Robbins', tag: 'focus' },
    { text: 'Win the morning, win the day.', author: 'Unknown', tag: 'morning' },
    { text: 'Move your body, calm your mind.', author: 'Unknown', tag: 'mind-body' },
  ];

  const selectQuoteForAdherence = (adherence) => {
    // Tiered selection based on adherence level
    let pool;
    if (adherence < 0.5) {
      pool = QUOTES.filter(q => ['small wins','behavior change','morning','mind-body'].includes(q.tag));
    } else if (adherence < 0.8) {
      pool = QUOTES.filter(q => ['focus','consistency','identity','presence'].includes(q.tag));
    } else {
      pool = QUOTES.filter(q => ['discipline','focus','identity','consistency'].includes(q.tag));
    }
    if (pool.length === 0) pool = QUOTES;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Load or generate & persist the daily quote once per virtual day (cloud + local)
  useEffect(() => {
    const initQuote = async () => {
      const dateKey = getVirtualDateKey(); // YYYY-MM-DD (virtual)
      try {
        // 1) Try Firestore (for multi-device sync)
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const cloudQuote = data?.dailyQuotes?.[dateKey];
            if (cloudQuote) {
              setDailyQuote(cloudQuote);
              setDailyQuoteSource('cloud');
              // keep local cache in sync
              try { 
                await AsyncStorage.setItem(`dailyQuote_${dateKey}`, JSON.stringify(cloudQuote)); 
              } catch (e) {
                if (__DEV__) console.warn('Failed to cache quote locally:', e?.message);
              }
              return;
            }
          }
        }

        // 2) Fallback to local cache
        const stored = await AsyncStorage.getItem(`dailyQuote_${dateKey}`);
        if (stored) {
          setDailyQuote(JSON.parse(stored));
          setDailyQuoteSource('local');
          // also backfill cloud for this day
          if (user) {
            try { 
              await updateDoc(doc(db, 'users', user.uid), { [`dailyQuotes.${dateKey}`]: JSON.parse(stored) }); 
            } catch (e) {
              if (__DEV__) console.warn('Failed to sync quote to cloud:', e?.message);
            }
          }
          return;
        }

        // 3) Generate new quote guided by adherence
        const adherence = getAdherence(adherenceWindowDays);
        const quote = selectQuoteForAdherence(adherence);
        setDailyQuote(quote);
        setDailyQuoteSource('generated');
        // persist to both
        try { 
          await AsyncStorage.setItem(`dailyQuote_${dateKey}`, JSON.stringify(quote)); 
        } catch (e) {
          if (__DEV__) console.warn('Failed to cache generated quote:', e?.message);
        }
        if (user) {
          try { 
            await updateDoc(doc(db, 'users', user.uid), { [`dailyQuotes.${dateKey}`]: quote }); 
          } catch (e) {
            if (__DEV__) console.warn('Failed to save quote to cloud:', e?.message);
            // Still functional - quote is in memory and local cache
          }
        }
      } catch (e) {
        // Fallback: deterministic selection if persistence fails
        const hashIdx = Math.abs(getVirtualDateKey().split('').reduce((a,c)=>a + c.charCodeAt(0), 0)) % QUOTES.length;
        setDailyQuote(QUOTES[hashIdx]);
        setDailyQuoteSource('generated');
      }
    };
    initQuote();
    // Re-run when user changes to ensure cloud sync usage
  }, [user, observedDayKey]);  

  // Generate a simple Quest of the Day based on adherence and recent triggers
  useEffect(() => {
    if (!enableEnhancedFeatures) return;
    const computeQuest = async () => {
      const dateKey = getVirtualDateKey();
      try {
        // Try cloud
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const cloudQuest = data?.dailyQuest?.[dateKey];
            // If a cloud quest exists, accept it only if it's a friendly catalog-style task
            // Avoid legacy/time-bound or anchor-based phrasing like "Lock one anchor before 10AM"
            const isLegacy = typeof cloudQuest === 'string' && /anchor|\b\d{1,2}\s*AM\b/i.test(cloudQuest);
            if (cloudQuest && !isLegacy) { setDailyQuest(cloudQuest); return; }
            // else fall through to compute a fresh quest locally
          }
        }
      } catch {}
      // Compute locally
      const adherence = getAdherence(adherenceWindowDays);
      const sevenDaysAgo = Date.now() - 7*24*60*60*1000;
      const recentUrges = (urges || []).filter(u => u.timestamp >= sevenDaysAgo);
      const topEmotion = (() => {
        const freq = {};
        recentUrges.forEach(u => { freq[u.emotion] = (freq[u.emotion]||0)+1; });
        const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
        return sorted[0]?.[0] || null;
      })();
      // Friendly, concrete suggestions from catalog
      const EASY = ['Make bed','Drink water first thing','10 min sunlight'];
      const MEDIUM = ['25-min Pomodoro','10-15 min walk','Meditation 5 min'];
      const HARDER = ['Two 25-min Pomodoros','Read 10 pages','Device-free meal'];
      let quest = EASY[0];
      if (adherence >= 0.8) quest = HARDER[0];
      else if (adherence >= 0.5) quest = MEDIUM[0];
      else quest = EASY[1];
      if (topEmotion === 'lonely') quest = 'Call friend/family 10 min';
      if (topEmotion === 'stress') quest = 'Breathwork 5 min';
      setDailyQuest(quest);
      // Persist best-effort
      if (user) {
        try { await updateDoc(doc(db, 'users', user.uid), { [`dailyQuest.${dateKey}`]: quest }); } catch {}
      }
    };
    computeQuest();
  }, [enableEnhancedFeatures, user, JSON.stringify(urges), adherenceWindowDays, observedDayKey]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAcceptanceLoaded(false);
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid);
      } else {
        // Reset to default state when logged out or unauthenticated
        setCalmPoints(0);
        setStreak(0);
        setUrges([]);
        setTasks([
          { id: 't1', title: '10 min sunlight', points: 5, done: false },
          { id: 't2', title: '5 min meditation', points: 8, done: false },
          { id: 't3', title: '25 min deep work', points: 10, done: false },
        ]);
        setBadges([
          { id: 'b1', title: 'Awareness Rising', got: true },
          { id: 'b2', title: 'Deep Worker', got: false },
        ]);
        setStartDate(null);
        setHasAcceptedTerms(false);
        setAcceptanceLoaded(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load dev day offset (for demo advancing day)
  useEffect(() => {
    const initDevOffset = async () => {
      try {
        const v = await AsyncStorage.getItem('devDayOffset');
        setDevDayOffset(v ? parseInt(v, 10) || 0 : 0);
      } catch {}
    };
    initDevOffset();
  }, []);

  // Check and claim badges on app load and when metrics change
  useEffect(() => {
    if (!user || loading) return;
    checkAndClaimBadges({ streakVal: streak, calmPointsVal: calmPoints, tasksVal: tasks, urgesVal: urges, completionsState: todayCompletions });
  }, [user, loading]);

  // Load user data from Firestore
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCalmPoints(typeof data.calmPoints === 'number' ? data.calmPoints : 0);
        setStreak(typeof data.streak === 'number' ? data.streak : 0);
        setUrges(data.urges || []);
        setTodayPicks(data.todayPicks || {});
        setTodayCompletions(data.todayCompletions || {});
        setTasks(data.tasks || []);
        setBadges(data.badges || []);
        setStartDate(data.startDate || new Date().toISOString());
        setStartDateResets(typeof data.startDateResets === 'number' ? data.startDateResets : 0);
        setWeek1SetupDone(!!data.week1SetupDone);
        setDailyMoodState(data.dailyMood || {});
        // Load streak-related state
        if (Array.isArray(data.graceDayDates)) setGraceDayDates(data.graceDayDates);
        if (typeof data.lastStreakDayCounted === 'number') setLastStreakDayCounted(data.lastStreakDayCounted);
        if (typeof data.streakEvaluatedForDay === 'number') {
          setStreakEvaluatedForDay(data.streakEvaluatedForDay);
          // SYNC REF WITH FIRESTORE: If app restarted, Firestore is ground truth
          // Use Firestore value to prevent double-increment on restart
          streakEvaluatedForDayRefRef.current = data.streakEvaluatedForDay;
        }
        if (typeof data.lastStreakMessage === 'string') setLastStreakMessage(data.lastStreakMessage);
        if (typeof data.lastRolloverPrevDayEvaluated === 'number') setLastRolloverPrevDayEvaluated(data.lastRolloverPrevDayEvaluated);
        if (typeof data.rolloverBannerDismissedDay === 'number') setRolloverBannerDismissedDay(data.rolloverBannerDismissedDay);
        if (data.rolloverBannerInfo && typeof data.rolloverBannerInfo === 'object') {
          const dismissedDay = typeof data.rolloverBannerDismissedDay === 'number' ? data.rolloverBannerDismissedDay : 0;
          if (data.rolloverBannerInfo.day !== dismissedDay) setRolloverBannerInfo(data.rolloverBannerInfo);
        }
        if (typeof data.week1Completed === 'boolean') setWeek1Completed(data.week1Completed);
        if (typeof data.backfillDisabledBeforeDay === 'number') setBackfillDisabledBeforeDay(data.backfillDisabledBeforeDay);
        if (Array.isArray(data.completedWeeksWithFireworks)) setCompletedWeeksWithFireworks(data.completedWeeksWithFireworks);
        if (typeof data.hasAcceptedTerms === 'boolean') setHasAcceptedTerms(data.hasAcceptedTerms);
        if (!data.startDate) {
          try { 
            await updateDoc(doc(db, 'users', uid), { startDate: new Date().toISOString() }); 
          } catch (e) {
            if (__DEV__) console.error('Failed to set startDate:', e?.message);
          }
        }
      } else {
        // Create a baseline user document so subsequent updateDoc calls succeed
        const baseline = {
          createdAt: new Date().toISOString(),
          calmPoints: 0,
          streak: 0,
          urges: [],
          todayPicks: {},
          todayCompletions: {},
          tasks: [
            { id: 't1', title: '10 min sunlight', points: 5, done: false },
            { id: 't2', title: '5 min meditation', points: 8, done: false },
            { id: 't3', title: '25 min deep work', points: 10, done: false },
          ],
          badges: [
            { id: 'b1', title: 'Awareness Rising', got: true },
            { id: 'b2', title: 'Deep Worker', got: false },
          ],
          startDate: new Date().toISOString(),
          startDateResets: 0,
          week1SetupDone: false,
          dailyMood: {},
          dailyMetrics: {},
          completedWeeksWithFireworks: [],
        };
        try { await setDoc(doc(db, 'users', uid), baseline); } catch (e) {
          if (__DEV__) console.warn('Failed to create baseline user doc:', e?.message || e);
        }
        // Reflect baseline into local state
        setCalmPoints(0);
        setStreak(0);
        setUrges([]);
        setTodayPicks({});
        setTodayCompletions({});
        setTasks(baseline.tasks);
        setBadges(baseline.badges);
        setStartDate(baseline.startDate);
        setStartDateResets(0);
        setWeek1SetupDone(false);
        setDailyMoodState({});
      }
      setAcceptanceLoaded(true);
    } catch (error) {
      if (__DEV__) console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
      setAcceptanceLoaded(true);
    }
  };

  // Save user data to Firestore
  // Queue for batching Firestore writes - ensures writes complete in order
  const saveQueueRef = React.useRef(Promise.resolve());
  const pendingUpdatesRef = React.useRef({});
  let saveBatchTimeoutRef = React.useRef(null);

  const batchAndSaveUserData = (updates) => {
    if (!user) return;
    
    // Merge updates into pending batch
    Object.assign(pendingUpdatesRef.current, updates);
    
    // Clear existing batch timeout
    if (saveBatchTimeoutRef.current) {
      clearTimeout(saveBatchTimeoutRef.current);
    }
    
    // Queue the batch write after 50ms (allows multiple rapid calls to batch together)
    saveBatchTimeoutRef.current = setTimeout(() => {
      const batchedUpdates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      
      // Chain this write to the queue to ensure sequential writes
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid), batchedUpdates);
          if (__DEV__) console.log('[SaveQueue] Batch write succeeded');
        } catch (error) {
          if (__DEV__) console.error('Error saving data:', error?.message || error);
          // Retry once after 1 second
          return new Promise((resolve) => {
            setTimeout(async () => {
              try {
                await updateDoc(doc(db, 'users', user.uid), batchedUpdates);
                if (__DEV__) console.log('[SaveQueue] Batch write retry succeeded');
              } catch (retryError) {
                if (__DEV__) console.error('Retry failed:', retryError?.message);
                // Silent failure - will sync on next app load
              }
              resolve();
            }, 1000);
          });
        }
      }).catch(err => {
        if (__DEV__) console.error('Queue write error:', err?.message);
      });
    }, 50);
  };

  // For backward compatibility, keep original saveUserData but delegate to batched version
  const saveUserData = (updates) => {
    batchAndSaveUserData(updates);
  };

  // Reset program start date with a hard cap of 2 resets
  const resetProgramStartDate = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to reset your program.');
      return { ok: false, reason: 'unauthenticated' };
    }
    if (startDateResets >= 2) {
      Alert.alert('Limit reached', 'You have used your 2 allowed resets.');
      return { ok: false, reason: 'limit' };
    }
    const iso = new Date().toISOString();
    setStartDate(iso);
    const used = startDateResets + 1;
    setStartDateResets(used);
    try {
      await updateDoc(doc(db, 'users', user.uid), { startDate: iso, startDateResets: used });
    } catch (e) {
      if (__DEV__) console.error('Failed to save program reset:', e?.message);
      Alert.alert('Save Warning', 'Reset applied locally. Will sync when connection is restored.');
    }
    // Invalidate generated tasks cache
    generatedDayTasksRef.current = {};
    Alert.alert('Program reset', 'Day recalculated from today. Stay consistent.');
    return { ok: true, used };
  };

  // Compute metrics for a given dateKey (YYYY-MM-DD)
  const computeDailyMetrics = (dateKey) => {
    const date = new Date(dateKey + 'T00:00:00');
    // Urges that match date
    const dayUrges = urges.filter(u => new Date(u.timestamp).toDateString() === date.toDateString());
    // Determine day number relative to startDate
    let dayNumber = 1;
    if (startDate) {
      const sd = new Date(startDate);
      const msPerDay = 86400000;
      const diff = Math.floor((date.getTime() - new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime()) / msPerDay) + 1;
      dayNumber = diff;
    }
    // Completions & picks
    const picks = todayPicks[dayNumber] || [];
    const doneMap = todayCompletions[dayNumber] || {};
    const doneCount = Object.values(doneMap).filter(Boolean).length;
    const assignedCount = picks.length > 0 ? picks.length : (dayNumber <= 7 ? 5 : 6);
    const adherence = assignedCount === 0 ? 0 : doneCount / assignedCount;
    // Variety: unique categories from COMPLETED tasks
    const categories = new Set();
    const completedTasks = picks.filter(p => doneMap[p]);
    completedTasks.forEach(p => {
      const meta = TASK_METADATA[p] || {};
      categories.add(meta.category || meta.domain || 'other');
    });
    const variety = categories.size / 8;
    const categoriesCovered = Array.from(categories).map(c => c.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, ''));
    // Calm delta approximation (points from completions that day)
    let calmDelta = 0;
    Object.entries(doneMap).forEach(([title, val]) => {
      if (val) {
        const meta = TASK_METADATA[title] || {}; calmDelta += meta.points || 0;
      }
    });
    return { urges: dayUrges.length, completions: doneCount, target: assignedCount, adherence: Number(adherence.toFixed(2)), variety: Number(variety.toFixed(2)), categoriesCovered, calmDelta, streak };
  };

  const getDailyMetrics = (dateKey) => {
    return dailyMetrics[dateKey] || null;
  };

  const getRecentMetrics = (days = 30) => {
    const out = [];
    const virtualToday = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) virtualToday.setDate(virtualToday.getDate() + devDayOffset); } catch {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(virtualToday); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      out.push({ dateKey: key, metrics: dailyMetrics[key] || null });
    }
    return out;
  };

  // Backfill last 7 days metrics on mount or when underlying data changes
  useEffect(() => {
    if (!startDate) return; // Wait until startDate is set
    const backfill = async () => {
      const virtualToday = new Date();
      try { if (devDayOffset && Number.isFinite(devDayOffset)) virtualToday.setDate(virtualToday.getDate() + devDayOffset); } catch {}
      const updated = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(virtualToday); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);
        const recomputed = computeDailyMetrics(key);
        updated[key] = recomputed;
      }
      setDailyMetrics(updated);
      if (user) {
        try { 
          await updateDoc(doc(db, 'users', user.uid), { dailyMetrics: updated }); 
        } catch (e) {
          if (__DEV__) console.warn('Failed to sync metrics to cloud:', e?.message);
          // Still functional - metrics are in local state
        }
      }
    };
    backfill();
  }, [JSON.stringify(todayPicks), JSON.stringify(todayCompletions), JSON.stringify(urges), startDate, user, devDayOffset, observedDayKey]);

  // Seed rich test data for UI testing
  const seedTestData = async (profile = 'medium') => {
    const now = new Date();
    // 1) Set start date to 29 days ago so dayNumber maps 1..30
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    const newStartISO = start.toISOString();
    setStartDate(newStartISO);
    if (user) {
      try { await updateDoc(doc(db, 'users', user.uid), { startDate: newStartISO }); } catch {}
    }

    // 2) Seed 180 days of urges with varying counts for calendar richness
    const newUrges = [];
    for (let i = 0; i < 180; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dow = day.getDay();
      // Base pattern: fewer on Mon/Tue, more on Fri/Sat; small sinusoidal drift
      const weekendBoost = (dow === 5 || dow === 6) ? 2 : 0;
      const base = Math.max(0, Math.round(1 + Math.sin(i / 9) + weekendBoost));
      const count = Math.min(4, base + Math.floor(Math.random() * 2));
      for (let u = 0; u < count; u++) {
        newUrges.push({
          id: uuid.v4(),
          timestamp: day.getTime() + u * 3600000,
          emotion: ['boredom','stress','habit','lonely'][Math.floor(Math.random()*4)],
          note: '',
          intensity: ['low','medium','high'][Math.floor(Math.random()*3)]
        });
      }
    }

    // 3) Seed program picks/completions for 30 days (aligned with startDate)
    const newPicks = { };
    const newComps = { };
    const baseTasks = ['10 min sunlight','Make bed','5 min meditation','25 min Pomodoro','10-15 min walk','Read 10 pages'];
    const adherenceBias = profile === 'low' ? 0.35 : profile === 'high' ? 0.85 : 0.6;
    for (let dayNum = 1; dayNum <= 30; dayNum++) {
      const pickCount = dayNum <= 7 ? 3 : 3 + (dayNum % 2); // more after week 1
      const picks = baseTasks.slice(0, Math.min(pickCount, baseTasks.length));
      const compMap = {};
      const targetCount = picks.length;
      const adherenceForDay = Math.min(1, Math.max(0, (Math.random() * 0.4) + adherenceBias - 0.2));
      const doneCount = Math.round(adherenceForDay * targetCount);
      picks.forEach((t, idx) => { compMap[t] = idx < doneCount; });
      newPicks[dayNum] = picks;
      newComps[dayNum] = compMap;
    }

    setUrges(newUrges);
    setTodayPicks(newPicks);
    setTodayCompletions(newComps);
    generatedDayTasksRef.current = {}; // invalidate
    if (user) {
      try { 
        await updateDoc(doc(db, 'users', user.uid), { urges: newUrges, todayPicks: newPicks, todayCompletions: newComps }); 
      } catch (e) {
        if (__DEV__) console.error('Failed to sync test data to cloud:', e?.message);
        Alert.alert('Partial Success', 'Test data seeded locally but failed to sync to cloud. You may need to re-seed after reconnecting.');
        return;
      }
    }
    Alert.alert('Rich test data seeded', `Profile: ${profile}. Seeded 180 days of urges and 30 days of picks/completions.`);
  };

  // Reset seeded test data to a clean slate
  const resetTestData = async () => {
    // Clear urges, picks, completions, metrics; set startDate to today
    const iso = new Date().toISOString();
    setStartDate(iso);
    setUrges([]);
    setTodayPicks({});
    setTodayCompletions({});
    setDailyMetrics({});
    setDailyMoodState({});
    // Clear quest state to avoid stale daily bonuses
    setDailyQuest(null);
    setDailyQuestDone({});
    generatedDayTasksRef.current = {};
    // Clear today's quote cache locally
    try {
      const dateKey = getVirtualDateKey();
      await AsyncStorage.removeItem(`dailyQuote_${dateKey}`);
    } catch {}
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          startDate: iso,
          urges: [],
          todayPicks: {},
          todayCompletions: {},
          dailyMetrics: {},
          dailyMood: {},
          dailyQuest: null,
          dailyQuestDone: {},
        });
      } catch (e) {
        if (__DEV__) console.error('Failed to sync reset to cloud:', e?.message);
        Alert.alert('Partial Success', 'Data reset locally but failed to sync to cloud. Changes will sync when connection is restored.');
        return;
      }
    }
    Alert.alert('Seed reset', 'Restored to a clean slate for demos.');
  };

  // Initialize beginner-friendly state: fresh start with light metrics
  const initializeBeginnerState = async () => {
    // Use date-only to avoid TZ drift when computing program day
    const now = new Date();
    const midnightIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    setStartDate(midnightIso);
    setStartDateResets(0);
    setCalmPoints(0);
    setStreak(0);
    setGraceDayDates([]);
    setLastStreakDayCounted(0);
    setLastStreakMessage('');
    // Reset badges to baseline for test mode so unlocks can be re-tested
    setBadges([
      { id: 'b1', title: 'Awareness Rising', got: true },
      { id: 'b2', title: 'Deep Worker', got: false },
    ]);
    setUrges([]);
    setTodayPicks({});
    setTodayCompletions({});
    setDailyMetrics({});
    setDailyMoodState({});
    // Clear quest state to prevent stale +5 Today indicators
    setDailyQuest(null);
    setDailyQuestDone({});
    setWeek1SetupDone(false);
      setWeek1Anchors([]);
      setWeek1RotationApplied(false);
      setWeek1Completed(false);
      setBackfillDisabledBeforeDay(0);
    generatedDayTasksRef.current = {};
    
    // Set devDayOffset to 0 FIRST in state
    setDevDayOffset(0);
    
    // Targeted AsyncStorage clear (don't nuke auth tokens)
    try {
      await AsyncStorage.multiRemove([
        'devDayOffset',
        'week1SetupDone',
        'seen_intro_program',
        'seen_intro_urges',
        'seen_intro_stats',
        'program_intro_pending',
        'beginnerLaunch_v1'
      ]);
      // Clear any daily quotes
      const keys = await AsyncStorage.getAllKeys();
      const quoteKeys = keys.filter(k => k.startsWith('dailyQuote_'));
      if (quoteKeys.length > 0) await AsyncStorage.multiRemove(quoteKeys);
    } catch (e) {
      if (__DEV__) console.warn('AsyncStorage clear failed:', e);
    }
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          startDate: midnightIso,
          startDateResets: 0,
          calmPoints: 0,
          streak: 0,
          graceDayDates: [],
          lastStreakDayCounted: 0,
          lastStreakMessage: '',
          urges: [],
          todayPicks: {},
          todayCompletions: {},
          dailyMetrics: {},
          week1SetupDone: false,
          week1Completed: false,
          week1Anchors: [],
          week1RotationApplied: false,
          backfillDisabledBeforeDay: 0,
          dailyMood: {},
          dailyQuest: null,
          dailyQuestDone: {},
          // Persist a minimal badges baseline
          badges: [
            { id: 'b1', title: 'Awareness Rising', got: true },
            { id: 'b2', title: 'Deep Worker', got: false },
          ],
        });
        // Reload user data to ensure fresh state
        await loadUserData(user.uid);
      } catch {}
    } else {
      // Best effort local persistence for offline/testing
      saveUserData({
        startDate: midnightIso,
        startDateResets: 0,
        calmPoints: 0,
        streak: 0,
        graceDayDates: [],
        lastStreakDayCounted: 0,
        lastStreakMessage: '',
        todayPicks: {},
        todayCompletions: {},
        dailyMetrics: {},
        week1SetupDone: false,
        dailyMood: {},
        dailyQuest: null,
        dailyQuestDone: {},
        badges: [
          { id: 'b1', title: 'Awareness Rising', got: true },
          { id: 'b2', title: 'Deep Worker', got: false },
        ],
      });
    }
    
    Alert.alert(
      '✨ Fresh Start',
      `Welcome! You're now on Day 1.\n\nStart by picking 5 anchors for Week 1.`,
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const logUrge = ({ emotion, note, intensity, trigger }) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    let ts = Date.now();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) ts += devDayOffset * msPerDay; } catch {}
    const item = { id: uuid.v4(), timestamp: ts, emotion, note, intensity, trigger: trigger || null, outcome: null };
    const newUrges = [item, ...urges];
    setUrges(newUrges);
    const newPoints = calmPoints + 2;
    setCalmPoints(newPoints);
    // Check and claim badges based on new urge count and calm points
    checkAndClaimBadges({ urgesVal: newUrges, calmPointsVal: newPoints, tasksVal: tasks, streakVal: streak, completionsState: todayCompletions });
    saveUserData({ urges: newUrges, calmPoints: newPoints });
    Alert.alert('Urge logged', 'Nice — awareness logged.');
    return item.id;
  };

  const updateUrgeOutcome = (id, outcome) => {
    const newUrges = urges.map(u => u.id === id ? { ...u, outcome } : u);
    setUrges(newUrges);
    saveUserData({ urges: newUrges });
  };

  // Simple catalog of tasks with categories for recommendations
  const TASK_CATALOG = [
    { title: '10 min sunlight', category: 'morning' },
    { title: 'Make bed', category: 'morning' },
    { title: 'Drink water first thing', category: 'morning' },
    { title: 'Breathwork 5 min', category: 'mind' },
    { title: 'Meditation 5 min', category: 'mind' },
    { title: '10-15 min walk', category: 'physical' },
    { title: '5 min stretching/yoga', category: 'physical' },
    { title: '25-min Pomodoro', category: 'focus' },
    { title: 'Read 10 pages', category: 'focus' },
    { title: 'Call friend/family 10 min', category: 'social' },
    { title: 'Compliment someone', category: 'social' },
    { title: 'Device-free meal', category: 'social' },
    { title: 'Draw/write 10 min', category: 'creative' },
  ];

  // Compute top recommendations based on recent urges and streak
  const getDailyRecommendations = (count = 6) => {
    // Derive preference weights from urges in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUrges = urges.filter(u => u.timestamp >= sevenDaysAgo);
    const prefs = { social: 0, mind: 0, focus: 0, physical: 0, morning: 0, creative: 0 };
    recentUrges.forEach(u => {
      // Map emotions to categories to help selection
      if (u.emotion === 'lonely') prefs.social += (u.intensity === 'high' ? 2 : 1);
      if (u.emotion === 'stress') { prefs.mind += 2; prefs.focus += 1; }
      if (u.emotion === 'boredom') { prefs.creative += 2; prefs.focus += 1; }
      if (u.emotion === 'habit') { prefs.morning += 1; prefs.physical += 1; }
    });
    // Base ramping by streak: low streak → easier tasks
    const lowFriction = new Set(['Make bed','Drink water first thing','5 min stretching/yoga','10 min sunlight','Device-free meal']);

    // Score tasks
    const scored = TASK_CATALOG.map(t => {
      let score = 0;
      score += prefs[t.category] || 0;
      const meta = TASK_METADATA[t.title] || { friction: 'med' };
      if (streak < 4 && meta.friction === 'low') score += 2;
      if (streak >= 4 && t.category === 'focus') score += 1;
      return { ...t, score };
    }).sort((a,b) => b.score - a.score);

    return scored.slice(0, count);
  };

  const setTodayPicksForDay = (dayNumber, picks) => {
    setTodayPicks(prev => {
      const updated = { ...prev, [dayNumber]: picks };
      saveUserData({ todayPicks: updated });
      return updated;
    });
  };

  const setAllTodayPicks = (picksObject) => {
    setTodayPicks(prev => {
      const merged = { ...prev, ...picksObject };
      saveUserData({ todayPicks: merged });
      return merged;
    });
  };

  // Week 1 rotation effect: after anchors are set & week1SetupDone, append one category rotation task per day
  useEffect(() => {
    try {
      if (!week1SetupDone) return;
      if (week1RotationApplied) return;
      if (week1Anchors.length < 5) return;
      // Only apply if first 7 days not already extended
      const alreadyExtended = [1,2,3,4,5,6,7].every(d => (todayPicks[d] || []).length >= 6);
      if (alreadyExtended) { setWeek1RotationApplied(true); return; }
      const rotationCategories = ['physical','mind','focus','social','creative','morning','focus'];
      const usedRotationTitles = [];
      const mapping = {};
      const anchorsCanonical = new Set(week1Anchors.map(getCanonicalTask));
      for (let day = 1; day <= 7; day++) {
        const existing = todayPicks[day] && todayPicks[day].length ? todayPicks[day] : week1Anchors;
        let extended = Array.isArray(existing) ? [...existing] : [];
        const extendedCanonical = new Set(extended.map(getCanonicalTask));
        const cat = rotationCategories[day-1];
        const candidates = (TASK_CATALOG || []).filter(t => {
          if (t.category !== cat) return false;
          const canonical = getCanonicalTask(t.title);
          return !anchorsCanonical.has(canonical) && !extendedCanonical.has(canonical) && !usedRotationTitles.includes(t.title);
        });
        if (candidates.length > 0) {
          const chosen = candidates[0];
          extended.push(chosen.title);
          usedRotationTitles.push(chosen.title);
          extendedCanonical.add(getCanonicalTask(chosen.title));
        }
        // Ensure anchors fallback if extended is still empty
        if (extended.length === 0 && week1Anchors.length >= 5) {
          extended = [...week1Anchors];
        }
        mapping[day] = extended;
      }
      setAllTodayPicks(mapping);
      setWeek1RotationApplied(true);
    } catch (e) {
      if (__DEV__) console.warn('Week1 rotation effect failed, skipping:', e?.message || e);
    }
  }, [week1SetupDone, week1Anchors, week1RotationApplied, JSON.stringify(todayPicks)]);

  const toggleTodayTaskCompletion = (dayNumber, title, points = 0) => {
    const currentDay = getCurrentDay();
    
    // BLOCK ALL PAST DAY MARKING - no backfill for v1
    if (dayNumber < currentDay) {
      Alert.alert(
        'Past Days Locked 🔒',
        `Day ${dayNumber} is locked. You can only mark tasks for today (Day ${currentDay}) to maintain streak integrity.`,
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    const dayMap = todayCompletions[dayNumber] || {};
    const isCurrentlyChecked = dayMap[title];
    
    // HARD BLOCK: Prevent unmarking for v1
    if (isCurrentlyChecked) {
      Alert.alert(
        'Cannot Unmark ✓',
        'Tasks cannot be unmarked once completed. This maintains streak integrity and prevents confusion.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    const nextVal = !isCurrentlyChecked;
    
    const updatedDay = { ...dayMap, [title]: nextVal };
    const updated = { ...todayCompletions, [dayNumber]: updatedDay };
    setTodayCompletions(updated);

    // Award or subtract calm points based on toggle direction
    let persistedPoints = calmPoints;
    if (points && typeof points === 'number') {
      const base = (typeof calmPoints === 'number' ? calmPoints : 0);
      const delta = nextVal ? points : (isCurrentlyChecked ? -points : 0);
      if (delta !== 0) {
        const newPoints = Math.max(0, base + delta);
        setCalmPoints(newPoints);
        persistedPoints = newPoints;
      }
    }

    saveUserData({ todayCompletions: updated, calmPoints: persistedPoints });
    
    // Evaluate streak after marking today's task (only runs for current day)
    // Use promise queue to ensure rapid marks execute sequentially, not in parallel
    if (dayNumber === currentDay) {
      // Process previous day rollover first (silent to avoid alert stacking)
      try { applyRolloverOnce({ silent: true }); } catch {}
      try {
        queueEvaluation(() => {
          evaluateStreakProgress(currentDay, updated);
        });
      } catch (error) {
        if (__DEV__) console.error('Error evaluating streak progress:', error?.message);
        Alert.alert('Warning', 'Streak evaluation encountered an issue. Please try again.');
      }
    }
    
    // Check and claim badges based on task completion (for tasks_10, tasks_50, tasks_100)
    checkAndClaimBadges({ streakVal: streak, calmPointsVal: persistedPoints, tasksVal: tasks, urgesVal: urges, completionsState: updated });
    
    // Show win message when marking complete
    const meta = TASK_METADATA[title] || {};
    const domain = meta.domain || 'focus';
    const WIN_MESSAGES = [
      'Nice — small steps compound.',
      'Great job — keep the streak alive.',
      'Win logged — momentum building.',
      'Solid — lock another tiny win.',
      'Progress — attention reclaimed a bit more.',
    ];
    const msg = WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
    const benefit = getTaskExplanation(title) || (domain === 'morning' ? 'Kickstarts the day' : domain === 'mind' ? 'Calms and clarifies' : domain === 'physical' ? 'Energizes body' : domain === 'focus' ? 'Builds deep work' : domain === 'detox' ? 'Reduces distractions' : domain === 'social' ? 'Strengthens connection' : domain === 'creative' ? 'Sparks creativity' : 'Builds identity');
    Alert.alert('Tiny win 🎉', `${msg}\n\n💡 ${benefit}`);
  };

  const toggleTask = (taskId) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setTasks(newTasks);
    const t = tasks.find(x => x.id === taskId);
    if (t && !t.done) {
      const newPoints = calmPoints + t.points;
      setCalmPoints(newPoints);
      
      // Check for calm points milestones
      if (newPoints >= 500 && calmPoints < 500) {
        scheduleMilestoneNotification('calm_500');
      }
      
      // Check and claim badges based on new metrics
      checkAndClaimBadges({ calmPointsVal: newPoints, tasksVal: newTasks, streakVal: streak, urgesVal: urges, completionsState: todayCompletions });
      
      saveUserData({ tasks: newTasks, calmPoints: newPoints });
    } else {
      saveUserData({ tasks: newTasks });
    }
  };

  const claimBadge = (badgeId) => {
    let newBadges;
    const idx = badges.findIndex(b => b.id === badgeId);
    let unlockedTitle = null;
    let unlockedMessage = null;
    
    // Badge messages mapping
    const badgeMessages = {
      'first_day': 'Welcome to ResetDopa™! 🌱 Every step counts. Keep going!',
      'streak_3': '🔥 3-Day Streak! You\'re building momentum!',
      'streak_7': '⭐ 7-Day Streak! One full week down!',
      'streak_30': '🏆 30-Day Streak! You\'re a champion!',
      'streak_90': '👑 90-Day Streak! You\'re a legend!',
      'tasks_10': '✅ 10 Tasks Done! You\'re on fire!',
      'tasks_50': '💪 50 Tasks Completed! Keep crushing it!',
      'tasks_100': '🚀 100 Tasks! You\'re unstoppable!',
      'calm_100': '🌟 100 Calm Points! Peace is power!',
      'calm_500': '💎 500 Calm Points! You\'re in the zone!',
      'calm_1000': '🎯 1000 Calm Points! Peak serenity achieved!',
      'urge_resist_10': '🛡️ 10 Urges Resisted! You\'re strong!',
      'urge_resist_50': '⚔️ 50 Urges Resisted! You\'re a warrior!',
      'profile_complete': '👤 Profile Complete! You\'ve claimed your identity!',
      'identity_set': '👤 Profile Complete! You\'ve claimed your identity!',
    };
    
    if (idx >= 0) {
      const wasLocked = !badges[idx].got;
      const updated = badges.map(b => b.id === badgeId ? { ...b, got: true } : b);
      newBadges = updated;
      if (wasLocked) {
        unlockedTitle = updated[idx]?.title || null;
        unlockedMessage = badgeMessages[badgeId] || null;
      }
    } else {
      // If badge not present, append with inferred title
      const title = badgeId === 'identity_set' ? 'Identity Set' : 'Badge';
      newBadges = [...badges, { id: badgeId, title, got: true }];
      unlockedTitle = title;
      unlockedMessage = badgeMessages[badgeId] || null;
    }
    setBadges(newBadges);
    saveUserData({ badges: newBadges });
    // Fire toast notification and push notification only when newly unlocked
    if (unlockedTitle) {
      setBadgeToast({ id: badgeId, title: unlockedTitle, message: unlockedMessage });
      scheduleBadgeUnlockNotification(unlockedTitle, unlockedMessage);
    }
  };

  // Check and auto-claim badges based on current metrics
  const checkAndClaimBadges = (metricsState) => {
    const { streakVal = streak, calmPointsVal = calmPoints, tasksVal = tasks, urgesVal = urges, completionsState = todayCompletions } = metricsState;
    const badgesToClaim = [];

    // First day badge (always claim if not already claimed)
    if (!badges.some(b => b.id === 'first_day' && b.got)) {
      badgesToClaim.push('first_day');
    }

    // Streak badges
    if (streakVal >= 3 && !badges.some(b => b.id === 'streak_3' && b.got)) {
      badgesToClaim.push('streak_3');
    }
    if (streakVal >= 7 && !badges.some(b => b.id === 'streak_7' && b.got)) {
      badgesToClaim.push('streak_7');
    }
    if (streakVal >= 30 && !badges.some(b => b.id === 'streak_30' && b.got)) {
      badgesToClaim.push('streak_30');
    }
    if (streakVal >= 90 && !badges.some(b => b.id === 'streak_90' && b.got)) {
      badgesToClaim.push('streak_90');
    }

    // Task completion badges
    // Task completion badges - count all completed tasks across all days (from todayCompletions)
    // Note: todayCompletions = { dayNumber: { taskTitle: true/false, ... }, ... }
    const completedTasks = Object.values(completionsState || {}).reduce((sum, dayMap) => {
      return sum + Object.values(dayMap || {}).filter(Boolean).length;
    }, 0);
    if (completedTasks >= 10 && !badges.some(b => b.id === 'tasks_10' && b.got)) {
      badgesToClaim.push('tasks_10');
    }
    if (completedTasks >= 50 && !badges.some(b => b.id === 'tasks_50' && b.got)) {
      badgesToClaim.push('tasks_50');
    }
    if (completedTasks >= 100 && !badges.some(b => b.id === 'tasks_100' && b.got)) {
      badgesToClaim.push('tasks_100');
    }

    // Calm points badges
    if (calmPointsVal >= 100 && !badges.some(b => b.id === 'calm_100' && b.got)) {
      badgesToClaim.push('calm_100');
    }
    if (calmPointsVal >= 500 && !badges.some(b => b.id === 'calm_500' && b.got)) {
      badgesToClaim.push('calm_500');
    }
    if (calmPointsVal >= 1000 && !badges.some(b => b.id === 'calm_1000' && b.got)) {
      badgesToClaim.push('calm_1000');
    }

    // Urge resistance badges
    const urgeCount = (urgesVal || []).length;
    if (urgeCount >= 10 && !badges.some(b => b.id === 'urge_resist_10' && b.got)) {
      badgesToClaim.push('urge_resist_10');
    }
    if (urgeCount >= 50 && !badges.some(b => b.id === 'urge_resist_50' && b.got)) {
      badgesToClaim.push('urge_resist_50');
    }

    // Claim all newly unlocked badges
    badgesToClaim.forEach(badgeId => claimBadge(badgeId));
  };

  const updateStreak = (newStreak) => {
    // Check for streak milestones
    if (newStreak === 7 && streak < 7) {
      scheduleMilestoneNotification('streak_7');
    } else if (newStreak === 30 && streak < 30) {
      scheduleMilestoneNotification('streak_30');
    } else if (newStreak === 90 && streak < 90) {
      scheduleMilestoneNotification('streak_90');
    }
    
    // Trigger streak bump animation when increasing
    if (typeof newStreak === 'number' && newStreak > (typeof streak === 'number' ? streak : 0)) {
      setStreakBumpSeq(s => s + 1);
    }
    
    // Check and claim badges based on new streak
    checkAndClaimBadges({ streakVal: newStreak, calmPointsVal: calmPoints, tasksVal: tasks, urgesVal: urges, completionsState: todayCompletions });
    
    setStreak(newStreak);
    saveUserData({ streak: newStreak });
  };

  // Progressive threshold function
  const getRampThreshold = (day) => {
    if (day <= 7) return 0.5;
    if (day <= 14) return 0.6;
    if (day <= 21) return 0.65;
    if (day > 30) return 0.6; // maintenance mode: lighter bar to reduce fatigue
    return 0.7;
  };

  // Ensure we have picks for a given day; if empty, backfill from last known or defaults
  const ensurePicksForDay = (dayNumber) => {
    const existing = todayPicks[dayNumber];
    if (Array.isArray(existing) && existing.length > 0) return existing;

    const MAINTENANCE_ROTATIONS = [
      ['10-min walk', '5-min breathing', 'Plan tomorrow 3-min', 'Text a friend'],
      ['Light stretch 5-min', '2-min tidy', 'Identity check-in', 'Gratitude x3'],
      ['Detox 30-min (screen-free)', 'Sip water often', 'Calm breath 4 cycles', 'Note 1 win'],
    ];

    // Maintenance mode (post day 30): rotate fresh, light tasks to avoid staleness
    if (dayNumber > 30) {
      const rotation = MAINTENANCE_ROTATIONS[(dayNumber - 31) % MAINTENANCE_ROTATIONS.length];
      const updatedMaint = { ...todayPicks, [dayNumber]: rotation };
      setTodayPicks(updatedMaint);
      saveUserData({ todayPicks: updatedMaint });
      return rotation;
    }

    // Try to use most recent prior day's picks
    let fallback = [];
    for (let d = dayNumber - 1; d >= 1; d--) {
      const prior = todayPicks[d];
      if (Array.isArray(prior) && prior.length > 0) { fallback = prior; break; }
    }

    // If still empty, use minimal defaults
    if (!fallback || fallback.length === 0) {
      fallback = ['5 min breathing', 'Stretch 2 min', '2-min tidy'];
    }

    const updated = { ...todayPicks, [dayNumber]: fallback };
    setTodayPicks(updated);
    saveUserData({ todayPicks: updated });
    return fallback;
  };

  // Evaluate streak progression during the day (same-day advancement when threshold met)
  // Grace is evaluated NEXT day only
  const evaluateStreakProgress = (dayNumber, completionsState) => {
    // ATOMIC LOCK: Use Ref (synchronous) instead of state for guaranteed protection
    // Ref.current updates immediately, no microtask timing issues
    if (streakEvaluatedForDayRefRef.current === dayNumber) {
      setLastStreakMessage('Threshold already counted today — keep momentum going.');
      return;
    }

    const picks = ensurePicksForDay(dayNumber);
    const assignedCount = picks.length > 0 ? picks.length : (dayNumber <= 7 ? 5 : 6);
    const doneMap = completionsState[dayNumber] || {};
    const doneCount = Object.values(doneMap).filter(Boolean).length;
    const adherence = assignedCount === 0 ? 0 : doneCount / assignedCount;
    const threshold = getRampThreshold(dayNumber);
    const tasksNeeded = Math.ceil(threshold * assignedCount);

    // Early onboarding leniency (Days 1-2): just 1 task advances streak SAME DAY
    if (dayNumber <= 2 && doneCount >= 1) {
      const newStreakVal = streak + 1;
      updateStreak(newStreakVal);
      setLastStreakDayCounted(dayNumber);
      // ATOMIC LOCK: Update both Ref (synchronous) and state (for Firestore)
      streakEvaluatedForDayRefRef.current = dayNumber;
      setStreakEvaluatedForDay(dayNumber);
      const msg = 'Streak advanced — strong start. Keep locking anchors.';
      setLastStreakMessage(msg);
      const bannerInfo = rolloverBannerDismissedDay !== dayNumber
        ? { day: dayNumber, type: 'advance', message: msg }
        : null;
      setRolloverBannerInfo(bannerInfo);
      saveUserData({ graceDayDates, lastStreakDayCounted: dayNumber, streakEvaluatedForDay: dayNumber, lastStreakMessage: msg, rolloverBannerInfo: bannerInfo, lastRolloverPrevDayEvaluated: dayNumber - 1 });
      return;
    }

    // Met threshold - advance streak immediately (SAME DAY)
    if (adherence >= threshold) {
      const newStreakVal = streak + 1;
      updateStreak(newStreakVal);
      setLastStreakDayCounted(dayNumber);
      // ATOMIC LOCK: Update both Ref (synchronous) and state (for Firestore)
      streakEvaluatedForDayRefRef.current = dayNumber;
      setStreakEvaluatedForDay(dayNumber);
      const msg = 'Streak advanced — consistency is compounding.';
      setLastStreakMessage(msg);
      const bannerInfo = rolloverBannerDismissedDay !== dayNumber
        ? { day: dayNumber, type: 'advance', message: msg }
        : null;
      setRolloverBannerInfo(bannerInfo);
      saveUserData({ graceDayDates, lastStreakDayCounted: dayNumber, streakEvaluatedForDay: dayNumber, lastStreakMessage: msg, rolloverBannerInfo: bannerInfo, lastRolloverPrevDayEvaluated: dayNumber - 1 });
      return;
    }    // Below threshold - guidance only (no grace during day)
    if (adherence >= 0.3 && adherence < threshold) {
      const needed = Math.max(1, tasksNeeded - doneCount);
      const msg = `Complete ${needed} more task${needed>1?'s':''} to reach today's threshold (${doneCount}/${assignedCount}). Grace (if close) is checked overnight.`;
      setLastStreakMessage(msg);
      return;
    }

    // Low adherence (<30%) — warning only
    const warnMsg = `Low progress — aim for ${tasksNeeded}/${assignedCount} tasks. Grace/streak checks happen overnight.`;
    setLastStreakMessage(warnMsg);
  };

  // Auto-detect Week 1 completion outside of helper functions
  useEffect(() => {
    try {
      if (week1Completed) return;
      const picks = todayPicks[7] || [];
      if (!Array.isArray(picks) || picks.length === 0) return; // require tasks
      const comps = todayCompletions[7] || {};
      const doneCount = picks.filter(t => comps[t]).length;
      const allDone = doneCount >= picks.length && picks.length > 0;
      if (allDone) {
        setWeek1Completed(true);
        setBackfillDisabledBeforeDay(8);
        saveUserData({ week1Completed: true, backfillDisabledBeforeDay: 8 });
      }
    } catch {}
  }, [JSON.stringify(todayCompletions[7]), JSON.stringify(todayPicks[7]), week1Completed]);

  // Compute current day (1..30) from startDate
  const getCurrentDay = () => {
    const sd = startDate ? new Date(startDate) : new Date();
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMid = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diff = Math.floor((nowMid - startMid) / msPerDay) + 1 + (devDayOffset || 0);
    return Math.max(diff, 1); // allow maintenance mode beyond day 30
  };

  // Advance program day for demo/testing without altering startDate
  const advanceProgramDay = async (steps = 1) => {
    const curr = getCurrentDay();
    const nextDay = Math.max(1, curr + steps); // allow beyond 30 for maintenance
    const base = startDate ? new Date(startDate) : new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMid = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
    const nowMid = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const realDiff = Math.floor((nowMid - startMid) / msPerDay) + 1;
    const neededOffset = nextDay - realDiff;
    const newOffset = Math.max(0, neededOffset);
    setDevDayOffset(newOffset);
    try { await AsyncStorage.setItem('devDayOffset', String(newOffset)); } catch {}
    generatedDayTasksRef.current = {};
    return nextDay;
  };

  // Jump to an exact virtual program day (sets devDayOffset accordingly)
  const setVirtualDay = async (targetDay = 1) => {
    if (!startDate) return { ok: false, reason: 'no-start-date' };
    const base = new Date(startDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMid = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
    const nowMid = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const realDiff = Math.floor((nowMid - startMid) / msPerDay) + 1;
    const desired = Math.max(1, Math.floor(targetDay));
    const newOffset = Math.max(0, desired - realDiff);
    setDevDayOffset(newOffset);
    generatedDayTasksRef.current = {};
    try { await AsyncStorage.setItem('devDayOffset', String(newOffset)); } catch {}
    return { ok: true, day: desired, offset: newOffset };
  };

  // Calculate dynamic picks increment based on 7-day adherence
  // Returns number of picks to add: +2 if >70%, +1 if >60%, 0 if <=60%
  const getPicksIncrement = () => {
    const sevenDayAdherence = getAdherence(7);
    if (sevenDayAdherence > 0.7) return 2;   // >70% → +2 tasks (max increment)
    if (sevenDayAdherence > 0.6) return 1;   // >60% → +1 task
    return 0;                                 // ≤60% → no change (maintain current)
  };

  // Get dynamic task count for a given day (respects adherence-based scaling)
  const getDynamicTaskCount = (dayNumber) => {
    if (dayNumber <= 7) return 6; // Week 1: 5 anchors + 1 rotation = 6
    const baseCount = 6; // Post-Week 1 base
    const increment = getPicksIncrement();
    return baseCount + increment; // 6, 7, or 8 tasks depending on adherence
  };

  // Rolling adherence score over last N days (0..1)
  const getAdherence = (windowDays = adherenceWindowDays) => {
    const day = getCurrentDay();
    let assignedSum = 0;
    let doneSum = 0;
    for (let d = Math.max(1, day - windowDays + 1); d <= day; d++) {
      const picks = todayPicks[d] || [];
      const assignedCount = picks.length > 0 ? picks.length : (d <= 7 ? 5 : 6);
      const doneMap = todayCompletions[d] || {};
      const doneCount = Object.values(doneMap).filter(Boolean).length;
      assignedSum += assignedCount;
      doneSum += doneCount;
    }
    if (assignedSum === 0) return 0;
    return doneSum / assignedSum;
  };

  // Debug helper: show grace availability status and when it will be available
  const getGraceStatus = () => {
    const currentDay = getCurrentDay();
    const recentGrace = graceDayDates.filter(d => {
      if (d.startsWith('day_')) {
        const dayNum = parseInt(d.replace('day_', ''), 10);
        return dayNum >= currentDay - 6 && dayNum < currentDay;
      }
      return false;
    });
    const graceAvailable = recentGrace.length < 1;
    const nextAvailableDay = graceAvailable 
      ? currentDay 
      : Math.max(...recentGrace.map(d => parseInt(d.replace('day_', ''), 10))) + 7;
    
    return {
      graceAvailable,
      graceDaysUsedInPast7: recentGrace.map(d => parseInt(d.replace('day_', ''), 10)),
      nextAvailableDay,
      nextAvailableDaysFromNow: nextAvailableDay - currentDay,
      allGraceDayDates: graceDayDates
    };
  };

  // Rollover evaluator (runs at most once per prev day). Silent mode avoids stacking alerts.
  const applyRolloverOnce = ({ silent } = { silent: false }) => {
      if (!startDate) return;
      const dayNumber = getCurrentDay();
      if (dayNumber <= 1) return;
      const prevDay = dayNumber - 1;
      
      // CRITICAL GUARD: If TODAY was already evaluated for streak, skip rollover
      // This prevents streak from incrementing again on app restart same-day
      if (streakEvaluatedForDay === dayNumber) {
        if (typeof lastRolloverPrevDayEvaluated !== 'number' || lastRolloverPrevDayEvaluated < prevDay) {
          setLastRolloverPrevDayEvaluated(prevDay);
          saveUserData({ lastRolloverPrevDayEvaluated: prevDay });
        }
        return;
      }
      
      // Skip if already evaluated yesterday for rollover
      if (lastRolloverPrevDayEvaluated === prevDay) return;

      // ATOMIC LOCK: Skip all streak logic if YESTERDAY was already evaluated same-day
      // This prevents grace from running on days that already had threshold evaluation
      if (streakEvaluatedForDay === prevDay) {
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'hold', message: `Day ${prevDay} evaluated — no overnight changes.` }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
        return;
      }

      const picksPrev = ensurePicksForDay(prevDay);
      const assignedCount = picksPrev.length > 0 ? picksPrev.length : (prevDay <= 7 ? 5 : 6);
      const doneMapPrev = todayCompletions[prevDay] || {};
      const donePrev = Object.values(doneMapPrev).filter(Boolean).length;
      const adherencePrev = assignedCount === 0 ? 0 : donePrev / assignedCount;
      const thresholdPrev = getRampThreshold(prevDay);
      
      // Grace tracking
      const gracePrevKey = `day_${prevDay}`;
      if (__DEV__) console.log(`[Rollover Day ${prevDay}] adherence=${(adherencePrev*100).toFixed(1)}%, threshold=${(thresholdPrev*100).toFixed(1)}%, lastStreakDayCounted=${lastStreakDayCounted}, streakEvaluatedForDay=${streakEvaluatedForDay}, graceStatus:`, getGraceStatus());
      const recentGrace = graceDayDates.filter(d => {
        if (d.startsWith('day_')) {
          const dayNum = parseInt(d.replace('day_', ''), 10);
          return dayNum >= prevDay - 6 && dayNum < prevDay;
        }
        return false;
      });
      const graceAvailable = recentGrace.length < 1;
      const graceUsedYesterday = graceDayDates.includes(gracePrevKey);

      // If prev day already counted same-day, it's already locked in (unmarking disabled)
      // Adherence can't drop below threshold after counting, so just acknowledge and continue
      if (lastStreakDayCounted === prevDay) {
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'hold', message: `Day ${prevDay} counted — streak holding strong!` }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo, streakEvaluatedForDay: prevDay });
        return;
      }

      // Early onboarding leniency (Days 1-2): just 1 task advances streak overnight (fallback)
      if (prevDay <= 2 && donePrev >= 1) {
        const newStreakVal = streak + 1;
        updateStreak(newStreakVal);
        setLastStreakDayCounted(prevDay);
        const msg = 'Streak advanced overnight — strong start! Keep locking anchors.';
        setLastStreakMessage(msg);
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'advance', message: msg }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ graceDayDates, lastStreakDayCounted: prevDay, lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
        return;
      }

      // Case 1: Met threshold - advance streak overnight
      if (adherencePrev >= thresholdPrev) {
        const newStreakVal = streak + 1;
        updateStreak(newStreakVal);
        setLastStreakDayCounted(prevDay);
        setLastStreakMessage('Streak advanced overnight — great consistency!');
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'advance', message: 'Streak advanced overnight — great consistency!' }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ graceDayDates, lastStreakDayCounted: prevDay, lastStreakMessage: 'Streak advanced overnight — great consistency!', lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
        return;
      }

      // Case 2: Grace band (30% to threshold) - apply grace if available
      if (adherencePrev >= 0.3 && adherencePrev < thresholdPrev) {
        if (__DEV__) console.log(`[Grace Check Day ${prevDay}] In grace band. graceAvailable=${graceAvailable}, graceUsedYesterday=${graceUsedYesterday}, recentGrace=`, recentGrace);
        if (graceAvailable && !graceUsedYesterday) {
          if (__DEV__) console.log(`[Grace Apply Day ${prevDay}] ✅ Applying grace!`);
          const updatedGrace = [...graceDayDates, gracePrevKey];
          setGraceDayDates(updatedGrace);
          const newStreakVal = streak + 1;
          updateStreak(newStreakVal);
          setLastStreakDayCounted(prevDay);
          const tasksNeeded = Math.ceil(thresholdPrev * assignedCount);
          const msg = `Grace applied for Day ${prevDay}. You completed ${donePrev}/${assignedCount} tasks (needed ${tasksNeeded}). Streak advanced to ${newStreakVal} via grace. One grace per week — make today count!`;
          setLastStreakMessage(msg);
          setLastRolloverPrevDayEvaluated(prevDay);
          const bannerInfo = rolloverBannerDismissedDay !== prevDay 
            ? { day: prevDay, type: 'grace', message: msg }
            : null;
          setRolloverBannerInfo(bannerInfo);
          if (__DEV__) console.log(`[Grace Apply Day ${prevDay}] Banner info being persisted:`, bannerInfo);
          saveUserData({ graceDayDates: updatedGrace, lastStreakDayCounted: prevDay, lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
          if (!silent) Alert.alert('Grace Day ⚖️', msg);
          return;
        } else if (graceUsedYesterday) {
          setLastRolloverPrevDayEvaluated(prevDay);
          saveUserData({ lastRolloverPrevDayEvaluated: prevDay });
          return; // Already grace-protected
        } else {
          // Grace unavailable - used recently within 7-day window
          const msg = `Day ${prevDay}: ${donePrev}/${assignedCount} tasks (${Math.round(adherencePrev*100)}%). Grace unavailable (used recently). Streak holding at ${streak}.`;
          setLastStreakMessage(msg);
          setLastRolloverPrevDayEvaluated(prevDay);
          const bannerInfo = rolloverBannerDismissedDay !== prevDay 
            ? { day: prevDay, type: 'hold', message: msg }
            : null;
          setRolloverBannerInfo(bannerInfo);
          saveUserData({ lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
          return;
        }
      }

      // Case 3: Very low adherence (<30%) - break streak
      if (adherencePrev < 0.3) {
        if (streak > 0) {
          updateStreak(0);
          const msg = `Streak reset. Day ${prevDay}: ${donePrev}/${assignedCount} tasks completed. Start fresh today with small wins.`;
          setLastStreakMessage(msg);
          setLastRolloverPrevDayEvaluated(prevDay);
          const bannerInfo = rolloverBannerDismissedDay !== prevDay 
            ? { day: prevDay, type: 'reset', message: msg }
            : null;
          setRolloverBannerInfo(bannerInfo);
          saveUserData({ streak: 0, lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
          if (!silent) Alert.alert('Streak Reset', msg);
        } else {
          setLastRolloverPrevDayEvaluated(prevDay);
          saveUserData({ lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: null });
        }
        return;
      }

      // Case 4: Below threshold but not severe (30-threshold%) - soft penalty or hold
      if (streak >= 7 && adherencePrev >= 0.4) {
        const newStreakVal = Math.max(0, streak - 1);
        updateStreak(newStreakVal);
        const msg = 'Streak dipped by 1 — rebuild momentum today.';
        setLastStreakMessage(msg);
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'hold', message: msg }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ streak: newStreakVal, lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
      } else {
        const msg = 'Yesterday fell short — lock anchors early today to rebuild.';
        setLastStreakMessage(msg);
        setLastRolloverPrevDayEvaluated(prevDay);
        const bannerInfo = rolloverBannerDismissedDay !== prevDay 
          ? { day: prevDay, type: 'hold', message: msg }
          : null;
        setRolloverBannerInfo(bannerInfo);
        saveUserData({ lastStreakMessage: msg, lastRolloverPrevDayEvaluated: prevDay, rolloverBannerInfo: bannerInfo });
      }
  };
  // Day rollover effect: evaluate prior day once per day
  useEffect(() => {
    applyRolloverOnce({ silent: false });
  }, [observedDayKey, JSON.stringify(todayCompletions), JSON.stringify(todayPicks), startDate]);

  const dismissRolloverBanner = () => {
    try {
      const dayNumber = getCurrentDay();
      const targetDay = rolloverBannerInfo?.day || Math.max(1, dayNumber - 1);
      setRolloverBannerDismissedDay(targetDay);
      setRolloverBannerInfo(null);
      saveUserData({ rolloverBannerDismissedDay: targetDay, rolloverBannerInfo: null });
    } catch {
      setRolloverBannerInfo(null);
    }
  };

  // Set today's mood with cloud/local persistence
  const setDailyMood = async (mood) => {
    const dateKey = getVirtualDateKey();
    const updated = { ...dailyMood, [dateKey]: mood };
    setDailyMoodState(updated);
    if (user) {
      try {
        // Sanitize mood object for Firestore: remove undefined values, keep only strings/booleans/numbers
        let cleanedMood = mood;
        if (typeof mood === 'object' && mood !== null) {
          cleanedMood = Object.fromEntries(
            Object.entries(mood).filter(([k, v]) => 
              v !== undefined && v !== null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
            )
          );
        }
        await updateDoc(doc(db, 'users', user.uid), { [`dailyMood.${dateKey}`]: cleanedMood });
      } catch (e) {
        if (__DEV__) console.warn('Error saving mood:', e?.message || e);
      }
    }
  };

  // Dynamic task generation per day (cached once created)
  const getGeneratedTasks = (day) => {
    // Build week1 picks anchor aggregation
    const picksForWeek1 = [];
    if (day <= 7) {
      for (let d = 1; d <= 7; d++) {
        const picks = todayPicks[d] || [];
        picks.forEach(p => { if (!picksForWeek1.includes(p)) picksForWeek1.push(p); });
      }
    }
    // Always regenerate (lightweight) to avoid stale state updates during render
    const adherence = getAdherence(adherenceWindowDays);
    const tasks = generateDayTasks(day, picksForWeek1, adherence);
    generatedDayTasksRef.current[day] = tasks;
    return tasks;
  };

  // Invalidate cache when picks or adherence window changes (no setState needed)
  useEffect(() => {
    generatedDayTasksRef.current = {};
  }, [JSON.stringify(todayPicks), adherenceWindowDays]);

  // Dev/testing: mark all tasks for a given day as completed silently (no alerts)
  const completeDaySilently = async (dayNumber) => {
    try {
      let titles = [];
      const saved = todayPicks[dayNumber] || [];
      if (dayNumber <= 7) {
        const anchors = (todayPicks[1] && todayPicks[1].length ? todayPicks[1] : (week1Anchors || []));
        const source = saved.length ? saved : anchors;
        titles = Array.isArray(source) ? source : [];
      } else {
        if (saved.length) titles = saved;
        else titles = (getGeneratedTasks(dayNumber) || []).map(t => t.task);
      }
      if (!Array.isArray(titles) || titles.length === 0) return { ok: false, reason: 'no-tasks' };
      const dayMap = todayCompletions[dayNumber] || {};
      const updatedDay = { ...dayMap };
      titles.forEach(title => { updatedDay[title] = true; });
      const updated = { ...todayCompletions, [dayNumber]: updatedDay };
      setTodayCompletions(updated);
      saveUserData({ todayCompletions: updated });
      // Optionally evaluate streak for current day
      const current = getCurrentDay();
      if (dayNumber === current) {
        evaluateStreakProgress(current, updated);
      }
      return { ok: true, count: titles.length };
    } catch (e) {
      return { ok: false, reason: e?.message || 'error' };
    }
  };

  // Mark a week as having fired fireworks (prevents re-triggering on reopen)
  const markWeekFireworksFired = async (weekNumber) => {
    if (completedWeeksWithFireworks.includes(weekNumber)) return; // Already tracked
    const updated = [...completedWeeksWithFireworks, weekNumber];
    setCompletedWeeksWithFireworks(updated);
    if (user) {
      try { await updateDoc(doc(db, 'users', user.uid), { completedWeeksWithFireworks: updated }); } catch {}
    }
  };

  const acceptTerms = async () => {
    setHasAcceptedTerms(true);
    setAcceptanceLoaded(true);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          hasAcceptedTerms: true,
          termsAcceptedAt: new Date().toISOString(),
        });
      } catch (e) {
        if (__DEV__) console.error('Failed to save terms acceptance:', e?.message);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      enableEnhancedFeatures,
      user,
      loading,
      calmPoints,
      streak,
      urges,
      tasks,
      badges,
      badgeToast,
      clearBadgeToast: () => setBadgeToast(null),
      startDate,
      setStartDate: async (iso) => { setStartDate(iso); await saveUserData({ startDate: iso }); },
      startDateResets,
      resetProgramStartDate,
      logUrge,
      updateUrgeOutcome,
      getDailyRecommendations,
      todayPicks,
      setTodayPicksForDay,
      todayCompletions,
      toggleTodayTaskCompletion,
      getCurrentDay,
      toggleTask,
      claimBadge,
      setStreak: updateStreak,
      streakBumpSeq,
      setCalmPoints: (newPoints) => {
        setCalmPoints(newPoints);
        saveUserData({ calmPoints: newPoints });
      },
      getAdherence,
      getPicksIncrement,
      getDynamicTaskCount,
      getGeneratedTasks,
      PROGRAM_DAY_TITLES,
      adherenceWindowDays,
      setAdherenceWindowDays,
      week1SetupDone,
      setWeek1SetupDone: async (done) => { setWeek1SetupDone(done); await saveUserData({ week1SetupDone: !!done }); }
      , dailyQuote
      , refreshDailyQuote: async () => {
        // Optional manual refresh (not used yet) respecting daily persistence
        const dateKey = getVirtualDateKey();
        try {
          const adherence = getAdherence(adherenceWindowDays);
          const quote = selectQuoteForAdherence(adherence);
          setDailyQuote(quote);
          setDailyQuoteSource('generated');
          await AsyncStorage.setItem(`dailyQuote_${dateKey}`, JSON.stringify(quote));
          if (user) {
            try { await updateDoc(doc(db, 'users', user.uid), { [`dailyQuotes.${dateKey}`]: quote }); } catch {}
          }
        } catch {}
      }
      , dailyQuoteSource
      , dailyMetrics
      , getDailyMetrics
      , getRecentMetrics
      , seedTestData
      , resetTestData
      , advanceProgramDay
      , initializeBeginnerState
      , devDayOffset
      , setVirtualDay
      , setAllTodayPicks
      , dailyQuest
      , dailyQuestDone
      , markDailyQuestDone: async () => {
        if (!enableEnhancedFeatures) return;
        const dateKey = getVirtualDateKey();
        if (dailyQuestDone && dailyQuestDone[dateKey]) return; // already counted
        const updated = { ...dailyQuestDone, [dateKey]: true };
        setDailyQuestDone(updated);

        // Award calm points for completing the Quest
        const QUEST_POINTS = 5;
        const newPoints = (typeof calmPoints === 'number' ? calmPoints : 0) + QUEST_POINTS;
        setCalmPoints(newPoints);

        // Persist best-effort
        if (user) {
          try { await updateDoc(doc(db, 'users', user.uid), { [`dailyQuestDone.${dateKey}`]: true, calmPoints: newPoints }); } catch {}
        }
      }
      , graceDayDates
      , lastStreakDayCounted
      , lastStreakMessage
      , evaluateStreakProgress
      , dailyMood
      , setDailyMood: (updated) => {
        try {
          // Sanitize: remove undefined/null/array values to satisfy Firestore updateDoc
          const cleaned = Object.fromEntries(
            Object.entries(updated || {}).filter(([k,v]) => {
              // Only allow strings, numbers, booleans, and simple objects
              if (v === undefined || v === null) return false;
              const type = typeof v;
              if (type === 'string' || type === 'number' || type === 'boolean') return true;
              if (type === 'object' && !Array.isArray(v)) {
                // For objects, check if it's a simple object without nested arrays/objects
                return !Object.values(v).some(val => typeof val === 'object' || Array.isArray(val));
              }
              return false;
            })
          );
          setDailyMoodState(cleaned);
          saveUserData({ dailyMood: cleaned });
        } catch (e) {
          if (__DEV__) console.warn('Error setting daily mood:', e?.message || e);
          setDailyMoodState(updated || {});
        }
      }
      , week1Anchors
      , setWeek1Anchors
      , week1RotationApplied
      , week1Completed
      , backfillDisabledBeforeDay
      , completeDaySilently
      , rolloverBannerInfo
      , dismissRolloverBanner
      , getGraceStatus
      , completedWeeksWithFireworks
      , markWeekFireworksFired
      , hasAcceptedTerms
      , acceptanceLoaded
      , acceptTerms
    }}>
      {children}
      {/* Global overlays for UX signals */}
      {badgeToast ? (
        <BadgeToast badge={badgeToast} onHide={() => setBadgeToast(null)} />
      ) : null}
      <StreakBumpOverlay bumpSeq={streakBumpSeq} />
    </AppContext.Provider>
  );
}
