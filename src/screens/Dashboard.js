// src/screens/Dashboard.js
import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Animated, Modal, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import LawChip from '../components/LawChip';
import { getLawForRoute } from '../utils/lawLabels';
import { TASK_METADATA, TASK_POOLS, getCanonicalTask } from '../utils/programData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { registerForPushNotifications, scheduleDailyMoodPrompt, scheduleMoodPromptIn, scheduleImmediateMoodPrompt, ensureNotificationPermissions, getScheduledNotificationsCount } from '../utils/notifications';
import StreakCalendar from '../components/StreakCalendar';
import StreakNumber from '../components/StreakNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LawOfTheDay from '../components/LawOfTheDay';
import ScreenErrorBoundary from '../components/ScreenErrorBoundary';
import { getCurrentUser } from '../services/auth.service';
import { updateUserData } from '../services/firestore.service';
import DailyMoodCheck from '../components/DailyMoodCheck';
import { generateDailyTasks, shouldShowMoodCheck, getTaskCategory } from '../utils/taskGenerator';
import { selectRandomTasksForMood, getMoodOption } from '../constants/moodTaskPools';
import { getTodaySteps, getTodayMetrics, getCachedSteps, getStepGoalProgress, isStepGoalMet, formatSteps, STEPS_GOAL, calculateDistance, calculateCalories } from '../services/steps.service';

const AVATAR_OPTIONS = [
  { id: 1, emoji: '🧘' },
  { id: 2, emoji: '💪' },
  { id: 3, emoji: '🎯' },
  { id: 4, emoji: '🌟' },
  { id: 5, emoji: '🔥' },
  { id: 6, emoji: '🚀' },
  { id: 7, emoji: '🌱' },
  { id: 8, emoji: '🏆' },
];

