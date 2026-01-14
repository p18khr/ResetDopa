// src/components/StreakCalendar.js
import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function StreakCalendar({ streak, urges }) {
  const {
    startDate,
    todayPicks,
    todayCompletions,
    getDailyMetrics,
  } = useContext(AppContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current, -1 = previous, etc.
  const MIN_OFFSET = -5;
  const MAX_OFFSET = 0;

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState(null); // { date, dateKey, programDay, picks, completions, urges }

  useEffect(() => {
    Animated.parallel([
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
  // Monthly view (GitHub-style grid for current month)
  const getMonthlyDays = () => {
    const base = new Date();
    const viewYear = base.getFullYear();
    const viewMonth = base.getMonth() + monthOffset; // can be <0 or >11, Date will normalize
    const startOfMonth = new Date(viewYear, viewMonth, 1);
    const endOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Align to full weeks (Sun-Sat)
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    const endOfCalendar = new Date(endOfMonth);
    endOfCalendar.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

    const days = [];
    const cursor = new Date(startOfCalendar);
    while (cursor <= endOfCalendar) {
      const inMonth = cursor.getMonth() === startOfMonth.getMonth();
      const dayUrges = (urges || []).filter(u => {
        const d = new Date(u.timestamp);
        return d.toDateString() === cursor.toDateString();
      });
      days.push({
        date: new Date(cursor),
        urgeCount: dayUrges.length,
        inMonth,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  const days = getMonthlyDays();
  
  // Get color based on activity level
  const getColor = (day) => {
    // Dim days outside the current month
    if (!day.inMonth) return '#E5E7EB';
    // Clean day
    if (day.urgeCount === 0) return '#10B981';
    if (day.urgeCount === 1) return '#FBBF24';
    if (day.urgeCount <= 3) return '#F59E0B';
    return '#EF4444';
  };

  // Group days by weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthTitle = (() => {
    const anyInMonth = days.find(d => d.inMonth) || { date: new Date() };
    const d = anyInMonth.date;
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  })();

  const dateToProgramDay = (date) => {
    if (!startDate) return null;
    try {
      const sd = new Date(startDate);
      const startMid = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
      const dMid = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const diff = Math.floor((dMid - startMid) / (24*60*60*1000)) + 1;
      return diff;
    } catch { return null; }
  };

  const openDetails = (day) => {
    const date = day.date;
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0,10);
    const programDay = dateToProgramDay(date);
    const picks = (programDay && programDay >= 1) ? (todayPicks?.[programDay] || []) : [];
    const completions = (programDay && programDay >= 1) ? (todayCompletions?.[programDay] || {}) : {};
    const doneCount = Object.values(completions).filter(Boolean).length;
    const metrics = getDailyMetrics ? (getDailyMetrics(dateKey) || null) : null;
    setDetailData({
      date,
      dateKey,
      programDay,
      picks,
      completions,
      urges: typeof day.urgeCount === 'number' ? day.urgeCount : (metrics?.urges ?? 0),
      doneCount,
      target: metrics?.target ?? (picks?.length || 0),
    });
    setDetailVisible(true);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.title}>Monthly Progress</Text>
      <View style={styles.navRow}>
        <TouchableOpacity
          accessibilityLabel="Previous month"
          onPress={() => setMonthOffset(o => Math.max(MIN_OFFSET, o - 1))}
          disabled={monthOffset <= MIN_OFFSET}
          style={[styles.navBtn, monthOffset <= MIN_OFFSET && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.subtitle}>{monthTitle}</Text>
        <TouchableOpacity
          accessibilityLabel="Next month"
          onPress={() => setMonthOffset(o => Math.min(MAX_OFFSET, o + 1))}
          disabled={monthOffset >= MAX_OFFSET}
          style={[styles.navBtn, monthOffset >= MAX_OFFSET && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-forward" size={20} color="#111827" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarContainer}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.calendarScroll}>
          <View style={styles.calendar}>
            {/* Day-of-week header row */}
            <View style={styles.weekdayHeader}>
              {['S','M','T','W','T','F','S'].map((d, idx) => (
                <Text key={idx} style={styles.weekdayLabel}>{d}</Text>
              ))}
            </View>
            {/* Calendar grid */}
            <View style={styles.grid}>
              {weeks.map((week, weekIdx) => (
                <View key={weekIdx} style={styles.weekRow}>
                  {week.map((day, dayIdx) => (
                    <TouchableOpacity
                      key={dayIdx}
                      activeOpacity={0.8}
                      onLongPress={() => openDetails(day)}
                      delayLongPress={250}
                      accessibilityLabel={`Details for ${day.date.toDateString()}`}
                      style={[
                        styles.day,
                        { backgroundColor: getColor(day), opacity: day.inMonth ? 1 : 0.5 }
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Clean</Text>
        <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
        <Text style={styles.legendText}>1</Text>
        <View style={[styles.legendBox, { backgroundColor: '#FBBF24' }]} />
        <Text style={styles.legendText}>2-3</Text>
        <View style={[styles.legendBox, { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.legendText}>4+</Text>
        <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
      </View>

      {/* Detail Modal */}
      <Modal
        transparent
        visible={detailVisible}
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDetailVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {detailData?.date?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) || 'Day details'}
              </Text>
              {typeof detailData?.programDay === 'number' && (
                <Text style={styles.modalSubTitle}>
                  {detailData.programDay >= 1 ? `Program Day ${detailData.programDay}` : 'Before program start'}
                </Text>
              )}
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Urges:</Text>
              <Text style={styles.modalValue}>{detailData?.urges ?? 0}</Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Tasks completed / Min to move streak:</Text>
              <Text style={styles.modalValue}>
                {(detailData?.picks?.length || 0) > 0
                  ? `${detailData?.doneCount || 0}/${detailData?.target ?? detailData?.picks?.length}`
                  : 'No tasks assigned'}
              </Text>
            </View>

            {Array.isArray(detailData?.picks) && detailData.picks.length > 0 && (
              <View style={styles.taskList}>
                {detailData.picks.slice(0, 10).map((t, idx) => {
                  const done = !!detailData.completions?.[t];
                  return (
                    <View key={idx} style={styles.taskItem}>
                      <Ionicons
                        name={done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={done ? '#10B981' : '#9CA3AF'}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.taskText, done && { color: '#10B981' }]} numberOfLines={1}>
                        {t}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  calendarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarScroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  calendar: {
    paddingVertical: 8,
    alignSelf: 'center',
    width: 162,
  },
  monthLabels: {
    flexDirection: 'row',
    marginBottom: 8,
    height: 20,
    position: 'relative',
  },
  monthLabel: {
    fontSize: 12,
    color: '#6B7280',
    position: 'absolute',
  },
  grid: {
    flexDirection: 'column',
    gap: 6,
    alignSelf: 'stretch',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-start',
  },
  weekdayHeader: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 6,
  },
  weekdayLabel: {
    width: 18,
    textAlign: 'center',
    fontSize: 10,
    color: '#6B7280',
  },
  day: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 24,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalLabel: {
    fontSize: 14,
    color: '#374151',
  },
  modalValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  taskList: {
    marginTop: 8,
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskText: {
    fontSize: 14,
    color: '#111827',
    flexShrink: 1,
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
