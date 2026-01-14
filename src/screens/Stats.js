// src/screens/Stats.js
import React, { useContext, useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, StatusBar, TouchableOpacity, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import LawChip from '../components/LawChip';
import { getLawForRoute } from '../utils/lawLabels';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirstVisitOverlay from '../components/FirstVisitOverlay';
import StreakNumber from '../components/StreakNumber';
import { useIsFocused } from '@react-navigation/native';

export default function Stats({ navigation, route }) {
  const { calmPoints, urges, streak, getRecentMetrics, dailyMetrics, devDayOffset, getCurrentDay, startDate, dailyQuote } = useContext(AppContext);
  const currentDay = getCurrentDay();
  const isFocused = useIsFocused();
  const [showIntro, setShowIntro] = useState(false);
  const [introCheckPending, setIntroCheckPending] = useState(true);
  const [showDay2Loader, setShowDay2Loader] = useState(false);
  const loaderShownForDayRef = useRef(null);
  const loaderQuoteOpacity = useRef(new Animated.Value(0)).current;
  const loaderOverlayOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('seen_intro_stats');
        if (!mounted) return;
        if (seen !== 'true') setShowIntro(true);
      } catch {}
      finally {
        if (mounted) setIntroCheckPending(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
    contentOpacity.setValue(1);
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
  // Determine window days based on days since program start (max 7)
  const virtualToday = new Date();
  try { if (devDayOffset && Number.isFinite(devDayOffset)) virtualToday.setDate(virtualToday.getDate() + devDayOffset); } catch {}
  const daysSinceStart = (() => {
    if (!startDate) return 1;
    const sd = new Date(startDate);
    const startMid = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
    const todayMid = new Date(virtualToday.getFullYear(), virtualToday.getMonth(), virtualToday.getDate()).getTime();
    return Math.max(1, Math.min(7, Math.floor((todayMid - startMid) / (24*60*60*1000)) + 1));
  })();
  const recentMetrics = useMemo(() => getRecentMetrics(daysSinceStart), [getRecentMetrics, daysSinceStart, dailyMetrics]);

  // Extract series with fallback zeros
  const adherenceSeries = recentMetrics.map(r => (r.metrics ? Number((r.metrics.adherence * 100).toFixed(0)) : 0));
  const completionsSeries = recentMetrics.map(r => (r.metrics ? r.metrics.completions : 0));
  const targetSeries = recentMetrics.map(r => (r.metrics ? r.metrics.target : 0));
  const varietySeries = recentMetrics.map(r => (r.metrics ? Number((r.metrics.variety * 100).toFixed(0)) : 0));
  const labelsSeries = recentMetrics.map(r => {
    const d = new Date(r.dateKey + 'T00:00:00');
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()].slice(0,3);
  });

  const todayMetrics = recentMetrics[recentMetrics.length - 1]?.metrics || null;
  const screenW = Dimensions.get('window').width - 40;
  // Calculate urges per day for the last N days (<=7)
  const getLastNDaysUrges = (windowDays) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) today.setDate(today.getDate() + devDayOffset); } catch {}
    const labels = [];
    const urgesPerDay = [];
    const span = Math.max(1, Math.min(7, windowDays || 7));
    for (let i = span - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      labels.push(dayName);
      
      // Count urges for this day
      const dayUrges = urges.filter(urge => {
        const urgeDate = new Date(urge.timestamp);
        return urgeDate.toDateString() === date.toDateString();
      }).length;
      
      urgesPerDay.push(dayUrges);
    }

    return { labels, data: urgesPerDay };
  };

  const urgesData = getLastNDaysUrges(daysSinceStart);
  // Intensity legend counts for last N days
  const lastNUrges = (() => {
    const today = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) today.setDate(today.getDate() + devDayOffset); } catch {}
    const start = new Date(today); start.setDate(start.getDate() - (Math.max(1, daysSinceStart) - 1));
    return urges.filter(u => {
      const d = new Date(u.timestamp);
      return d >= start && d <= today;
    });
  })();
  const intensityCounts = {
    low: lastNUrges.filter(u => u.intensity === 'low').length,
    medium: lastNUrges.filter(u => u.intensity === 'medium').length,
    high: lastNUrges.filter(u => u.intensity === 'high').length,
  };
  const resilience = useMemo(() => {
    const virtualToday = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) virtualToday.setDate(virtualToday.getDate() + devDayOffset); } catch {}
    const cutoff = new Date(virtualToday);
    cutoff.setDate(cutoff.getDate() - 7);
    const last7 = Object.values(urges || {}).filter(u => {
      const d = new Date(u.timestamp);
      return d >= cutoff && d <= virtualToday;
    });
    const total = last7.length;
    const resisted = last7.filter(u => (u.outcome || '').toLowerCase() === 'resisted').length;
    const pct = total > 0 ? Math.round((resisted / total) * 100) : 0;
    // Simple trend: compare last 3 days vs prior 4
    const sorted = [...last7].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const splitIdx = Math.max(sorted.length - 3, 0);
    const recentSlice = sorted.slice(splitIdx);
    const priorSlice = sorted.slice(0, splitIdx);
    const recentPct = recentSlice.length ? Math.round((recentSlice.filter(u => (u.outcome || '').toLowerCase() === 'resisted').length / recentSlice.length) * 100) : 0;
    const priorPct = priorSlice.length ? Math.round((priorSlice.filter(u => (u.outcome || '').toLowerCase() === 'resisted').length / priorSlice.length) * 100) : 0;
    const delta = recentPct - priorPct;
    return { pct, delta };
  }, [urges]);
  const maxUrges = Math.max(...urgesData.data, 5); // Ensure minimum scale of 5

  // Helper: ensure minimum y-axis range to prevent repeated labels
  const ensureMinRange = (data, minMax) => {
    const currentMax = Math.max(...data);
    if (currentMax < minMax) {
      // Add invisible ceiling point
      return [
        { data: data },
        { data: data.map(() => minMax), withDots: false, color: () => 'transparent' }
      ];
    }
    return [{ data: data }];
  };

  // Charts (reuse library). Limit decimals.
  const adherenceChartData = {
    labels: labelsSeries,
    datasets: ensureMinRange(adherenceSeries, 100)
  };
  const completionsChartData = {
    labels: labelsSeries,
    datasets: [{ data: completionsSeries }]
  };
  const varietyChartData = {
    labels: labelsSeries,
    datasets: ensureMinRange(varietySeries, 100)
  };

  const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: ANDROID_TOP }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      {/* ===== DAY 1: INTRO MODAL WITH BLOCKER ===== */}
      {/* WHITE BLOCKER: Appears immediately to block content */}
      {(currentDay === 1) && (introCheckPending || showIntro) && (
        <View style={styles.day1Blocker} />
      )}
      
      {/* MODAL: Native FirstVisitOverlay */}
      <FirstVisitOverlay
        visible={showIntro}
        title="Stats & Insights"
        text="See adherence, variety, urges, and clear Today markers. Use trends to steer tiny improvements."
        onClose={async () => { setShowIntro(false); try { await AsyncStorage.setItem('seen_intro_stats','true'); } catch {} }}
      />
      
      {/* ===== DAY 2+: LOADER OVERLAY ===== */}
      {showDay2Loader && (
        <Animated.View style={[styles.fullscreenLoader, { opacity: loaderOverlayOpacity }]}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loaderTitle}>Curating your stats</Text>
          {dailyQuote ? (
            <Animated.Text style={[styles.loaderQuote, { opacity: loaderQuoteOpacity }]}>
              "{dailyQuote.text}" — {dailyQuote.author}
            </Animated.Text>
          ) : null}
        </Animated.View>
      )}
      
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <Text style={styles.title}>Stats & Progress</Text>
            <LawChip law={getLawForRoute(route?.name || 'Stats')} />
          </View>
        </View>
        <Text style={styles.demoTag}>Demo Day: {typeof getCurrentDay === 'function' ? getCurrentDay() : '—'}</Text>

        {/* Urges Weekly Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📊 Urges (last {daysSinceStart}d)</Text>
          <Text style={styles.chartSubtitle}>Track your urge patterns over the last {daysSinceStart} days</Text>
          <View style={styles.intensityLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot,{ backgroundColor:'#10B981' }]} /><Text style={styles.legendLabel}>Low: {intensityCounts.low}</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot,{ backgroundColor:'#F59E0B' }]} /><Text style={styles.legendLabel}>Med: {intensityCounts.medium}</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot,{ backgroundColor:'#EF4444' }]} /><Text style={styles.legendLabel}>High: {intensityCounts.high}</Text></View>
          </View>
          <View style={{ marginTop: 12, padding: 12, backgroundColor: '#eef7f1', borderRadius: 8 }}>
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>Resilience ({daysSinceStart} days)</Text>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>{resilience.pct}% resisted</Text>
            <Text style={{ color: resilience.delta >= 0 ? '#2e7d32' : '#c62828', marginTop: 4 }}>
              {resilience.delta >= 0 ? 'Up ' : 'Down '}{Math.abs(resilience.delta)} pts vs prior
            </Text>
          </View>
          <View style={[styles.chartWrapper, { width: screenW }]}> 
            <LineChart
              data={{ 
                labels: urgesData.labels, 
                datasets: [
                  { data: urgesData.data.length > 0 ? urgesData.data : [0,0,0,0,0,0,0] },
                  { data: urgesData.data.map(() => Math.max(maxUrges, 5)), withDots: false, color: () => 'transparent' }
                ] 
              }}
              width={screenW}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                labelColor: () => '#6B7280',
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#EA580C' },
                decimalPlaces: 0,
              }}
              style={styles.chart}
              bezier
              withInnerLines={true}
              withOuterLines={true}
              fromZero
              segments={5}
              formatYLabel={(val) => Math.round(Number(val)).toString()}
            />
          </View>
          <Text style={styles.todayMarker}>Today: {labelsSeries[labelsSeries.length - 1]}</Text>
        </View>

        {/* Stats Tiles */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Calm Points</Text>
            <Text style={styles.tileValue}>{calmPoints}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Streak</Text>
            <StreakNumber style={styles.tileValue} suffix="d" />
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Total Urges</Text>
            <Text style={styles.tileValue}>{urges.length}</Text>
          </View>
        </View>

        <View style={[styles.tiles, { marginTop: 8 }]}>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Today Adherence</Text>
            <Text style={styles.tileValue}>{todayMetrics ? Math.round(todayMetrics.adherence * 100) + '%' : '—'}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Completions</Text>
            <Text style={styles.tileValue}>{todayMetrics ? `${todayMetrics.completions}/${todayMetrics.target}` : '—'}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Variety</Text>
            <Text style={styles.tileValue}>{todayMetrics ? Math.round(todayMetrics.variety * 100) + '%' : '—'}</Text>
          </View>
        </View>
        {/* Adherence Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📈 Adherence ({daysSinceStart}d)</Text>
          <Text style={styles.chartSubtitle}>Consistency percentage per day</Text>
          <View style={[styles.chartWrapper, { width: screenW }]}> 
            <LineChart
              data={adherenceChartData}
              width={screenW}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: () => '#6B7280',
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#10B981' },
                decimalPlaces: 0,
              }}
              style={styles.chart}
              bezier
              fromZero
              segments={5}
              formatYLabel={(val) => Math.round(Number(val)).toString()}
            />
            <View style={styles.todayLine} />
          </View>
          <Text style={styles.todayMarker}>Today: {labelsSeries[labelsSeries.length - 1]}</Text>
        </View>

        {/* Completions Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>✅ Completions vs Target ({daysSinceStart}d)</Text>
          <Text style={styles.chartSubtitle}>Completed tasks (line) vs daily target (dashed)</Text>
          <View style={[styles.chartWrapper, { width: screenW }]}> 
            <LineChart
              data={{ 
                labels: labelsSeries, 
                datasets: [
                  { data: completionsSeries, color: (o=1)=>`rgba(74,144,226,${o})` }, 
                  { data: targetSeries, color:(o=1)=>`rgba(156,163,175,${o})` },
                  { data: completionsSeries.map(() => Math.max(...completionsSeries, ...targetSeries, 5)), withDots: false, color: () => 'transparent' }
                ] 
              }}
              width={screenW}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(74,144,226,${opacity})`,
                labelColor: () => '#6B7280',
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#4A90E2' },
                decimalPlaces: 0,
              }}
              style={styles.chart}
              fromZero
              segments={Math.max(...completionsSeries, ...targetSeries, 3)}
              yAxisInterval={1}
              formatYLabel={(val) => {
                const num = Math.round(Number(val));
                return num.toString();
              }}
            />
            <View style={styles.todayLine} />
          </View>
          <Text style={styles.todayMarker}>Today: {labelsSeries[labelsSeries.length - 1]}</Text>
        </View>

        {/* Variety Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>🔀 Variety ({daysSinceStart}d)</Text>
          <Text style={styles.chartSubtitle}>Distinct categories coverage %</Text>
          <View style={[styles.chartWrapper, { width: screenW }]}> 
            <LineChart
              data={varietyChartData}
              width={screenW}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(234,179,8,${opacity})`,
                labelColor: () => '#6B7280',
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#FBBF24' },
                decimalPlaces: 0,
              }}
              style={styles.chart}
              bezier
              fromZero
              segments={5}
              formatYLabel={(val) => Math.round(Number(val)).toString()}
            />
            <View style={styles.todayLine} />
          </View>
          <Text style={styles.todayMarker}>Today: {labelsSeries[labelsSeries.length - 1]}</Text>
        </View>

        {/* Insights */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Insights</Text>
          <Text style={styles.insightText}>
            {urges.length === 0 
              ? "Start logging urges to see patterns and insights."
              : `You've logged ${urges.length} urge${urges.length > 1 ? 's' : ''} so far. Keep building awareness!`
            }
          </Text>
          {todayMetrics && (
            <Text style={styles.insightText}>Today: {todayMetrics.completions}/{todayMetrics.target} tasks • Adherence {Math.round(todayMetrics.adherence * 100)}%</Text>
          )}
          {todayMetrics && todayMetrics.categoriesCovered && todayMetrics.categoriesCovered.length > 0 && (
            <Text style={styles.insightText}>Variety: {todayMetrics.categoriesCovered.join(', ')} ({todayMetrics.categoriesCovered.length}/8)</Text>
          )}
          {adherenceSeries.some(v => v > 0) && (
            <Text style={styles.insightText}>{daysSinceStart}d Avg Adherence: {Math.round(adherenceSeries.reduce((a,b)=>a+b,0)/adherenceSeries.length)}%</Text>
          )}
          {varietySeries.some(v => v > 0) && (
            <Text style={styles.insightText}>{daysSinceStart}d Avg Variety: {Math.round(varietySeries.reduce((a,b)=>a+b,0)/varietySeries.length)}%</Text>
          )}
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight:'700', color:'#1A1A1A' }}>What these mean</Text>
            <Text style={styles.insightText}>Adherence: % of assigned tasks completed that day.</Text>
            <Text style={styles.insightText}>Variety: Coverage across task categories (mind, physical, focus, etc.).</Text>
            <Text style={styles.insightText}>Streak: Consecutive days meeting thresholds (with occasional grace).</Text>
            <Text style={styles.insightText}>Grace: A saved day when you were close to the threshold.</Text>
          </View>
        </View>
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  day1Blocker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 998,
  },
  fullscreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  loaderQuote: {
    marginTop: 20,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tiles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  tile: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tileTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    padding: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  todayLine: {
    position: 'absolute',
    right: 10,
    top: 16,
    bottom: 32,
    width: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
    opacity: 0.8,
  },
  todayMarker: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  demoTag: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 12,
  },
  intensityLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: { fontSize: 12, color: '#374151' },
});