function Dashboard({ navigation, route }) {
  const { calmPoints, streak, tasks, urges, getDailyRecommendations, todayPicks, todayCompletions, toggleTodayTaskCompletion, getCurrentDay, getAdherence, adherenceWindowDays, week1SetupDone, setWeek1SetupDone, setTodayPicksForDay, setAllTodayPicks, lastStreakMessage, graceDayDates, setWeek1Anchors, week1Anchors, dailyMood, setDailyMood, dailyQuest, dailyQuestDone, markDailyQuestDone, enableEnhancedFeatures, getGeneratedTasks, devDayOffset, rolloverBannerInfo, dismissRolloverBanner, dailyMetrics, hasAcceptedTerms, loading, acceptanceLoaded, userProfile, setUserProfile, currentMood, lastMoodCheckTime, setLastMoodCheckTime } = useContext(AppContext);
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const currentDay = getCurrentDay();
  const picks = (() => {
    const saved = todayPicks[currentDay];
    if (Array.isArray(saved) && saved.length > 0) return saved;

    // If user completed new onboarding, use sync random fallback for initial render
    // (AI selection happens async in handleMoodSelect — todayPicks will update after)
    if (userProfile?.onboardingCompleted && userProfile?.coreHabits?.length > 0) {
      const fixedTasks = userProfile.coreHabits;
      const dynamicCount = currentDay <= 7 ? 2 : 3;
      const dynamicTasks = selectRandomTasksForMood(currentMood || 'good', dynamicCount, fixedTasks);
      return [...fixedTasks, ...dynamicTasks];
    }

    // Fallback to old system for users who haven't completed new onboarding
    if (currentDay > 7) {
      const gen = getGeneratedTasks(currentDay).map(t => t.task);
      return gen.slice(0, 6);
    }
    return getDailyRecommendations(3).map(t => t.title);
  })();
  const POINTS_MAP = {
    '10 min sunlight': 5,
    'Make bed': 3,
    'Drink water first thing': 2,
    '5 min stretching/yoga': 5,
    'Device-free meal': 6,
    'Breathwork 5 min': 6,
  };
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(1);
  // Global product tour is hoisted to App.js; no local guide state
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [stepsAvailable, setStepsAvailable] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const questPulse = useRef(new Animated.Value(0)).current;
  const bannerProgress = useRef(new Animated.Value(1)).current;
  const bannerTimerRef = useRef(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
    Animated.stagger(100, [
      Animated.spring(fadeAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-dismiss rollover banner after 10s with shrinking border animation
  useEffect(() => {
    const day = getCurrentDay();
    const prevDay = Math.max(1, day - 1);
    const shouldShow = rolloverBannerInfo && rolloverBannerInfo.day === prevDay;

    // reset animation
    bannerProgress.setValue(1);
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }

    if (shouldShow) {
      Animated.timing(bannerProgress, {
        toValue: 0,
        duration: 10000,
        useNativeDriver: true,
        easing: undefined,
      }).start(({ finished }) => {
        if (finished) dismissRolloverBanner();
      });
      bannerTimerRef.current = setTimeout(() => {
        dismissRolloverBanner();
      }, 10000);
    }

    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
    };
  }, [rolloverBannerInfo, getCurrentDay]);

  // Subtle pulse to highlight Quest availability when not completed
  useEffect(() => {
    const dateKey = new Date().toISOString().slice(0,10);
    const done = !!(dailyQuestDone && dailyQuestDone[dateKey]);
    if (!dailyQuest || done) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(questPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(questPulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { try { loop.stop(); } catch {} };
  }, [dailyQuest, JSON.stringify(dailyQuestDone)]);

  // Show mood check when Dashboard gains focus
  useEffect(() => {
    const onFocus = navigation.addListener('focus', async () => {
      // Block mood modal until terms are accepted
      if (!hasAcceptedTerms || loading || !acceptanceLoaded) {
        setShowMoodPrompt(false);
        return;
      }

      const day = getCurrentDay();

      // Product tour is shown globally (App.js) and unskippable; removed local trigger

      // Show mood check based on cooldown and onboarding completion
      try {
        const onboardingActive = (day === 1 && !week1SetupDone);
        const onboardingDone = userProfile?.onboardingCompleted || false;

        if (__DEV__) {
          console.log('[Dashboard] Mood check logic:', {
            day,
            onboardingActive,
            onboardingDone,
            week1SetupDone,
            userProfile: userProfile?.onboardingCompleted,
            lastMoodCheckTime,
            hasAcceptedTerms,
            loading,
            acceptanceLoaded
          });
        }

        // Only show mood check if new onboarding is completed and cooldown allows
        if (onboardingDone && !onboardingActive) {
          const shouldShow = shouldShowMoodCheck(lastMoodCheckTime, 2); // 2-hour cooldown
          if (__DEV__) console.log('[Dashboard] shouldShowMoodCheck result:', shouldShow);
          setShowMoodPrompt(shouldShow);
        } else {
          if (__DEV__) console.log('[Dashboard] Mood check blocked - onboarding not done or still active');
          setShowMoodPrompt(false);
        }
      } catch {
        setShowMoodPrompt(false);
      }

      // Persist generated picks for current day post-Week 1 if missing, with recency avoidance
      try {
        if (day > 7) {
          const saved = todayPicks[day];
          if (!Array.isArray(saved) || saved.length === 0) {
            const adherenceVal = getAdherence ? getAdherence(adherenceWindowDays) : 0;
            const allowHigh = adherenceVal >= 0.8;
            const baseGenerated = getGeneratedTasks(day) || [];
            const recencySetCanonical = new Set([...(todayPicks[day - 1] || []), ...(todayPicks[day - 2] || [])].map(getCanonicalTask));
            let filtered = baseGenerated.filter(t => !recencySetCanonical.has(getCanonicalTask(t.task)));
            const MIN_COUNT = 6;
            const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
            const seed = String(day);
            if (filtered.length < MIN_COUNT) {
              const fillCandidates = TASK_POOLS
                .map(title => ({ title, canonical: getCanonicalTask(title), meta: TASK_METADATA[title] || { friction: 'med', domain: 'focus' } }))
                .filter(c => !recencySetCanonical.has(c.canonical) && !filtered.some(x => getCanonicalTask(x.task) === c.canonical) && (allowHigh || c.meta.friction !== 'high'))
                .sort((a,b) => (hashStr(a.title + '|' + seed) % 100000) - (hashStr(b.title + '|' + seed) % 100000));
              const need = Math.max(0, MIN_COUNT - filtered.length);
              filtered = [...filtered, ...fillCandidates.slice(0, need).map(c => ({ task: c.title }))];
            }
            const titles = filtered.map(t => t.task).slice(0, 10);
            if (titles.length > 0) {
              setTodayPicksForDay(day, titles);
            }
          }
        }
      } catch {}
    });
    const onBlur = navigation.addListener('blur', () => {
      setShowMoodPrompt(false);
    });
    return () => {
      onFocus();
      onBlur();
    };
  }, [navigation, week1SetupDone, getCurrentDay, JSON.stringify(dailyMood), hasAcceptedTerms, loading, acceptanceLoaded, userProfile, lastMoodCheckTime]);

  // Set up a daily mood prompt notification using persisted settings
  useEffect(() => {
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem('moodEnabled');
        const hourStr = await AsyncStorage.getItem('moodHour');
        const minuteStr = await AsyncStorage.getItem('moodMinute');
        const moodOn = enabled === null ? true : (enabled === 'true');
        const hour = hourStr ? parseInt(hourStr) : 20;
        const minute = minuteStr ? parseInt(minuteStr) : 0;
        if (moodOn) {
          await registerForPushNotifications();
          // Only schedule if not already scheduled (deduplication handled in scheduleDailyMoodPrompt)
          await scheduleDailyMoodPrompt(hour, minute);
        }
      } catch (e) {
        // non-fatal
      }
    })();
  }, []);


  const handleMoodSelect = async (moodId) => {
    try {
      if (__DEV__) console.log('[Dashboard] Mood selected:', moodId);

      // Build user context for AI task selection
      const recentTasks = [
        ...(todayPicks[currentDay - 1] || []),
        ...(todayPicks[currentDay - 2] || []),
      ].slice(0, 6);
      const recentUrgeEmotions = urges
        .slice(-7)
        .map(u => u.emotion)
        .filter(Boolean);
      const userContext = {
        streak,
        recentTasks,
        recentUrgeEmotions,
      };

      // Generate tasks with AI selection (falls back to random if Groq unavailable)
      const { allTasks, aiSelected } = await generateDailyTasks(currentDay, userProfile, moodId, userContext);
      setTodayPicksForDay(currentDay, allTasks);

      const timestamp = new Date().toISOString();
      setLastMoodCheckTime(timestamp);

      await setUserProfile({
        ...userProfile,
        lastMood: moodId,
        lastMoodCheckTime: timestamp,
        aiPickDate: aiSelected ? new Date().toDateString() : (userProfile?.aiPickDate || null),
      });

      if (__DEV__) console.log('[Dashboard] Mood selection completed successfully');
      setShowMoodPrompt(false);
    } catch (error) {
      console.error('[Dashboard] Error in handleMoodSelect:', error?.message || error);
      // Still close modal to prevent user being stuck
      setShowMoodPrompt(false);
      // Optionally show user-friendly error (can add Alert if needed)
    }
  };

  const handleMoodSkip = async () => {
    try {
      if (__DEV__) console.log('[Dashboard] Mood skipped');

      const { allTasks } = await generateDailyTasks(currentDay, userProfile, 'good');
      setTodayPicksForDay(currentDay, allTasks);

      const timestamp = new Date().toISOString();
      setLastMoodCheckTime(timestamp);

      await setUserProfile({
        ...userProfile,
        lastMood: 'good',
        lastMoodCheckTime: timestamp,
      });

      if (__DEV__) console.log('[Dashboard] Mood skip completed successfully');
      setShowMoodPrompt(false);
    } catch (error) {
      console.error('[Dashboard] Error in handleMoodSkip:', error?.message || error);
      // Still close modal to prevent user being stuck
      setShowMoodPrompt(false);
    }
  };

  const loadProfile = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedAvatar = await AsyncStorage.getItem('avatar');
      if (savedUsername) setUsername(savedUsername);
      if (savedAvatar) setAvatar(parseInt(savedAvatar));
    } catch (error) {
      if (__DEV__) console.error('Error loading profile:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();

    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
  };

  // Reload profile when navigating back from Profile screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  // Load step count on mount and on focus
  useEffect(() => {
    const loadSteps = async () => {
      // Show cached steps instantly, then refresh in background
      const cached = await getCachedSteps();
      if (cached > 0) {
        setSteps(cached);
        setDistance(calculateDistance(cached));
        setCalories(calculateCalories(cached));
        setStepsAvailable(true);
      }
      const result = await getTodaySteps();
      setStepsAvailable(result.available && result.permissionGranted);
      if (result.steps >= 0) {
        setSteps(result.steps);
        setDistance(calculateDistance(result.steps));
        setCalories(calculateCalories(result.steps));
      }
    };

    loadSteps();
    const unsubscribe = navigation.addListener('focus', loadSteps);
    return unsubscribe;
  }, [navigation]);
  
  const completedTasks = tasks.filter(t => t.done).length;
  const countUrgesOnDate = (dateObj) => {
    const key = dateObj.toDateString();
    return urges.filter(u => new Date(u.timestamp).toDateString() === key).length;
  };
  const todayDate = new Date();
  try { if (devDayOffset && Number.isFinite(devDayOffset)) todayDate.setDate(todayDate.getDate() + devDayOffset); } catch {}
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const todayUrges = countUrgesOnDate(todayDate);
  const yesterdayUrges = countUrgesOnDate(yesterdayDate);
  const urgesTrendDown = yesterdayUrges > 0 ? todayUrges < yesterdayUrges : todayUrges === 0;

  // Dynamic Calm Points earned today based on task completions
  const todayCompMap = todayCompletions[currentDay] || {};
  let todayPoints = Object.entries(todayCompMap).reduce((sum, [title, done]) => {
    if (!done) return sum;
    const meta = TASK_METADATA[title] || {};
    const pts = (typeof meta.points === 'number') ? meta.points : 5;
    return sum + pts;
  }, 0);
  
  // Include Quest bonus if completed today only when enabled
  const virtualToday = new Date();
  try { if (devDayOffset && Number.isFinite(devDayOffset)) virtualToday.setDate(virtualToday.getDate() + devDayOffset); } catch {}
  const dateKey = virtualToday.toISOString().slice(0,10);
  if (enableEnhancedFeatures) {
    try {
      const questDoneToday = !!(dailyQuestDone && dailyQuestDone[dateKey]);
      if (questDoneToday) todayPoints += 5;
    } catch {}
  }
  // Include urge log bonus (+2 CP per urge logged today)
  todayPoints += todayUrges * 2;
  
  // Safeguard: ensure todayPoints is a valid number (fix rendering disappearance)
  todayPoints = typeof todayPoints === 'number' && !isNaN(todayPoints) ? todayPoints : 0;

  // Streak trend: compare today's vs yesterday's actual streak value
  const todayStreakValue = streak;
  const yesterdayMetrics = dailyMetrics[`${currentDay - 1}`] || {};
  const yesterdayStreakValue = yesterdayMetrics.streak || 0;
  const streakTrendUp = todayStreakValue > yesterdayStreakValue;
  const streakTrendText = todayStreakValue === yesterdayStreakValue ? 'Hold' : (streakTrendUp ? 'Uptrend' : 'Lower');

  const todayDoneCount = Object.values(todayCompMap).filter(Boolean).length;

  // Get latest mood from array or fall back to old format
  const getMoodFromStorage = () => {
    const moodData = dailyMood[dateKey];
    if (!moodData) return null;
    // If it's an array (new format from logMood), get the latest entry
    if (Array.isArray(moodData) && moodData.length > 0) {
      const moodId = moodData[moodData.length - 1]?.mood || null;
      if (!moodId) return null;
      // Map mood ID to MOOD_OPTIONS to get emoji and label
      const moodOption = getMoodOption(moodId);
      return moodOption || null;
    }
    // If it's a string/object (old format), return it directly
    if (typeof moodData === 'string' || (typeof moodData === 'object' && moodData.emoji)) {
      return moodData;
    }
    return null;
  };

  const todayMood = getMoodFromStorage();
  const parseMood = (m) => {
    if (!m) return { emoji: '😊', label: null };
    if (typeof m === 'string') {
      const parts = m.split(' ');
      return { emoji: parts[0] || '😊', label: parts.slice(1).join(' ') || null };
    }
    if (typeof m === 'object' && m.emoji) {
      return { emoji: m.emoji, label: m.label || null };
    }
    return { emoji: '😊', label: null };
  };
  const setTodayMood = (mood) => {
    const updated = { ...dailyMood, [dateKey]: mood };
    setDailyMood(updated);
  };

  // Mood card display helpers
  const moodParsed = parseMood(todayMood);
  const moodKey = (moodParsed.label || '').toLowerCase();
  let moodColor = isDarkMode ? '#A8B0D8' : '#6B7280';
  let moodBg = isDarkMode ? colors.surfaceSecondary : '#F3F4F6';
  if (moodKey.includes('great')) { moodColor = isDarkMode ? '#A7F3D0' : '#10B981'; moodBg = isDarkMode ? '#064E3B' : '#ECFDF5'; }
  else if (moodKey.includes('okay')) { moodColor = isDarkMode ? '#BFDBFE' : '#3B82F6'; moodBg = isDarkMode ? '#0C4A6E' : '#EFF6FF'; }
  else if (moodKey.includes('low')) { moodColor = isDarkMode ? '#FCD34D' : '#F59E0B'; moodBg = isDarkMode ? '#422006' : '#FFFBEB'; }
  else if (moodKey.includes('stressed')) { moodColor = isDarkMode ? '#FCA5A5' : '#EF4444'; moodBg = isDarkMode ? '#7F1D1D' : '#FEE2E2'; }

  // Compare against last logged mood
  const moodScore = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('great')) return 3;
    if (l.includes('okay')) return 2;
    if (l.includes('low')) return 1;
    if (l.includes('stressed')) return 0;
    return null;
  };
  let prevMoodLabel = null;
  try {
    const keys = Object.keys(dailyMood || {}).filter(k => k !== dateKey).sort().reverse();
    for (const k of keys) {
      const val = dailyMood[k];
      const parsed = parseMood(val);
      if (parsed && parsed.label) { prevMoodLabel = parsed.label; break; }
    }
  } catch {}
  const todayScore = moodScore(moodParsed.label);
  const prevScore = moodScore(prevMoodLabel);
  let trendText = null, trendIcon = 'remove', trendColor = '#6B7280';
  if (todayScore !== null && prevScore !== null) {
    if (todayScore > prevScore) { trendText = 'Better'; trendIcon = 'arrow-up'; trendColor = '#10B981'; }
    else if (todayScore < prevScore) { trendText = 'Lower'; trendIcon = 'arrow-down'; trendColor = '#EF4444'; }
    else { trendText = 'Same'; trendIcon = 'remove'; trendColor = '#9CA3AF'; }
  }

  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === avatar);
  const adherence = getAdherence ? getAdherence(adherenceWindowDays) : 0;
  const adherencePct = Math.round(adherence * 100);
  let adherenceMsg = 'Start tiny: lock 1 win.';
  let adherenceColor = '#10B981';
  if (adherence >= 0.8) { adherenceMsg = 'Momentum strong — keep compounding.'; adherenceColor = '#10B981'; }
  else if (adherence >= 0.5) { adherenceMsg = 'Solid base — nudge consistency.'; adherenceColor = '#F59E0B'; }
  else { adherenceMsg = 'No worries — one small win today.'; adherenceColor = '#EF4444'; }
  const displayName = username || 'Warrior';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 } ]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Animated.View
        style={[
          { flex: 1 },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.text }]}>ResetDopa™</Text>
            <View style={{ marginTop: 6 }}>
              <LawChip law={getLawForRoute(route?.name || 'Dashboard')} />
            </View>
          </View>
          <View style={styles.headerIcons}>
            <View style={{ marginRight: 10 }}>
              <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              onLongPress={async () => {
                // DEV-only helper: open mood modal and schedule a test notification in 5s
                if (__DEV__) {
                  try {
                    console.log('[Dashboard] Long press detected, setting showMoodPrompt to true');
                    setShowMoodPrompt(true);
                    console.log('[Dashboard] showMoodPrompt state updated');
                    await registerForPushNotifications();
                    const hasPerm = await ensureNotificationPermissions();
                    if (!hasPerm) {
                      Alert.alert('Notifications Disabled', 'Enable notifications for Expo Go in system settings to test prompts.');
                      return;
                    }
                    // Trigger one immediate + one delayed notification
                    await scheduleImmediateMoodPrompt();
                    await scheduleMoodPromptIn(5);
                    const count = await getScheduledNotificationsCount();
                    console.log(`[Notifications] Scheduled items: ${count}`);
                  } catch {}
                }
              }}
              delayLongPress={400}
            >
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity onPress={handleThemeToggle}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity 
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
              onLongPress={() => {
                if (__DEV__) {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yKey = yesterday.toISOString().slice(0,10);
                  const applySeed = (label) => {
                    try {
                      const updated = { ...(dailyMood || {}), [yKey]: label };
                      setDailyMood(updated);
                    } catch {}
                  };
                  Alert.alert(
                    'Seed Yesterday\'s Mood',
                    'Quickly set a previous mood to test the trend arrow.',
                    [
                      { text: '😊 Great', onPress: () => applySeed('😊 Great') },
                      { text: '😐 Okay', onPress: () => applySeed('😐 Okay') },
                      { text: '😞 Low', onPress: () => applySeed('😞 Low') },
                      { text: '😡 Stressed', onPress: () => applySeed('😡 Stressed') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }
              }}
              delayLongPress={400}
            >
              <Text style={styles.avatarEmoji}>{selectedAvatarData?.emoji || '🧘'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rollover Banner */}
        {(() => {
          const day = getCurrentDay();
          const prevDay = Math.max(1, day - 1);
          const info = rolloverBannerInfo;
          const show = info && (info.day === prevDay || info.day === day);
          if (!show) return null;
          let bg = '#ECFDF5', border = '#10B981', icon = 'checkmark-circle', title = 'Streak Advanced';
          if (info.type === 'grace') { bg = '#EFF6FF'; border = '#3B82F6'; icon = 'scale'; title = 'Grace Applied'; }
          if (info.type === 'reset') { bg = '#FEF2F2'; border = '#EF4444'; icon = 'alert-circle'; title = 'Streak Reset'; }
          if (info.type === 'hold') { bg = '#FFFBEB'; border = '#F59E0B'; icon = 'time-outline'; title = 'Streak Holding'; }

          // Dark mode color mapping
          let darkBg = isDarkMode ? '#064E3B' : bg;
          let darkBorder = isDarkMode ? '#10B981' : border;
          if (info.type === 'grace') { darkBg = isDarkMode ? '#0C4A6E' : bg; darkBorder = isDarkMode ? '#3B82F6' : border; }
          if (info.type === 'reset') { darkBg = isDarkMode ? '#7F1D1D' : bg; darkBorder = isDarkMode ? '#EF4444' : border; }
          if (info.type === 'hold') { darkBg = isDarkMode ? '#422006' : bg; darkBorder = isDarkMode ? '#F59E0B' : border; }

          return (
            <View style={[styles.bannerCard, { backgroundColor: darkBg, borderColor: darkBorder }]}>
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 3,
                  backgroundColor: darkBorder,
                  transform: [{ scaleX: bannerProgress }],
                  transformOrigin: 'left',
                }}
              />
              <View style={{ flexDirection:'row', alignItems:'center', flex:1 }}>
                <Ionicons name={icon} size={20} color={darkBorder} style={{ marginRight:8 }} />
                <View style={{ flex:1 }}>
                  <Text style={[styles.bannerTitle, { color: darkBorder }]}>{title}</Text>
                  <Text style={[styles.bannerText, { color: colors.textSecondary }]}>{info.message}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={dismissRolloverBanner} style={styles.bannerClose}>
                <Ionicons name="close" size={18} color={isDarkMode ? colors.textSecondary : '#6B7280'} />
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Product Tour is now global in App.js */}

        {/* Law of the Day */}
        <LawOfTheDay onLearnMore={() => navigation.navigate('LearnLaws')} />

      {/* Calm Points Card with Gradient Circle */}
      <View style={[styles.pointsCard, { backgroundColor: isDarkMode ? colors.surfacePrimary : '#fff' }]}>
        <View style={styles.circleContainer}>
          <View style={styles.outerCircle}>
            <LinearGradient
              colors={['#4A90E2', '#50E3C2', '#7ED321']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            />
            <View style={[styles.innerCircle, { backgroundColor: isDarkMode ? colors.background : '#fff' }]}>
              <Text style={[styles.pointsNumber, { color: colors.text }]}>{calmPoints}</Text>
              <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>Calm Points</Text>
              <Text style={styles.pointsToday}>+{todayPoints} Today</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
          <StreakNumber style={[styles.statValue, { color: colors.text }]} suffix=" Days" />
          <View style={styles.statTrend}>
            <Ionicons name={streakTrendUp ? "arrow-up" : (todayStreakValue === yesterdayStreakValue ? "remove" : "arrow-down")} size={12} color={isDarkMode ? '#30D158' : '#50E3C2'} />
            <Text style={[styles.statTrendText, { color: isDarkMode ? '#30D158' : '#50E3C2' }]}>{streakTrendText}</Text>
          </View>
        </View>

        <View
          style={[styles.statCard, styles.moodCard, { borderColor: moodColor, backgroundColor: colors.surfacePrimary }]}
        >
          <Text style={styles.moodEmoji}>{moodParsed.emoji}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mood</Text>
          <Text style={[styles.statValue, { color: moodColor }]}>{moodParsed.label || 'No entry'}</Text>
          {trendText && (
            <View style={[styles.statTrend, { marginTop: 4 }]}>
              <Ionicons name={trendIcon} size={14} color={trendColor} />
              <Text style={[styles.statTrendText, { color: trendColor }]}>{trendText}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Urges</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{todayUrges}</Text>
          <View style={styles.statTrend}>
            <Ionicons name={urgesTrendDown ? "arrow-down" : "arrow-up"} size={12} color={isDarkMode ? '#30D158' : '#50E3C2'} />
            <Text style={[styles.statTrendText, { color: isDarkMode ? '#30D158' : '#50E3C2' }]}>{urgesTrendDown ? 'Lower' : 'Higher'}</Text>
          </View>
        </View>
      </View>

      {/* Steps Widget - only shown if pedometer is available */}
      {stepsAvailable && (
        <View style={[styles.stepsCard, { backgroundColor: colors.surfacePrimary }]}>
          <View style={styles.stepsHeader}>
            <View style={styles.stepsLeft}>
              <Text style={styles.stepsIcon}>👟</Text>
              <View>
                <Text style={[styles.stepsLabel, { color: colors.textSecondary }]}>Daily Steps</Text>
                <Text style={[styles.stepsCount, { color: colors.text }]}>
                  {formatSteps(steps)}
                  <Text style={[styles.stepsGoalText, { color: colors.textSecondary }]}> / {formatSteps(STEPS_GOAL)}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.stepsRight}>
              {isStepGoalMet(steps) ? (
                <View style={[styles.stepsGoalBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
                  <Text style={[styles.stepsGoalBadgeText, { color: isDarkMode ? '#A7F3D0' : '#10B981' }]}>Goal Met! 🎉</Text>
                </View>
              ) : (
                <Text style={[styles.stepsPctText, { color: colors.accent }]}>
                  {getStepGoalProgress(steps)}%
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.stepsTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.stepsFill, {
              width: `${getStepGoalProgress(steps)}%`,
              backgroundColor: isStepGoalMet(steps) ? '#10B981' : colors.accent
            }]} />
          </View>

          {/* Distance and Calories Metrics */}
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🚶</Text>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Distance</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{distance} mi</Text>
                </View>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🔥</Text>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Calories</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{calories} cal</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Adherence Card (hidden until after Day 3) */}
      {currentDay > 3 && (
        <View style={[styles.adherenceCard, { backgroundColor: colors.surfacePrimary }]}>
          <View style={styles.adherenceHeaderRow}>
            <Text style={[styles.adherenceTitle, { color: colors.text }]}>Consistency (3d)</Text>
            <Text style={styles.adherencePct}>{adherencePct}%</Text>
          </View>
          <View style={[styles.adherenceBarOuter, { backgroundColor: isDarkMode ? colors.surfaceSecondary : '#F3F4F6' }]}>
          <View style={[styles.adherenceBarInner,{ width: `${Math.min(100, adherencePct)}%`, backgroundColor: adherenceColor }]} />
          </View>
          <Text style={[styles.adherenceMsg, { color: colors.textSecondary }]}>{adherenceMsg}</Text>
        </View>
      )}

      {/* Quest of the Day (reward: only when all of today's tasks are completed) */}
      {(() => {
        const picksForToday = todayPicks[currentDay] || [];
        const targetCount = currentDay <= 7 ? 3 : Math.max(picksForToday.length || 3, 3);
        const showQuest = enableEnhancedFeatures && !!dailyQuest && todayDoneCount >= targetCount;
        if (!showQuest) return null;
        
        const questVirtualToday = new Date();
        try { if (devDayOffset && Number.isFinite(devDayOffset)) questVirtualToday.setDate(questVirtualToday.getDate() + devDayOffset); } catch {}
        const questDateKey = questVirtualToday.toISOString().slice(0,10);
        const done = !!(dailyQuestDone && dailyQuestDone[questDateKey]);
        return (
          <View>
            <TouchableOpacity onPress={() => setShowQuestModal(true)} style={[styles.questCard, { backgroundColor: isDarkMode ? '#422006' : '#FFFBEB', borderColor: isDarkMode ? '#78350F' : '#F59E0B', shadowColor: isDarkMode ? '#000' : '#F59E0B' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <Text style={[styles.questTitle, { color: colors.text }]}>Quest of the Day</Text>
                <View style={{ position:'relative' }}>
                  {!done && (
                    <Animated.View style={[styles.newPulse, { transform:[{ scale: questPulse.interpolate({ inputRange:[0,1], outputRange:[1,1.12] }) }], opacity: questPulse.interpolate({ inputRange:[0,1], outputRange:[0.35, 0] }) }]} />
                  )}
                  <View style={[styles.newPill, { backgroundColor: isDarkMode ? '#78350F' : '#F59E0B' }]}>
                    <Text style={[styles.newPillText, { color: isDarkMode ? '#FCD34D' : '#FFF' }]}>{done ? 'Completed' : 'New'}</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.questText, { color: colors.text }]}>• {dailyQuest}</Text>
            </TouchableOpacity>

            <Modal visible={showQuestModal} animationType="slide" transparent>
              <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setShowQuestModal(false)}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: isDarkMode ? colors.background : '#FFFFFF', borderColor: isDarkMode ? colors.border : '#E5E7EB' }]} onPress={(e) => e.stopPropagation()}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Quest of the Day</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>A tiny win that nudges progress today — Reward: +5 Calm Points</Text>
                  <View style={{ marginTop:12 }}>
                    <Text style={[styles.modalText, { color: colors.text }]}>• {dailyQuest}</Text>
                  </View>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:16 }}>
                    <TouchableOpacity onPress={() => setShowQuestModal(false)} style={[styles.modalBtn, { backgroundColor: isDarkMode ? colors.surfacePrimary : '#F3F4F6', borderColor: isDarkMode ? colors.border : '#D1D5DB' }] }>
                      <Text style={[styles.modalBtnText, { color: colors.text }]}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { if (!done) await markDailyQuestDone(); setShowQuestModal(false); }} style={[styles.modalBtn, done ? { backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5', borderColor: isDarkMode ? '#10B981' : '#10B981' } : { backgroundColor: isDarkMode ? '#422006' : '#FDF2F8', borderColor: isDarkMode ? '#78350F' : '#F59E0B' }] }>
                      <Text style={[styles.modalBtnText, done ? { color: isDarkMode ? '#A7F3D0' : '#065F46' } : { color: isDarkMode ? '#FCD34D' : '#92400E' }]}>{done ? 'Completed' : 'Mark Done'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </View>
        );
      })()}

      {/* Streak Calendar */}
      <StreakCalendar streak={streak} urges={urges} />

      {/* Today's Picks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Picks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Program')}>
            <Text style={styles.sectionSubtitle}>{picks.length} {picks.length === 1 ? 'task' : 'tasks'} • {todayDoneCount} done</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.viewProgramButton, { backgroundColor: colors.surfacePrimary }]}
          onPress={() => navigation.navigate('Program')}
        >
          <View style={styles.viewProgramContent}>
            <View style={styles.viewProgramLeft}>
              <Ionicons name="list" size={24} color={colors.accent} />
              <View style={styles.viewProgramText}>
                <Text style={[styles.viewProgramTitle, { color: colors.text }]}>View Today's Program</Text>
                <Text style={[styles.viewProgramSubtitle, { color: colors.textSecondary }]}>Mark tasks and track your progress</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Removed duplicate Daily Tasks section to avoid redundancy */}
        </ScrollView>
      </Animated.View>

      {/* New Mood Check Modal */}
      {__DEV__ && console.log('[Dashboard] Rendering DailyMoodCheck with visible=', showMoodPrompt)}
      <DailyMoodCheck
        visible={showMoodPrompt}
        onMoodSelect={handleMoodSelect}
        onSkip={handleMoodSkip}
      />
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Will be overridden inline
  },
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  bannerCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection:'row',
    alignItems:'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
  },
  bannerClose: {
    padding: 6,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLogoMini: {
    width: 28,
    height: 28,
    marginHorizontal: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  pointsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  pointsLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  pointsToday: {
    fontSize: 14,
    color: '#50E3C2',
    marginTop: 4,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    color: '#50E3C2',
    fontWeight: '600',
  },
  moodCard: {
    alignItems: 'center',
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  moodTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakMsg: {
    marginTop: 6,
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  graceHint: {
    marginTop: 4,
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionLink: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: '#50E3C2',
    borderColor: '#50E3C2',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskTitleDone: {
    color: '#6B7280',
  },
  taskPoints: {
    fontSize: 13,
    color: '#6B7280',
  },
  taskPointsRight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepsIcon: {
    fontSize: 24,
  },
  stepsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepsCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepsGoalText: {
    fontSize: 13,
    fontWeight: '400',
  },
  stepsRight: {
    alignItems: 'flex-end',
  },
  stepsPctText: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepsGoalBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepsGoalBadgeText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  stepsTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepsFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  adherenceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adherenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  adherencePct: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A90E2',
  },
  adherenceBarOuter: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  adherenceBarInner: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  adherenceMsg: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  questCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  questText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  questHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  questBtn: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  questBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  newPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
  },
  newPillText: {
    color:'#FFF',
    fontSize:11,
    fontWeight:'800',
    letterSpacing:0.2,
  },
  newPulse: {
    position:'absolute',
    top: -4,
    right: -6,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
  // Quest modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Onboarding modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  pickChipActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  pickChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  pickChipTextActive: {
    color: '#065F46',
  },
  selectorHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  modalConfirmBtn: {
    marginTop: 12,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  viewProgramButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  viewProgramContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  viewProgramLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  viewProgramText: {
    flex: 1,
  },
  viewProgramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  viewProgramSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});

// Wrap Dashboard with ErrorBoundary
export default function DashboardWithErrorBoundary(props) {
  return (
    <ScreenErrorBoundary screenName="Dashboard" navigation={props.navigation}>
      <Dashboard {...props} />
    </ScreenErrorBoundary>
  );
}




