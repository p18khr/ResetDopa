// src/screens/Badges.js
import React, { useContext, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BADGE_DEFINITIONS = [
  { id: 'first_day', title: 'First Step', description: 'Started your journey', icon: '🌱', requirement: 'Join ResetDopa™', category: 'Starter' },
  { id: 'streak_3', title: '3 Day Warrior', description: '3 day streak achieved', icon: '🔥', requirement: '3 day streak', category: 'Streaks' },
  { id: 'streak_7', title: 'Week Champion', description: '7 day streak achieved', icon: '⭐', requirement: '7 day streak', category: 'Streaks' },
  { id: 'streak_30', title: 'Month Master', description: '30 day streak achieved', icon: '🏆', requirement: '30 day streak', category: 'Streaks' },
  { id: 'streak_90', title: 'Legendary', description: '90 day streak achieved', icon: '👑', requirement: '90 day streak', category: 'Streaks' },
  { id: 'tasks_10', title: 'Task Starter', description: 'Completed 10 tasks', icon: '✅', requirement: '10 tasks completed', category: 'Tasks' },
  { id: 'tasks_50', title: 'Task Master', description: 'Completed 50 tasks', icon: '💪', requirement: '50 tasks completed', category: 'Tasks' },
  { id: 'tasks_100', title: 'Task Legend', description: 'Completed 100 tasks', icon: '🚀', requirement: '100 tasks completed', category: 'Tasks' },
  { id: 'calm_100', title: 'Calm Collector', description: 'Earned 100 calm points', icon: '🌟', requirement: '100 calm points', category: 'Points' },
  { id: 'calm_500', title: 'Calm Expert', description: 'Earned 500 calm points', icon: '💎', requirement: '500 calm points', category: 'Points' },
  { id: 'calm_1000', title: 'Calm Master', description: 'Earned 1000 calm points', icon: '🎯', requirement: '1000 calm points', category: 'Points' },
  { id: 'urge_resist_10', title: 'Resistance Rookie', description: 'Resisted 10 urges', icon: '🛡️', requirement: 'Log 10 urges', category: 'Resistance' },
  { id: 'urge_resist_50', title: 'Resistance Hero', description: 'Resisted 50 urges', icon: '⚔️', requirement: 'Log 50 urges', category: 'Resistance' },
  { id: 'profile_complete', title: 'Identity Set', description: 'Completed your profile', icon: '👤', requirement: 'Set username & avatar', category: 'Profile' },
];

export default function Badges() {
  const { isDarkMode, colors } = useTheme();
  const { badges, streak, calmPoints, tasks, urges } = useContext(AppContext);

  // Calculate which badges should be unlocked
  const getBadgeStatus = (badgeId) => {
    switch (badgeId) {
      case 'first_day':
        return true; // Always unlocked
      case 'streak_3':
        return streak >= 3;
      case 'streak_7':
        return streak >= 7;
      case 'streak_30':
        return streak >= 30;
      case 'streak_90':
        return streak >= 90;
      case 'tasks_10':
        return tasks.filter(t => t.done).length >= 10;
      case 'tasks_50':
        return tasks.filter(t => t.done).length >= 50;
      case 'tasks_100':
        return tasks.filter(t => t.done).length >= 100;
      case 'calm_100':
        return calmPoints >= 100;
      case 'calm_500':
        return calmPoints >= 500;
      case 'calm_1000':
        return calmPoints >= 1000;
      case 'urge_resist_10':
        return urges.length >= 10;
      case 'urge_resist_50':
        return urges.length >= 50;
      case 'profile_complete':
        return false; // Will be set when user completes profile
      default:
        return false;
    }
  };

  const unlockedBadges = BADGE_DEFINITIONS.filter(b => getBadgeStatus(b.id));
  const lockedBadges = BADGE_DEFINITIONS.filter(b => !getBadgeStatus(b.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{unlockedBadges.length} of {BADGE_DEFINITIONS.length} unlocked</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${(unlockedBadges.length / BADGE_DEFINITIONS.length) * 100}%`, backgroundColor: colors.accent }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.accent }]}>
            {Math.round((unlockedBadges.length / BADGE_DEFINITIONS.length) * 100)}% Complete
          </Text>
        </View>

        {/* Unlocked Badges */}
        {unlockedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎉 Unlocked ({unlockedBadges.length})</Text>
            {unlockedBadges.map(badge => (
              <View key={badge.id} style={[styles.badgeCard, { backgroundColor: colors.surfacePrimary }]}>
                <View style={[styles.badgeIconUnlocked, { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                </View>
                <View style={styles.badgeInfo}>
                  <View style={styles.badgeHeader}>
                    <Text style={[styles.badgeTitle, { color: colors.text }]}>{badge.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.categoryText, { color: colors.accent }]}>{badge.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>{badge.description}</Text>
                  <Text style={[styles.badgeRequirement, { color: '#10B981' }]}>✓ {badge.requirement}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔒 Locked ({lockedBadges.length})</Text>
            {lockedBadges.map(badge => (
              <View key={badge.id} style={[styles.badgeCard, styles.badgeCardLocked, { backgroundColor: colors.surfacePrimary }]}>
                <View style={[styles.badgeIconLocked, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={styles.badgeEmojiLocked}>{badge.icon}</Text>
                </View>
                <View style={styles.badgeInfo}>
                  <View style={styles.badgeHeader}>
                    <Text style={[styles.badgeTitleLocked, { color: colors.textTertiary }]}>{badge.title}</Text>
                    <View style={[styles.categoryBadgeLocked, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.categoryTextLocked, { color: colors.textTertiary }]}>{badge.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.badgeDescriptionLocked, { color: colors.textTertiary }]}>{badge.description}</Text>
                  <Text style={[styles.badgeRequirementLocked, { color: colors.textTertiary }]}>🎯 {badge.requirement}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIconUnlocked: {
    width: 70,
    height: 70,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeIconLocked: {
    width: 70,
    height: 70,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeEmoji: {
    fontSize: 36,
  },
  badgeEmojiLocked: {
    fontSize: 36,
    opacity: 0.4,
  },
  badgeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badgeTitleLocked: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badgeDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  badgeDescriptionLocked: {
    fontSize: 14,
    marginBottom: 6,
  },
  badgeRequirement: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeRequirementLocked: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeLocked: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTextLocked: {
    fontSize: 11,
    fontWeight: '600',
  },
});

