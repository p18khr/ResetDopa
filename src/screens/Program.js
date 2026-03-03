// src/screens/Program.js
import { ScrollView, StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, Modal, ActivityIndicator, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PROGRAM_DAY_TITLES, getTaskBenefit, TASK_METADATA, TASK_POOLS, getCanonicalTask, getTaskExplanation, getTaskScience } from '../utils/programData';
import LawChip from '../components/LawChip';
import { getLawForRoute } from '../utils/lawLabels';
import FireworksOverlay from '../components/FireworksOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirstVisitOverlay from '../components/FirstVisitOverlay';
import ScreenErrorBoundary from '../components/ScreenErrorBoundary';
import { generateDailyTasks, getTaskCategory } from '../utils/taskGenerator';
import { getMoodOption } from '../constants/moodTaskPools';
import TimerModal from '../components/TimerModal';
import { parseTaskDuration } from '../utils/timerUtils';
import ConfettiAnimation from '../components/ConfettiAnimation';
import TaskGuideModal from '../components/TaskGuideModal';
import StretchingCarousel from '../components/StretchingCarousel';
import { getGuideForTask } from '../utils/taskGuideDetector';
import { playSuccessSound } from '../utils/audioUtils';
// Removed Week1 modal onboarding (handled now in Dashboard)
// Daily quote now provided by context (persisted & adherence-informed)


