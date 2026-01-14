// src/components/OnboardingTour.js
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';

// Acts as a visual tour or a controller-only flow coordinator depending on props
export default function OnboardingTour({ visible, onDone, navigationRef, controllerOnly }) {
  const { week1SetupDone, getCurrentDay, todayCompletions } = useContext(AppContext);
  // Expanded tour: 7 steps for comprehensive education
  const steps = useMemo(() => ([
    { icon: 'planet-outline', title: 'Welcome', text: 'ResetDopa™ helps you rebuild focus and motivation with small, science-backed wins.' },
    { icon: 'lightning-outline', title: 'Calm Points', text: 'Earn points by completing tasks. Tasks worth 5, 7, or 10 points based on difficulty. Accumulate 100 points to unlock special badges and rewards.' },
    { icon: 'flame-outline', title: 'Streaks Matter', text: 'Complete your daily target to build a streak. Every consecutive day increases momentum. Miss a day and your streak resets—but grace days let you skip 1 per week guilt-free.' },
    { icon: 'shapes-outline', title: 'Task Domains', text: 'Tasks are grouped into categories (Morning, Mind, Physical, Focus, Detox, Social, Creative). Mix different domains for balanced progress. "Friction" shows difficulty: low (easy), med (medium), high (challenging).' },
    { icon: 'calendar-outline', title: 'Your Program', text: 'Complete the target tasks each day. Week 1 uses your 5 anchors. As you build consistency, new tasks unlock. Tap "Why This?" to learn the science behind each task.' },
    { icon: 'chatbubble-ellipses-outline', title: 'Log Urges', text: 'Log urges with your feelings and triggers. Tag the outcome (resisted/indulged). This builds resilience and reveals your patterns.' },
    { icon: 'trophy-outline', title: 'Milestones Ahead', text: 'Finish weeks to celebrate with fireworks 🎆. Unlock badges for hitting milestones. Your 30-day journey compounds: tiny daily wins → total transformation.' },
  ]), []);
  const [idx, setIdx] = useState(0);
  const last = idx === steps.length - 1;
  const step = steps[idx];
  const navigateForStep = (i) => {
    try {
      if (!navigationRef?.current) return;
      if (i === 1) navigationRef.current.navigate('Main', { screen: 'Dashboard' });
      else if (i === 2) navigationRef.current.navigate('Main', { screen: 'Dashboard' });
      else if (i === 3) navigationRef.current.navigate('Main', { screen: 'Dashboard' });
      else if (i === 4) navigationRef.current.navigate('Main', { screen: 'Program' });
      else if (i === 5) navigationRef.current.navigate('Main', { screen: 'UrgeLogger' });
      else if (i === 6) navigationRef.current.navigate('Main', { screen: 'Dashboard' }); // finish on Dashboard
    } catch {}
  };
  const next = () => {
    const nextIdx = Math.min(steps.length - 1, idx + 1);
    setIdx(nextIdx);
    navigateForStep(nextIdx);
  };
  const done = () => { setIdx(0); onDone && onDone(); };

  // Controller-only mode: orchestrates flow without rendering overlay
    // Controller-only mode: orchestrate the flow without rendering any UI
  useEffect(() => {
    if (!visible || !controllerOnly) return;
    try {
        // Land on Dashboard for Week 1 picks; tiny delay keeps the transition smooth
      setTimeout(() => {
        try { navigationRef?.current?.navigate('Main', { screen: 'Dashboard' }); } catch {}
      }, 350);
    } catch {}
  }, [visible, controllerOnly]);

  useEffect(() => {
    if (!visible || !controllerOnly) return;
    if (!week1SetupDone) return;
    // After anchors selected, navigate to Program and prompt marking one
      // After picks are saved, take user to Program (slight delay for polish)
    try {
      setTimeout(() => {
        try { navigationRef?.current?.navigate('Main', { screen: 'Program' }); } catch {}
      }, 450);
    } catch {}
    (async () => {
      try { await AsyncStorage.setItem('guideNeedMarkOne', 'true'); } catch {}
    })();
  }, [visible, controllerOnly, week1SetupDone]);

  useEffect(() => {
    if (!visible || !controllerOnly) return;
    // When at least one task marked for current day, advance guide to info step
      // Advance when any task is marked for the current day
    try {
      const day = getCurrentDay();
      const compMap = todayCompletions[day] || {};
      const anyMarked = Object.values(compMap).some(Boolean);
      if (anyMarked) {
        (async () => {
          try {
            await AsyncStorage.setItem('guideNeedMarkOne', 'false');
            await AsyncStorage.setItem('guideShowExplore', 'true');
          } catch {}
        })();
      }
    } catch {}
  }, [visible, controllerOnly, JSON.stringify(todayCompletions)]);

  useEffect(() => {
    if (!visible || !controllerOnly) return;
    // Auto-finish when tour marked as seen
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('guideSeen_v2');
        if (seen === 'true') {
          done();
        }
      } catch {}
    })();
  }, [visible, controllerOnly]);

    // In controller-only mode there is no visual overlay
  if (controllerOnly) {
    return null;
  }
  return (
    <Modal visible={!!visible} animationType="fade" transparent onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Quick Tour</Text>
            {/* Unskippable: remove close button */}
          </View>
          <View style={styles.stepHeader}>
            <Ionicons name={step.icon} size={28} color="#2563EB" />
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
          {/* Visuals: logo on Welcome, fireworks on Milestones */}
          {step.title === 'Welcome' && (
            <View style={styles.visualBox}>
              <Image
                source={require('../../assets/images/ResetDopa_Logo.png')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
            </View>
          )}
          {step.title === 'Calm Points' && (
            <View style={styles.visualBox}>
              <Text style={styles.pointsDisplay}>+7</Text>
              <Text style={styles.pointsLabel}>Points Earned</Text>
            </View>
          )}
          {step.title === 'Streaks Matter' && (
            <View style={styles.visualBox}>
              <Text style={styles.streakDisplay}>🔥 5</Text>
              <Text style={styles.pointsLabel}>Day Streak</Text>
            </View>
          )}
          {step.title === 'Milestones Ahead' && (
            <View style={styles.visualBox}>
              <LottieView
                source={require('../../assets/animations/fireworks.json')}
                autoPlay
                loop
                style={{ width: 180, height: 140 }}
              />
            </View>
          )}
          <ScrollView style={{ maxHeight: 180 }}>
            <Text style={styles.stepText}>{step.text}</Text>
          </ScrollView>
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }} />
            {last ? (
              <TouchableOpacity onPress={done} style={[styles.btn, styles.primary]}>
                <Text style={[styles.btnText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={next} style={[styles.btn, styles.primary]}>
                <Text style={[styles.btnText, { color: '#fff' }]}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i===idx && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  visualBox: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  pointsDisplay: { fontSize: 48, fontWeight: '900', color: '#10B981' },
  pointsLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  streakDisplay: { fontSize: 48, fontWeight: '900', color: '#EF4444' },
  stepText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  primary: { backgroundColor: '#2563EB', borderColor: '#1D4ED8' },
  secondary: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  btnText: { fontWeight: '700' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#2563EB' },
});