function Program({ navigation, route }) {
  const { todayPicks, todayCompletions, toggleTodayTaskCompletion, getCurrentDay, getAdherence, getGeneratedTasks, PROGRAM_DAY_TITLES, dailyQuote, dailyQuoteSource, urges, startDate, setStartDate, week1SetupDone, week1Anchors, enableEnhancedFeatures, week1Completed, backfillDisabledBeforeDay, advanceProgramDay, completeDaySilently, completedWeeksWithFireworks, markWeekFireworksFired, getDynamicTaskCount, userProfile, currentMood } = useContext(AppContext);
  const { isDarkMode, colors } = useTheme();
  const currentDay = getCurrentDay();
  const [infoTask, setInfoTask] = useState(null);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [gateLoading, setGateLoading] = useState(false);
  const [curatedFlash, setCuratedFlash] = useState(false);
  const isFocused = useIsFocused();
  const [showFireworks, setShowFireworks] = useState(false);
  const [fireworksKey, setFireworksKey] = useState(0);
  const prevCompletedWeeksRef = useRef(new Set(completedWeeksWithFireworks || [])); // Initialize with persisted weeks
  const [lastObservedDay, setLastObservedDay] = useState(currentDay);
  const [showIntro, setShowIntro] = useState(false);
  const [introCheckPending, setIntroCheckPending] = useState(true);
  const [showDay2Loader, setShowDay2Loader] = useState(false); // Day 2+ loader
  const loaderShownForDayRef = useRef(null); // Track which day loader was shown for
  const loaderQuoteOpacity = useRef(new Animated.Value(0)).current;
  const loaderOverlayOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const modalFadeOpacity = useRef(new Animated.Value(0)).current; // Modal fade-in animation

  // Timer modal state
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerTaskName, setTimerTaskName] = useState('');
  const [timerDuration, setTimerDuration] = useState(10);
  const [timerTaskDay, setTimerTaskDay] = useState(null);
  const [timerTaskPoints, setTimerTaskPoints] = useState(0);

  // Guide modal state (independent of completion logic)
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null); // { type, duration }
  const [showStretchingGuide, setShowStretchingGuide] = useState(false);
  const [stretchingTaskDay, setStretchingTaskDay] = useState(null);
  const [stretchingTaskName, setStretchingTaskName] = useState('');
  const [stretchingTaskPoints, setStretchingTaskPoints] = useState(0);

  // Confetti animation state (triggered AFTER task complete)
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle task completion with optional timer
  const handleTaskPress = (day, taskName, points = 0) => {
    const durationData = parseTaskDuration(taskName);

    // Check if task has a guide - show as informational, but don't block completion
    const guide = getGuideForTask(taskName);
    if (guide && guide.type === 'stretching') {
      setShowStretchingGuide(true);
      setStretchingTaskDay(day);
      setStretchingTaskName(taskName);
      setStretchingTaskPoints(points);
      // Stretching carousel has its own timer - don't show TimerModal
      return;
    } else if (guide && (guide.type === 'breathwork' || guide.type === 'meditation')) {
      setCurrentGuide(guide);
      setShowGuideModal(true);
      // Don't return - let task completion flow continue below
    }

    // Proceed with normal completion flow (only for non-stretching tasks)
    if (durationData) {
      // Task has a timer - show the TimerModal
      setTimerTaskName(taskName);
      setTimerDuration(durationData.duration);
      setTimerTaskDay(day);
      setTimerTaskPoints(points);
      setTimerVisible(true);
    } else {
      // No timer - mark complete directly and show celebration
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      toggleTodayTaskCompletion(day, taskName, points);
      playSuccessSound();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  };

  const handleTimerComplete = () => {
    // Timer finished - mark task as complete and celebrate
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTodayTaskCompletion(timerTaskDay, timerTaskName, timerTaskPoints);
    playSuccessSound();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const handleTimerSkip = () => {
    // Skip without marking complete - modal will close automatically
  };

  const handleStretchingComplete = () => {
    // Mark task as complete after stretching
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTodayTaskCompletion(stretchingTaskDay, stretchingTaskName, stretchingTaskPoints);
    playSuccessSound();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    setShowStretchingGuide(false);
  };

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Default to Today when the program day advances; otherwise preserve user selection within allowed window
  useEffect(() => {
    if (!isFocused) return;
    const d = getCurrentDay();
    if (d !== lastObservedDay) {
      setSelectedDay(d);
      setLastObservedDay(d);
      return;
    }
    // Allow week-end days (7, 14, 21, 28) to always be selectable for summary viewing
    const weekEnds = [7, 14, 21, 28];
    if (weekEnds.includes(selectedDay)) {
      // User is viewing a week summary; don't reset
      return;
    }
    // For other days, enforce the sliding window
    const minAllowed = Math.max(1, d - 2);
    if (selectedDay > d || selectedDay < minAllowed) {
      setSelectedDay(d);
    }
  }, [isFocused, getCurrentDay, selectedDay, lastObservedDay]);

  // Show first-visit overlay: if pending from Dashboard or not seen before
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pending = await AsyncStorage.getItem('program_intro_pending');
        const seen = await AsyncStorage.getItem('seen_intro_program');
        if (!mounted) return;
        if (pending === 'true' || seen !== 'true') {
          setShowIntro(true);
          if (pending === 'true') { try { await AsyncStorage.removeItem('program_intro_pending'); } catch {} }
        }
        if (mounted) setIntroCheckPending(false);
      } catch {
        if (mounted) setIntroCheckPending(false);
      }
    })();
    return () => { mounted = false; };
  }, [isFocused]);

  // Animate modal fade-in when intro appears
  useEffect(() => {
    let mounted = true;
    
    if (showIntro && currentDay === 1) {
      modalFadeOpacity.setValue(0);
      Animated.timing(modalFadeOpacity, {
        toValue: 1,
        duration: 800, // Slow fade in
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!mounted) return;
      });
    } else {
      modalFadeOpacity.setValue(0);
    }
    
    return () => { mounted = false; };
  }, [showIntro, currentDay]);

  // Day 2+ loader: White overlay with quote, fades out slowly
  useEffect(() => {
    if (!isFocused) {
      // When screen loses focus, immediately hide loader and reset animations
      setShowDay2Loader(false);
      loaderQuoteOpacity.setValue(0);
      loaderOverlayOpacity.setValue(1);
      contentOpacity.setValue(1);
      return;
    }
    
    if (currentDay === 1) return; // Skip on Day 1

    // Don't re-show if already shown for this day
    if (loaderShownForDayRef.current === currentDay) return;

    loaderShownForDayRef.current = currentDay;

    let mounted = true;
    let timers = [];

    // Show loader immediately
    loaderQuoteOpacity.setValue(0);
    loaderOverlayOpacity.setValue(1);
    contentOpacity.setValue(1); // Keep content visible behind loader
    setShowDay2Loader(true);

    // Fade in quote with delay
    Animated.timing(loaderQuoteOpacity, {
      toValue: 1,
      duration: 1300,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // After 1.5 seconds, fade out loader
    const fadeTimer = setTimeout(() => {
      if (!mounted) return;
      Animated.timing(loaderOverlayOpacity, {
        toValue: 0,
        duration: 1600, // Slow fade out
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!mounted || !finished) return;
        setShowDay2Loader(false);
        loaderQuoteOpacity.setValue(0);
        loaderOverlayOpacity.setValue(1);
      });
    }, 1500);
    timers.push(fadeTimer);

    return () => {
      mounted = false;
      timers.forEach(t => clearTimeout(t));
      // When component unmounts, reset loader state immediately
      setShowDay2Loader(false);
      loaderQuoteOpacity.setValue(0);
      loaderOverlayOpacity.setValue(1);
    };
  }, [isFocused, currentDay]);

  // Day 1: White blocker until intro modal is dismissed
  // No loader animations — just block the screen with white background

  const todaysQuote = dailyQuote; // may be null on initial mount
  const adherence = getAdherence ? getAdherence() : 0;
  const adherencePct = Math.round(adherence * 100);
  let adherenceMsg = 'Tiny steps > zero.';
  let adherenceColor = '#10B981';
  if (adherence >= 0.8) { adherenceMsg = 'High consistency — consider 1 harder task.'; adherenceColor = '#10B981'; }
  else if (adherence >= 0.5) { adherenceMsg = 'Solid base — keep locking daily wins.'; adherenceColor = '#F59E0B'; }
  else { adherenceMsg = 'No worries — one small win today.'; adherenceColor = '#EF4444'; }

  const isWeekOne = selectedDay <= 7;
  // Inline, non-blocking onboarding flags set by the tour controller
  const [guideNeedMarkOne, setGuideNeedMarkOne] = useState(false);
  const [guideShowExplore, setGuideShowExplore] = useState(false);

  const infoTaskTitle = (infoTask && infoTask.task && infoTask.task.task) ? infoTask.task.task : '';
  const isPomodoroTask = infoTaskTitle.toLowerCase().includes('pomodoro');

  // Read guide flags for inline, non-blocking onboarding
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const need = await AsyncStorage.getItem('guideNeedMarkOne');
        const show = await AsyncStorage.getItem('guideShowExplore');
        if (!mounted) return;
        setGuideNeedMarkOne(need === 'true');
        setGuideShowExplore(show === 'true');
      } catch {}
    })();
    return () => { mounted = false; };
  }, [isWeekOne]);

  // When user marks a task, clear the need flag and show 'Explore' card
  useEffect(() => {
    try {
      const compMap = todayCompletions[currentDay] || {};
      const anyMarked = Object.values(compMap).some(Boolean);
      if (anyMarked && guideNeedMarkOne) {
        setGuideNeedMarkOne(false);
        setGuideShowExplore(true);
        (async () => { try { await AsyncStorage.setItem('guideNeedMarkOne', 'false'); await AsyncStorage.setItem('guideShowExplore', 'true'); } catch {} })();
      }
    } catch {}
  }, [JSON.stringify(todayCompletions[currentDay]), guideNeedMarkOne]);

  // Helper: derive tasks list for a given day for completion checks
  const getTasksForDay = (d) => {
    const saved = todayPicks[d] || [];
    if (d <= 7) {
      const anchors = (todayPicks[1] && todayPicks[1].length ? todayPicks[1] : (week1Anchors || []));
      const source = saved.length ? saved : anchors;
      return Array.isArray(source) ? source : [];
    }
    if (saved.length) return saved;
    const gen = getGeneratedTasks(d) || [];
    return gen.map(t => t.task);
  };

  function isDayFullyComplete(d) {
    const tasks = getTasksForDay(d);
    if (!tasks || tasks.length === 0) return false;
    const comps = todayCompletions[d] || {};
    const done = tasks.filter(t => comps[t]).length;
    return done >= tasks.length;
  }

  // Now that isDayFullyComplete is defined, compute the week-end completion flag
  const isCurrentDayWeekEndComplete = useMemo(() => {
    return currentDay % 7 === 0 && isDayFullyComplete(currentDay);
  }, [currentDay, JSON.stringify(todayCompletions), JSON.stringify(todayPicks)]);

  // Global week-completion watcher: triggers fireworks when a week flips to complete
  useEffect(() => {
    const weekEnds = [7, 14, 21, 28];
    const completedNow = new Set(weekEnds.filter(isDayFullyComplete).map(d => d / 7));
    const prev = prevCompletedWeeksRef.current;
    let newlyCompletedWeek = null;
    for (const w of completedNow) {
      if (!prev.has(w)) {
        newlyCompletedWeek = w;
        break;
      }
    }
    prevCompletedWeeksRef.current = completedNow;
    if (newlyCompletedWeek) {
      setFireworksKey(Date.now());
      setShowFireworks(true);
      // Persist the completed week so fireworks don't re-trigger on app reopen
      markWeekFireworksFired(newlyCompletedWeek);
      // After a week completes, if the next day's tasks increase, inform user with threshold hint
      try {
        const weekEndDay = newlyCompletedWeek * 7;
        const nextDay = Math.min(30, weekEndDay + 1);
        const prevTasks = getTasksForDay(weekEndDay);
        const nextTasks = getTasksForDay(nextDay);
        if (Array.isArray(prevTasks) && Array.isArray(nextTasks) && nextTasks.length > prevTasks.length) {
          const assignedCount = nextTasks.length > 0 ? nextTasks.length : (nextDay <= 7 ? 5 : 6);
          const threshold = getAdherence ? (getAdherence() >= 0.8 ? 0.7 : nextDay <= 14 ? 0.6 : (nextDay <= 21 ? 0.65 : 0.7)) : 0.6;
          const needed = Math.max(1, Math.ceil(threshold * assignedCount));
          Alert.alert('Level-up 🎯', `You're doing great — tasks increased to build momentum. Aim for ${needed}/${assignedCount} to keep your streak moving.`);
        }
      } catch {}
    }
  }, [JSON.stringify(todayCompletions), JSON.stringify(todayPicks)]);

  // Persist generated picks for post-Week 1 days with robust recency avoidance and adherence-based scaling
  useEffect(() => {
    try {
      if (selectedDay <= 7) return;
      const saved = todayPicks[selectedDay];
      if (Array.isArray(saved) && saved.length > 0) return;
      const adherence = getAdherence ? getAdherence() : 0;
      const allowHigh = adherence >= 0.8;
      const baseGenerated = getGeneratedTasks(selectedDay) || [];
      const recencySetCanonical = new Set([...(todayPicks[selectedDay - 1] || []), ...(todayPicks[selectedDay - 2] || [])].map(getCanonicalTask));
      let filtered = baseGenerated.filter(t => !recencySetCanonical.has(getCanonicalTask(t.task)));
      // Use dynamic task count based on adherence (6 + increment)
      const dynamicCount = getDynamicTaskCount(selectedDay);
      const MIN_COUNT = dynamicCount;
      const MAX_COUNT = 10;
      const titles = filtered.map(t => t.task);
      const titlesCanonical = new Set(titles.map(getCanonicalTask));
      if (titles.length < MIN_COUNT) {
        // Fill from pooled candidates excluding recency and already chosen, with day-seeded ordering
        const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
        const seed = String(selectedDay);
        const poolCandidates = TASK_POOLS
          .map(title => ({ title, canonical: getCanonicalTask(title), meta: TASK_METADATA[title] || { friction: 'med', domain: 'focus' } }))
          .filter(c => !recencySetCanonical.has(c.canonical) && !titlesCanonical.has(c.canonical) && (allowHigh || c.meta.friction !== 'high'))
          .sort((a,b) => (hashStr(a.title + '|' + seed) % 100000) - (hashStr(b.title + '|' + seed) % 100000));
        for (const c of poolCandidates) {
          if (titles.length >= MIN_COUNT) break;
          titles.push(c.title);
          titlesCanonical.add(c.canonical);
        }
      }
      // Cap to MAX_COUNT
      const finalTitles = titles.slice(0, MAX_COUNT);
      if (finalTitles.length > 0) {
        setTodayPicksForDay(selectedDay, finalTitles);
      }
    } catch {}
  }, [selectedDay, JSON.stringify(todayPicks[selectedDay]), getAdherence, getDynamicTaskCount]);

  // Legacy week1 modal removed; onboarding handled in Dashboard.

  // Simplified: rely on saved picks for Week 1; auto-generation only after Week 1 when no picks exist.
  // Brief hydration overlay for Week 1 after anchors are set
  useEffect(() => {
    if (!enableEnhancedFeatures) return;
    if (!week1SetupDone) return;
    if (!isWeekOne) return;
    setGateLoading(true);
    const t = setTimeout(() => {
      setGateLoading(false);
      setCuratedFlash(true);
      setTimeout(() => setCuratedFlash(false), 600);
    }, 900);
    return () => clearTimeout(t);
  }, [enableEnhancedFeatures, week1SetupDone, isWeekOne]);

  const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  // Compute whether selectedDay is loading Week 1 tasks post-setup
  const isSelectedDayLoading = useMemo(() => {
    const isLocked = selectedDay > currentDay;
    if (isLocked) return false;
    if (selectedDay <= 7) {
      const afterSetup = !!week1SetupDone;
      const savedPicksForDay = todayPicks[selectedDay] || [];
      const anchors = (todayPicks[1] && todayPicks[1].length ? todayPicks[1] : (week1Anchors || []));
      const source = savedPicksForDay.length ? savedPicksForDay : anchors;
      return afterSetup && (!Array.isArray(source) || source.length === 0);
    }
    return false;
  }, [selectedDay, currentDay, week1SetupDone, JSON.stringify(todayPicks), JSON.stringify(week1Anchors)]);

  // Loader gate: ensure calm minimum display and success flash for Week 1 hydration
  useEffect(() => {
    if (isSelectedDayLoading && !gateLoading) {
      setGateLoading(true);
    }
    if (!isSelectedDayLoading && gateLoading) {
      setCuratedFlash(true);
      const t1 = setTimeout(() => { setCuratedFlash(false); setGateLoading(false); }, 600);
      return () => clearTimeout(t1);
    }
  }, [isSelectedDayLoading]);
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: ANDROID_TOP, backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ===== DAY 1: INTRO MODAL WITH BLOCKER ===== */}
      {/* WHITE BLOCKER: Appears immediately to block content */}
      {currentDay === 1 && (introCheckPending || showIntro) && (
        <View style={[styles.day1Blocker, { backgroundColor: colors.background }]} />
      )}
      
      {/* MODAL: Fades in slowly on top of blocker (native FirstVisitOverlay) */}
      <FirstVisitOverlay
        visible={showIntro}
        title="Daily Program"
        text="Your curated tasks live here. Mark a tiny win to build momentum."
        animation="fireworks"
        onClose={async () => { setShowIntro(false); try { await AsyncStorage.setItem('seen_intro_program','true'); } catch {} }}
      />
      
      {/* ===== DAY 2+: LOADER OVERLAY ===== */}
      {showDay2Loader && (
        <Animated.View style={[styles.fullscreenLoader, { opacity: loaderOverlayOpacity, backgroundColor: isDarkMode ? 'rgba(17,24,39,0.96)' : 'rgba(245,247,250,0.96)' }]}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loaderTitle, { color: colors.text }]}>Curating your today's tasks</Text>
          {todaysQuote ? (
            <Animated.Text style={[styles.loaderQuote, { opacity: loaderQuoteOpacity, color: colors.textSecondary }]}>
              "{todaysQuote.text}" — {todaysQuote.author}
            </Animated.Text>
          ) : null}
        </Animated.View>
      )}
      
      {showFireworks && (
        <FireworksOverlay key={fireworksKey} onComplete={() => setShowFireworks(false)} />
      )}
      
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <Text style={[styles.title, { color: colors.text }]}>Daily Program</Text>
            <LawChip law={getLawForRoute(route?.name || 'Program')} />
          </View>
          {(() => {
            const weekNumber = Math.ceil(selectedDay / 7);
            const weekEndDay = weekNumber * 7;
            const isWeekComplete = isDayFullyComplete(weekEndDay);
            const viewLabel = selectedDay === currentDay
              ? 'Today'
              : (selectedDay === weekEndDay && isWeekComplete)
                ? `Week ${weekNumber} Summary`
                : `Day ${selectedDay}`;
            return (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Science-backed dopamine reset journey • Viewing: {viewLabel}</Text>
            );
          })()}
        </View>

        {/* Inline onboarding: prompt to mark one (unskippable but non-blocking) */}
        {guideNeedMarkOne && (
          <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', borderColor: isDarkMode ? '#334155' : '#C7D2FE', borderWidth:1, marginHorizontal:20, marginBottom:12, borderRadius:12, padding:12 }}>
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <Ionicons name="hand-right-outline" size={18} color="#4F46E5" style={{ marginRight:6 }} />
              <Text style={{ fontWeight:'700', color: colors.text }}>Mark one task to proceed</Text>
            </View>
            <Text style={{ color: colors.textSecondary, marginTop:6 }}>Tap "Mark" on any task you feel ready to do today. We\'ll keep it tiny.</Text>
          </View>
        )}

        {/* Threshold Increase Banner: Show on Days 8, 15, 22 */}
        {(() => {
          const thresholdDays = [8, 15, 22];
          if (!thresholdDays.includes(currentDay)) return null;
          const weekNumber = Math.ceil(currentDay / 7);
          const messages = {
            2: { title: "📈 Threshold Increased to 60%", desc: "You got stronger — the challenge leveled up. Aim for 60% to advance your streak." },
            3: { title: "📈 Threshold Increased to 65%", desc: "Great progress — push to 65% to maintain momentum. You're building a strong habit." },
            4: { title: "📈 Threshold Increased to 70%", desc: "Elite consistency — maintain 70% to stay in top form. You're a pro now!" },
          };
          const msg = messages[weekNumber] || { title: "📈 Threshold Increased", desc: "Challenge yourself with a higher bar this week." };
          return (
            <View style={{ backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', borderColor: isDarkMode ? '#78350F' : '#FCD34D', borderWidth:1, marginHorizontal:20, marginBottom:12, borderRadius:12, padding:12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:6 }}>
                <Ionicons name="trending-up" size={18} color={isDarkMode ? '#FCD34D' : '#92400E'} style={{ marginRight:6 }} />
                <Text style={{ fontWeight:'700', color: isDarkMode ? '#FCD34D' : '#92400E' }}>{msg.title}</Text>
              </View>
              <Text style={{ color: isDarkMode ? '#FDE68A' : '#78350F', fontSize:13 }}>{msg.desc}</Text>
            </View>
          );
        })()}

        {/* Daily Quote Banner (persisted) */}
        {todaysQuote && (
          <View style={[styles.quoteCard, { backgroundColor: isDarkMode ? '#422006' : '#FFF9E6', borderLeftColor: isDarkMode ? '#F59E0B' : '#FBBF24' }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <Text style={[styles.quoteTag, { color: isDarkMode ? '#FCD34D' : '#A16207' }]}>{todaysQuote.tag.toUpperCase()}</Text>
              {dailyQuoteSource && (
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <Ionicons name={dailyQuoteSource === 'cloud' ? 'cloud-done-outline' : dailyQuoteSource === 'local' ? 'download-outline' : 'sparkles-outline'} size={16} color={isDarkMode ? '#FCD34D' : '#A16207'} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize:12, color: isDarkMode ? '#FCD34D' : '#A16207', fontWeight:'600' }}>
                    {dailyQuoteSource === 'cloud' ? 'Synced' : dailyQuoteSource === 'local' ? 'Cached' : 'New'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.quoteText, { color: colors.text }]}>"{todaysQuote.text}"</Text>
            <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>— {todaysQuote.author}</Text>
            <Text style={[styles.quoteExplanation, { color: colors.textSecondary }]}>Micro reminder: let this theme shape one tiny win today.</Text>
          </View>
        )}

        {/* Adherence Banner (show after user has completed tasks on >=3 distinct days) */}
        {(() => {
          const completedDays = Object.entries(todayCompletions)
            .filter(([day, map]) => Object.values(map).some(Boolean))
            .map(([day]) => parseInt(day, 10));
          const distinctCompletedCount = new Set(completedDays).size;
          return distinctCompletedCount >= 3;
        })() && (
          <View style={[styles.adherenceBanner, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
            <View style={styles.adherenceBannerHeader}>
              <Ionicons name="pulse" size={18} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={[styles.adherenceBannerTitle, { color: colors.text }]}>Consistency (rolling)</Text>
              <Text style={styles.adherenceBannerPct}>{adherencePct}%</Text>
            </View>
            <View style={[styles.adherenceBarOuter, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.adherenceBarInner,{ width: `${Math.min(100, adherencePct)}%`, backgroundColor: adherenceColor }]} />
            </View>
            <Text style={[styles.adherenceBannerMsg, { color: colors.textSecondary }]}>{adherenceMsg}</Text>
          </View>
        )}

        {/* Trigger-based suggestions (last 7 days) */}
        {(() => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          const recentUrges = Object.values(urges || {}).filter(u => new Date(u.timestamp) >= cutoff);
          const freq = {};
          recentUrges.forEach(u => {
            const t = (u.trigger || '').trim();
            if (!t) return;
            freq[t] = (freq[t] || 0) + 1;
          });
          const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
          if (top.length === 0) return null;
          const tips = {
            Stress: 'Box breathing 4-4-4-4; short walk; hydrate',
            Boredom: '2-minute task; change environment; quick stretch',
            Social: 'Text a supporter; step away briefly; reframe',
            Loneliness: 'Reach out; community post; guided meditation',
            Fatigue: 'Power nap 10–20min; light snack; fresh air',
            Conflict: 'Pause; write 3 lines; plan response later',
            Environment: 'Move rooms; tidy small area; remove cues',
            Anxiety: '5-4-3-2-1 grounding; reassure; list one action',
            Other: 'Name the trigger; pick one small counter-action',
          };
          return (
            <View style={{ backgroundColor: isDarkMode ? '#422006' : '#FFF7E6', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 12, borderLeftWidth: 4, borderLeftColor: isDarkMode ? '#F59E0B' : '#FBBF24' }}>
              <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.text }}>Suggestions for your recent triggers</Text>
              {top.map(t => (
                <View key={t} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{t}</Text>
                  <Text style={{ color: colors.textSecondary }}>{tips[t] || tips.Other}</Text>
                </View>
              ))}
              <Text style={{ color: colors.textTertiary, marginTop: 4, fontSize: 12 }}>Based on last 7 days of logs</Text>
            </View>
          );
        })()}

        {/* Legacy week1 modal removed; onboarding handled via Dashboard only */}

        {/* Day Switcher */}
        <View style={{ flexDirection:'row', gap:8, paddingHorizontal:20, marginBottom:12 }}>
          {!isCurrentDayWeekEndComplete && (
            <TouchableOpacity onPress={() => setSelectedDay(currentDay)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor: selectedDay===currentDay?'#10B981':colors.border, backgroundColor: selectedDay===currentDay?'#ECFDF5':colors.surfacePrimary }}>
              <Text style={{ fontSize:12, fontWeight:'600', color: selectedDay===currentDay?'#065F46':colors.text }}>Today</Text>
            </TouchableOpacity>
          )}
          {isCurrentDayWeekEndComplete && (
            <TouchableOpacity onPress={() => setSelectedDay(currentDay)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor: selectedDay===currentDay?'#10B981':colors.border, backgroundColor: selectedDay===currentDay?'#ECFDF5':colors.surfacePrimary }}>
              <Text style={{ fontSize:12, fontWeight:'600', color: selectedDay===currentDay?'#065F46':colors.text }}>{`Week ${currentDay/7}`}</Text>
            </TouchableOpacity>
          )}
          {(() => {
            const weekEnds = [7,14,21,28];
            const completedWeeks = weekEnds.filter(d => d <= currentDay && isDayFullyComplete(d));
            return completedWeeks
              .filter(d => !(isCurrentDayWeekEndComplete && d === currentDay))
              .map(weekEnd => {
                const weekNumber = Math.ceil(weekEnd / 7);
                const isActive = selectedDay === weekEnd;
                return (
                  <TouchableOpacity key={weekEnd} onPress={() => setSelectedDay(weekEnd)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor: isActive?'#10B981':colors.border, backgroundColor: isActive?'#ECFDF5':colors.surfacePrimary }}>
                    <Text style={{ fontSize:12, fontWeight:'600', color: isActive?'#065F46':colors.text }}>Week {weekNumber}</Text>
                  </TouchableOpacity>
                );
              });
          })()}
        </View>

        {/* Program — show selected day */}
        {(() => {
          const dayData = PROGRAM_DAY_TITLES.find(d => d.day === selectedDay);
          if (!dayData) {
            return (
              <View style={[styles.selectorCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
                <View style={styles.selectorHeader}>
                  <Text style={[styles.selectorTitle, { color: colors.text }]}>Program not initialized</Text>
                  <Text style={[styles.selectorSub, { color: colors.textSecondary }]}>Set start date to today to begin.</Text>
                </View>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={async () => {
                  const iso = new Date().toISOString();
                  await setStartDate(iso);
                }}>
                  <Text style={styles.modalConfirmText}>Start Program</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return [dayData].map((dayData) => {
          let tasksToShow = [];
          const savedPicksForDay = todayPicks[dayData.day] || [];
          if (dayData.day <= 7) {
            const anchors = (todayPicks[1] && todayPicks[1].length ? todayPicks[1] : (week1Anchors || []));
            const source = savedPicksForDay.length ? savedPicksForDay : anchors;
            tasksToShow = source.map(title => {
              const meta = TASK_METADATA[title] || {};
              return { task: title, category: meta.category || 'anchor', points: meta.points || 5 };
            });
          } else {
            // Post Week 1: Use saved picks if they exist; else generate dynamic set with anti-repetition.
            if (savedPicksForDay.length > 0) {
              tasksToShow = savedPicksForDay.map(title => {
                const meta = TASK_METADATA[title] || {};
                return { task: title, category: meta.category || 'habit', points: meta.points || 5 };
              });
            } else {
              // Rely on persisted picks set by effect; if still absent, derive for display (non-persisting)
              const adherenceNow = getAdherence ? getAdherence() : 0;
              const allowHighNow = adherenceNow >= 0.8;
              const baseGen = getGeneratedTasks(dayData.day) || [];
              const recencySetCanonical = new Set([...(todayPicks[dayData.day - 1] || []), ...(todayPicks[dayData.day - 2] || [])].map(getCanonicalTask));
              let candidates = baseGen.filter(t => !recencySetCanonical.has(getCanonicalTask(t.task)));
              if (candidates.length < 6) {
                const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
                const seed = String(dayData.day);
                const poolCandidates = TASK_POOLS
                  .map(title => ({ title, canonical: getCanonicalTask(title), meta: TASK_METADATA[title] || { friction: 'med', domain: 'focus' } }))
                  .filter(c => !recencySetCanonical.has(c.canonical) && !candidates.some(x => getCanonicalTask(x.task) === c.canonical) && (allowHighNow || c.meta.friction !== 'high'))
                  .sort((a,b) => (hashStr(a.title + '|' + seed) % 100000) - (hashStr(b.title + '|' + seed) % 100000))
                  .map(c => ({ task: c.title, points: (c.meta.points || (c.meta.friction === 'low' ? 5 : c.meta.friction === 'med' ? 7 : 10)), category: c.meta.domain ? (c.meta.domain === 'morning' ? '🌅 Morning' : c.meta.domain === 'mind' ? '🧠 Mind' : c.meta.domain === 'physical' ? '💪 Physical' : c.meta.domain === 'focus' ? '🎯 Focus' : c.meta.domain === 'detox' ? '🎧 Detox' : c.meta.domain === 'social' ? '🌿 Social' : c.meta.domain === 'creative' ? '🎨 Creative' : '🎁 Identity') : '🎯 Focus' }));
                const need = Math.max(0, 6 - candidates.length);
                candidates = [...candidates, ...poolCandidates.slice(0, need)];
              }
              const display = candidates.slice(0, 10);
              tasksToShow = display.map(t => {
                const meta = TASK_METADATA[t.task] || {};
                return { task: t.task, category: meta.category || t.category || 'habit', points: meta.points || t.points || 5 };
              });
            }
          }
          const totalPoints = tasksToShow.reduce((sum, task) => sum + (task.points || 0), 0);
          // totalPoints already computed above when building tasksToShow (avoid duplicate declaration)
          const isWeekEnd = dayData.day % 7 === 0;
          const isCurrentDay = dayData.day === currentDay;
          const isLocked = dayData.day > currentDay;
          const isCompleted = dayData.day < currentDay;
          // V1: Only allow marking current day (no backfill)
          let canMark = (dayData.day === currentDay);

          const isLoadingTasks = (() => {
            if (isLocked) return false;
            if (dayData.day <= 7) {
              // Show loader anytime after setup when tasksToShow is still empty (hydration/rotation/persistence in flight)
              const afterSetup = !!week1SetupDone;
              return afterSetup && tasksToShow.length === 0;
            }
            return false;
          })();

          const adherenceTier = adherencePct >= 80 ? 'high' : (adherencePct >= 60 ? 'mid' : 'low');
          const overlayInfo = (() => {
            const comps = todayCompletions[dayData.day] || {};
            const doneCount = tasksToShow.filter(t => comps[t.task]).length;
            const allDone = tasksToShow.length > 0 && doneCount >= tasksToShow.length;
            if (!allDone || isLocked) return null;
            if (isWeekEnd) {
              const weekNumber = Math.ceil(dayData.day / 7);
              const copy = adherenceTier === 'high' ? 'Elite consistency — take a proud pause.' : adherenceTier === 'mid' ? 'Steady week — keep the chain alive.' : 'Nice save — keep the comeback going.';
              return { tone: 'week', text: `Week ${weekNumber} complete. ${copy}` };
            }
            const copy = adherenceTier === 'high' ? 'High consistency — consider one stretch task.' : adherenceTier === 'mid' ? 'Steady climb — keep momentum tomorrow.' : 'Win captured — start tiny again tomorrow.';
            const label = isCurrentDay ? `Completed • ${dayData.title}` : `Completed • Day ${dayData.day}`;
            return { tone: 'day', text: `${label}. ${copy}` };
          })();

          // Loader gate moved to top-level to comply with Hooks rules
          
          return (
            <View
              key={dayData.day}
              style={[
                styles.dayCard,
                { backgroundColor: colors.surfacePrimary, borderColor: colors.border },
                isWeekEnd && { backgroundColor: isDarkMode ? colors.surfaceSecondary : colors.moodBgOkay, borderColor: isDarkMode ? '#60A5FA' : colors.accent, borderWidth: 2 },
                isCurrentDay && { borderWidth: 3, borderColor: isDarkMode ? '#10B981' : '#10B981' },
                isLocked && { opacity: 0.5, backgroundColor: isDarkMode ? colors.surfaceSecondary : '#F9FAFB' }
              ]}
            >
              <View style={[styles.dayHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.dayHeaderLeft}>
                  {isLocked && <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />}
                  {isCompleted && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />}
                  {isCurrentDay && <Ionicons name="calendar-outline" size={20} color="#4A90E2" style={{ marginRight: 8 }} />}
                  <View>
                    <Text style={[styles.dayNumber, isLocked && styles.dayNumberLocked]}>
                      Day {dayData.day}
                    </Text>
                    <Text style={[styles.dayTitle, { color: isLocked ? '#9CA3AF' : colors.text }]}>
                      {(dayData.day === 7 && !week1Completed) ? 'Keep Anchors Strong' : dayData.title}
                    </Text>
                  </View>
                </View>
                <View style={[styles.pointsBadge, isLocked && styles.pointsBadgeLocked]}>
                  <Text style={styles.pointsText}>{totalPoints} CP</Text>
                </View>
              </View>

          {overlayInfo && (
            <View style={[styles.overlayBanner, { backgroundColor: overlayInfo.tone === 'week' ? (isDarkMode ? '#422006' : '#FEF3C7') : (isDarkMode ? '#064E3B' : '#ECFDF3'), borderColor: overlayInfo.tone === 'week' ? (isDarkMode ? '#78350F' : '#FCD34D') : (isDarkMode ? '#10B981' : '#A7F3D0'), borderWidth: 1 }]}>
              <Ionicons name={overlayInfo.tone === 'week' ? 'trophy-outline' : 'checkmark-done-outline'} size={16} color={overlayInfo.tone === 'week' ? (isDarkMode ? '#FCD34D' : '#92400E') : (isDarkMode ? '#A7F3D0' : '#065F46')} style={{ marginRight: 6 }} />
              <Text style={[styles.overlayBannerText, { color: colors.text }]}>{overlayInfo.text}</Text>
            </View>
          )}

          {/* Check if selectedDay is in last 2 days of a completed week — if so, show weekly summary instead of task list */}
          {(() => {
            const weekNumber = Math.ceil(dayData.day / 7);
            const weekEndDay = weekNumber * 7;
            const isWeekComplete = isDayFullyComplete(weekEndDay);
            const isWeekViewSelected = selectedDay === weekEndDay;
            // Show summary when viewing a completed week (via tab) or within last 2 days
            const isInLastTwoDaysOfWeek = dayData.day >= weekEndDay - 1 && dayData.day <= weekEndDay;
            if ((isWeekViewSelected && isWeekComplete && !isLocked) || (isInLastTwoDaysOfWeek && isWeekComplete && !isLocked)) {
              const startDay = weekNumber * 7 - 6;
              const endDay = weekNumber * 7;
              let totalDone = 0;
              let totalAvailable = 0;
              const categoryFreq = {};
              // Compute urges logged in this week by mapping timestamps to program day
              const msPerDay = 86400000;
              const sd = startDate ? new Date(startDate) : new Date();
              const startMid = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
              let urgesLogged = 0;
              (urges || []).forEach(u => {
                const tsMid = new Date(new Date(u.timestamp).getFullYear(), new Date(u.timestamp).getMonth(), new Date(u.timestamp).getDate()).getTime();
                const dayNumber = Math.floor((tsMid - startMid) / msPerDay) + 1;
                if (dayNumber >= startDay && dayNumber <= endDay) urgesLogged += 1;
              });
              for (let d = startDay; d <= endDay; d++) {
                const tasks = getTasksForDay(d);
                totalAvailable += tasks.length;
                const completions = todayCompletions[d] || {};
                tasks.forEach(title => {
                  if (completions[title]) totalDone += 1;
                  const meta = TASK_METADATA[title] || {};
                  const cat = meta.category || meta.domain || 'other';
                  categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
                });
              }
              const adherenceRate = totalAvailable > 0 ? Math.round((totalDone / totalAvailable) * 100) : 0;
              const topCategory = Object.entries(categoryFreq).sort((a,b) => b[1]-a[1])[0]?.[0];
              
              return (
                <View style={{ backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: isDarkMode ? '#10B981' : '#A7F3D0', borderWidth: 1, marginTop: 16, borderRadius: 12, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="trophy" size={20} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#A7F3D0' : '#065F46' }}>Week {weekNumber} Summary</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#D1FAE5' : '#047857', marginBottom: 8 }}>📊 <Text style={{ fontWeight: '600' }}>Adherence: {adherenceRate}% • Tasks: {totalDone}/{totalAvailable} • Urges: {urgesLogged}</Text></Text>
                  {topCategory && (
                    <Text style={{ fontSize: 13, color: isDarkMode ? '#D1FAE5' : '#047857', marginBottom: 8 }}>🎯 Most frequent: <Text style={{ fontWeight: '600' }}>{topCategory}</Text></Text>
                  )}
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#D1FAE5' : '#047857' }}>Great momentum — keep your anchors strong next week.</Text>
                </View>
              );
            }
            
            // Otherwise, show normal task list
            return null;
          })()}

          {/* Fallback when no tasks */}
          {!isLocked && enableEnhancedFeatures && (isLoadingTasks || gateLoading) && (
            <View style={{ paddingVertical: 12, flexDirection:'row', alignItems:'center' }}>
              <ActivityIndicator size="small" color="#4A90E2" style={{ marginRight:8 }} />
              <Text style={{ fontSize:13, color: colors.textSecondary }}>{curatedFlash ? 'Curated.' : 'Curating your program…'}</Text>
            </View>
          )}

          {!isLocked && !isLoadingTasks && tasksToShow.length === 0 && (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize:13, color: colors.textSecondary, fontStyle:'italic' }}>No tasks yet. Complete the onboarding flow to get your personalized tasks.</Text>
            </View>
          )}

          {(() => {
            const weekNumber = Math.ceil(dayData.day / 7);
            const weekEndDay = weekNumber * 7;
            const isInLastTwoDaysOfWeek = dayData.day >= weekEndDay - 1 && dayData.day <= weekEndDay;
            const isWeekComplete = isDayFullyComplete(weekEndDay);
            
            // Hide task list if showing weekly summary
            if (isInLastTwoDaysOfWeek && isWeekComplete && !isLocked) return null;

            // Check if user completed new onboarding (mood-based system)
            const hasNewOnboarding = userProfile?.onboardingCompleted && userProfile?.coreHabits?.length > 0;
            let fixedTasks = [];
            let dynamicTasks = [];

            if (hasNewOnboarding && dayData.day === currentDay) {
              // Separate into fixed and dynamic
              const coreHabits = userProfile.coreHabits || [];
              fixedTasks = tasksToShow.filter(t => coreHabits.includes(t.task));
              dynamicTasks = tasksToShow.filter(t => !coreHabits.includes(t.task));
            }

            return (
              !isLocked && tasksToShow.length > 0 && (
                <>
                  {/* Info banner for mood-based system */}
                  {hasNewOnboarding && dayData.day === currentDay && (
                    <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#DBEAFE', borderWidth: 1, marginTop: 12, marginBottom: 12, borderRadius: 12, padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="layers-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                        <Text style={{ fontWeight: '700', fontSize: 14, color: colors.text }}>Your Adaptive Program</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        <Text style={{ fontWeight: '600' }}>{fixedTasks.length} Core Habits</Text> (build consistency) + <Text style={{ fontWeight: '600' }}>{dynamicTasks.length} Adaptive Tasks</Text> (match your mood)
                      </Text>
                    </View>
                  )}

                  {/* Fixed Tasks Section */}
                  {hasNewOnboarding && dayData.day === currentDay && fixedTasks.length > 0 && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                        <Ionicons name="shield-checkmark" size={18} color="#10B981" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Core Habits (Always)</Text>
                      </View>
                      {fixedTasks.map((task, taskIndex) => {
                        const explanation = getTaskExplanation(task.task) || getTaskBenefit(task.task);
                        const isDone = (todayCompletions[dayData.day] || {})[task.task] || false;
                        const category = getTaskCategory(task.task);
                        return (
                          <View key={`fixed-${taskIndex}`} style={[styles.taskRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.taskInfo}>
                              <Text style={[styles.taskText, { color: isDone ? colors.textTertiary : colors.text }]}>{task.task}</Text>
                              <Text style={[styles.taskExplanation, { color: colors.textSecondary }]}>💡 {explanation || 'Helps build routine and reduce friction.'}</Text>
                              <View style={{ flexDirection:'row', alignItems:'center', marginTop: 6 }}>
                                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600', marginRight: 8 }}>{category}</Text>
                                <Text style={styles.taskPoints}>{(task.points || 0)} pts</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                if (!canMark) return;
                                handleTaskPress(dayData.day, task.task, task.points || 0);
                              }}
                              style={[
                                styles.checkPill,
                                { borderColor: isDone ? '#10B981' : colors.border, backgroundColor: isDone ? '#10B981' : (isDarkMode ? '#1F2937' : '#FFFFFF') },
                                isDone && { opacity: 0.9 },
                                !canMark && styles.checkPillLocked
                              ]}
                            >
                              {isDone ? (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              ) : (
                                <View style={{ flexDirection:'row', alignItems:'center' }}>
                                  {!canMark && (
                                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                                  )}
                                  <Text style={[styles.checkPillText, { color: !canMark ? '#9CA3AF' : colors.textSecondary }]}>Mark</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </>
                  )}

                  {/* Dynamic Tasks Section */}
                  {hasNewOnboarding && dayData.day === currentDay && dynamicTasks.length > 0 && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                        <Ionicons name="color-wand" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Today's Adaptive Tasks</Text>
                      </View>
                      {(() => {
                        const isAiPicked = userProfile?.aiPickDate === new Date().toDateString();
                        const moodOpt = getMoodOption(userProfile?.lastMood || currentMood);
                        const moodLabel = moodOpt ? `${moodOpt.emoji} ${moodOpt.label}` : null;
                        return dynamicTasks.map((task, taskIndex) => {
                          const explanation = getTaskExplanation(task.task) || getTaskBenefit(task.task);
                          const isDone = (todayCompletions[dayData.day] || {})[task.task] || false;
                          const category = getTaskCategory(task.task);
                          return (
                            <View
                              key={`dynamic-${taskIndex}`}
                              style={[
                                styles.taskRow,
                                {
                                  borderBottomColor: colors.border,
                                  borderLeftWidth: 3,
                                  borderLeftColor: isDone ? colors.border : '#F59E0B',
                                  paddingLeft: 10,
                                }
                              ]}
                            >
                              <View style={styles.taskInfo}>
                                <Text style={[styles.taskText, { color: isDone ? colors.textTertiary : colors.text }]}>{task.task}</Text>
                                {/* Mood chip + AI badge row */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 6, maxWidth: '100%', minWidth: 0 }}>
                                  {moodLabel && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2D2000' : '#FEF3C7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                                      <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '600' }}>✨ {moodLabel}</Text>
                                    </View>
                                  )}
                                  {isAiPicked && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1A1040' : '#EDE9FE', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                                      <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '600' }} numberOfLines={1}>🤖 AI Pick</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.taskExplanation, { color: colors.textSecondary }]}>💡 {explanation || 'Helps build routine and reduce friction.'}</Text>
                                <View style={{ flexDirection:'row', alignItems:'center', marginTop: 6 }}>
                                  <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600', marginRight: 8 }}>{category}</Text>
                                  <Text style={styles.taskPoints}>{(task.points || 0)} pts</Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  if (!canMark) return;
                                  handleTaskPress(dayData.day, task.task, task.points || 0);
                                }}
                                style={[
                                  styles.checkPill,
                                  { borderColor: isDone ? '#10B981' : colors.border, backgroundColor: isDone ? '#10B981' : (isDarkMode ? '#1F2937' : '#FFFFFF') },
                                  isDone && { opacity: 0.9 },
                                  !canMark && styles.checkPillLocked
                                ]}
                              >
                                {isDone ? (
                                  <Ionicons name="checkmark" size={16} color="#fff" />
                                ) : (
                                  <View style={{ flexDirection:'row', alignItems:'center' }}>
                                    {!canMark && (
                                      <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                                    )}
                                    <Text style={[styles.checkPillText, { color: !canMark ? '#9CA3AF' : colors.textSecondary }]}>Mark</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        });
                      })()}
                    </>
                  )}

                  {/* Fallback: Old system rendering (for users without new onboarding) */}
                  {(!hasNewOnboarding || dayData.day !== currentDay) && tasksToShow.map((task, taskIndex) => {
                  const explanation = getTaskExplanation(task.task) || getTaskBenefit(task.task);
                  const isAnchor = isWeekOne && ((todayPicks[1] || []).includes(task.task));
                  const rationale = `${isAnchor ? 'Your Week 1 anchor. ' : ''}Variety: ${task.category}. ${adherence >= 0.8 ? 'Slight level-up based on strong consistency.' : adherence >= 0.5 ? 'Steady: keep building routine.' : 'Gentle: focus on one small win.'}`;
                  const isDone = (todayCompletions[dayData.day] || {})[task.task] || false;
                  return (
                    <View key={taskIndex} style={[styles.taskRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.taskInfo}>
                        {/* Category hidden per request; show points prominently */}
                        <Text style={[styles.taskText, { color: isDone ? colors.textTertiary : colors.text }]}>{task.task}</Text>
                        <Text style={[styles.taskExplanation, { color: colors.textSecondary }]}>💡 {explanation || 'Helps build routine and reduce friction.'}</Text>
                        <View style={{ flexDirection:'row', alignItems:'center', marginTop: 6 }}>
                          <TouchableOpacity onPress={() => setInfoTask({ day: dayData.day, task })} style={{ flexDirection:'row', alignItems:'center' }}>
                            <Ionicons name="information-circle-outline" size={16} color="#2563EB" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize:12, color:'#2563EB', fontWeight:'600' }}>Why this</Text>
                          </TouchableOpacity>
                          <Text style={styles.taskPoints}>{(task.points || 0)} pts</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          if (!canMark) return;
                          handleTaskPress(dayData.day, task.task, task.points || 0);
                        }}
                        style={[
                          styles.checkPill,
                          { borderColor: isDone ? '#10B981' : colors.border, backgroundColor: isDone ? '#10B981' : (isDarkMode ? '#1F2937' : '#FFFFFF') },
                          isDone && { opacity: 0.9 },
                          !canMark && styles.checkPillLocked
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        ) : (
                          <View style={{ flexDirection:'row', alignItems:'center' }}>
                            {!canMark && (
                              <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                            )}
                            <Text style={[styles.checkPillText, { color: !canMark ? '#9CA3AF' : colors.textSecondary }]}>Mark</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
              })}
                </>
              )
            );
          })()}

              {/* Final inline onboarding card: point to Urges and Stats (non-blocking) */}
              {guideShowExplore && dayData.day === currentDay && (
                <View style={{ backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: isDarkMode ? '#10B981' : '#A7F3D0', borderWidth:1, marginTop:12, borderRadius:12, padding:12 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', marginBottom:6 }}>
                    <Ionicons name="sparkles-outline" size={18} color="#10B981" style={{ marginRight:6 }} />
                    <Text style={{ fontWeight:'700', color: isDarkMode ? '#A7F3D0' : '#065F46' }}>Nice! Explore next:</Text>
                  </View>
                  <Text style={{ color: isDarkMode ? '#D1FAE5' : '#065F46' }}>• Urge Logger: record urges with feelings and triggers to build resilience.
                  {'\n'}• Stats: see trends, adherence, and variety with a clear "Today" marker.</Text>
                  <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('UrgeLogger')} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#10B981' }}>
                      <Text style={{ color:'#fff', fontWeight:'700' }}>Open Urges</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#2563EB' }}>
                      <Text style={{ color:'#fff', fontWeight:'700' }}>Open Stats</Text>
                    </TouchableOpacity>
                    <View style={{ flex:1 }} />
                    {/* 'Finish Tour' persists completion so it won't appear again */}
                    <TouchableOpacity onPress={async () => { try { await AsyncStorage.setItem('guideShowExplore','false'); await AsyncStorage.setItem('guideSeen_v2','true'); } catch {}; setGuideShowExplore(false); }} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1, borderColor: isDarkMode ? '#10B981' : '#A7F3D0', backgroundColor: colors.surfacePrimary }}>
                      <Text style={{ color: isDarkMode ? '#A7F3D0' : '#065F46', fontWeight:'700' }}>Finish Tour</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isLocked && (
                <View style={styles.lockedMessage}>
                  <Ionicons name="time-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
                    Complete previous days to unlock
                  </Text>
                  <Text style={[styles.lockedSubtext, { color: colors.textTertiary }]}>
                    Focus on today's journey
                  </Text>
                </View>
              )}

              {/* Week completion tag: show when any week-end day (7/14/21/28) is fully done */}
              {isWeekEnd && (() => {
                const comps = todayCompletions[dayData.day] || {};
                const doneCount = Object.values(comps).filter(Boolean).length;
                const allDone = tasksToShow.length > 0 && doneCount >= tasksToShow.length;
                return allDone && !isLocked;
              })() && (() => {
                const weekNumber = Math.ceil(dayData.day / 7);
                return (
                  <View style={[styles.milestoneTag, { backgroundColor: isDarkMode ? '#422006' : '#FBBF24' }]}>
                    <Text style={[styles.milestoneText, { color: isDarkMode ? '#FCD34D' : '#1A1A1A' }]}>🎉 Week {weekNumber} Complete!</Text>
                  </View>
                );
              })()}

              {/* Text overlay under confetti: show for any week-end day when completed */}
              {(() => {
                const weekNumber = Math.ceil(dayData.day / 7);
                const weekEndDay = weekNumber * 7;
                const isInLastTwoDaysOfWeek = dayData.day >= weekEndDay - 1 && dayData.day <= weekEndDay;
                const isWeekComplete = isDayFullyComplete(weekEndDay);
                const isShowingSummary = isInLastTwoDaysOfWeek && isWeekComplete && !isLocked;
                // Only show banner if viewing tasks, not summary
                return (dayData.day === currentDay && !isShowingSummary) && (
                  <View style={[styles.currentDayBanner, { backgroundColor: isDarkMode ? '#1E40AF' : '#2563EB' }]}>
                    <Ionicons name="flash" size={16} color={isDarkMode ? '#BFDBFE' : '#fff'} />
                    <Text style={[styles.currentDayText, { color: isDarkMode ? '#BFDBFE' : '#fff' }]}>TODAY'S FOCUS</Text>
                  </View>
                );
              })()}
            </View>
          );
          });
          })()}
      </ScrollView>
      </Animated.View>

      {/* Rationale Modal — task-specific explanation + benefit */}
      <Modal visible={!!infoTask} animationType="slide" transparent onRequestClose={() => setInfoTask(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Why this task</Text>
            {infoTask && (
              <View>
                <Text style={[styles.selectorSub, { color: colors.textSecondary }]}>
                  Task: <Text style={{ fontWeight:'700', color: colors.text }}>{infoTask.task.task}</Text>
                </Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.selectorSub, { color: colors.textSecondary }]}>Why: {getTaskExplanation(infoTask.task.task) || 'Builds consistency and reduces friction'}</Text>
                  <Text style={[styles.selectorSub, { marginTop: 6, color: colors.textSecondary }]}>Benefit: {getTaskBenefit(infoTask.task.task) || 'Helps build routine and reduce friction.'}</Text>
                  <Text style={[styles.selectorSub, { marginTop: 6, color: colors.textSecondary }]}>Science: {getTaskScience(infoTask.task.task)}</Text>
                  {isPomodoroTask && (
                    <Text style={[styles.selectorSub, { marginTop: 6, color: colors.text }]}>Pomodoro = 25 minutes of focused work followed by a 5-minute break. Finish the deep-work block, take the short break, then repeat; "x2/x3" means stack rounds with breaks.</Text>
                  )}
                  <Text style={[styles.selectorSub, { marginTop: 6, fontWeight:'700', color: isDarkMode ? '#A7F3D0' : '#065F46' }]}>Points: {(infoTask.task.points || 0)} CP</Text>
                </View>
              </View>
            )}
            <TouchableOpacity onPress={() => setInfoTask(null)} style={styles.modalConfirmBtn}>
              <Text style={styles.modalConfirmText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Timer Modal */}
      <TimerModal
        visible={timerVisible}
        taskName={timerTaskName}
        durationMinutes={timerDuration}
        onComplete={handleTimerComplete}
        onSkip={handleTimerSkip}
        onClose={() => setTimerVisible(false)}
      />

      {/* Task Guide Modals (Breathwork/Meditation) */}
      <TaskGuideModal
        isVisible={showGuideModal}
        onClose={() => {
          setShowGuideModal(false);
          setCurrentGuide(null);
        }}
        taskName={currentGuide?.type}
        guideType={currentGuide?.type}
        duration={currentGuide?.duration || 5}
      />

      {/* Stretching Guide Carousel */}
      <StretchingCarousel
        isVisible={showStretchingGuide}
        onClose={() => setShowStretchingGuide(false)}
        onComplete={handleStretchingComplete}
      />

      {/* Confetti Celebration Animation (pure UI) */}
      <ConfettiAnimation isVisible={showConfetti} duration={2500} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  quoteCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
  },
  quoteTag: {
    marginTop: 4,
    fontSize: 12,
    color: '#A16207',
    fontWeight: '600',
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  quoteExplanation: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  dayNumberLocked: {
    color: '#9CA3AF',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  dayTitleLocked: {
    color: '#9CA3AF',
  },
  pointsBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadgeLocked: {
    backgroundColor: '#D1D5DB',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  taskInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskExplanation: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 12,
  },
  checkPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  checkPillDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkPillLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  checkPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  lockedMessage: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  lockedSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  milestoneTag: {
    marginTop: 12,
    backgroundColor: '#FBBF24',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  milestoneText: {
    fontSize: 16,
    fontWeight: '700',
  },
  currentDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  currentDayText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  overlayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  overlayBannerWeek: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  overlayBannerDay: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  overlayBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    flexWrap: 'wrap',
  },
  // Week 1 selector styles
  selectorCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selectorHeader: {
    marginBottom: 12,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  selectorSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 12,
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
  fullscreenLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,247,250,0.96)',
    zIndex: 999,
    elevation: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  day1Blocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 998,
    elevation: 998,
  },
  loaderTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  loaderQuote: {
    marginTop: 10,
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  adherenceBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  adherenceBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adherenceBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  adherenceBannerPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  adherenceBarOuter: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  adherenceBarInner: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  adherenceBannerMsg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});

// Wrap Program with ErrorBoundary
export default function ProgramWithErrorBoundary(props) {
  return (
    <ScreenErrorBoundary screenName="Program" navigation={props.navigation}>
      <Program {...props} />
    </ScreenErrorBoundary>
  );
}

