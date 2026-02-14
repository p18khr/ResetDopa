// Context value type definitions

import React from 'react';
import { FirebaseUser, Task, Urge, Badge, BadgeToast, Quote, MoodValue } from './user.types';
import {
  GraceUsage,
  DailyMetrics,
  RolloverBannerInfo,
  GraceStatus,
  RecommendedTask,
  DayPicksMap,
  DayCompletionsMap,
  DateKeyMap,
  ProgramDayTitles,
} from './program.types';
import { ColorPalette, ThemeColors } from './theme.types';

/**
 * AuthContext value type
 */
export interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  hasAcceptedTerms: boolean;
  acceptanceLoaded: boolean;
  acceptTerms: () => Promise<void>;
  setHasAcceptedTerms: (value: boolean) => void;
  setAcceptanceLoaded: (value: boolean) => void;
}

/**
 * ProgramContext value type
 */
export interface ProgramContextValue {
  // State
  streak: number;
  startDate: string | null;
  startDateResets: number;
  todayPicks: DayPicksMap;
  todayCompletions: DayCompletionsMap;
  dailyMetrics: DateKeyMap<DailyMetrics>;
  adherenceWindowDays: number;
  devDayOffset: number;
  week1SetupDone: boolean;
  week1Anchors: string[];
  week1RotationApplied: boolean;
  week1Completed: boolean;
  backfillDisabledBeforeDay: number;
  graceUsages: GraceUsage[];
  lastStreakDayCounted: number;
  streakEvaluatedForDay: number;
  thresholdMetToday: number;
  lastStreakMessage: string;
  lastRolloverPrevDayEvaluated: number;
  rolloverBannerInfo: RolloverBannerInfo | null;
  rolloverBannerDismissedDay: number;
  streakBumpSeq: number;
  observedDayKey: string;

  // Methods
  getCurrentDay: () => number;
  getAdherence: (windowDays?: number) => number;
  getRampThreshold: (day: number) => number;
  ensurePicksForDay: (dayNumber: number) => string[];
  evaluateStreakProgress: (dayNumber: number, completionsState: Record<string, boolean>) => void;
  updateStreak: (newStreak: number) => void;
  getDisplayStreak: () => number;
  saveUserData: (updates: Record<string, any>) => Promise<void>;
  setProgramState: (updates: Partial<ProgramContextValue>) => void;
  queueEvaluation: (fn: () => void | Promise<void>) => Promise<void>;
  getVirtualDateKey: () => string;

  // Refs
  generatedDayTasksRef: React.MutableRefObject<Record<number, any[]>>;
  streakEvaluatedForDayRefRef: React.MutableRefObject<number>;
  lastRolloverPrevDayEvaluatedRefRef: React.MutableRefObject<number>;

  // Setters
  setTodayPicks: (picks: DayPicksMap) => void;
  setTodayCompletions: (completions: DayCompletionsMap) => void;
  setWeek1SetupDone: (done: boolean) => void;
  setWeek1Anchors: (anchors: string[]) => void;
  setWeek1RotationApplied: (applied: boolean) => void;
  setWeek1Completed: (completed: boolean) => void;
  setBackfillDisabledBeforeDay: (day: number) => void;
  setGraceUsages: (graces: GraceUsage[]) => void;
  setLastStreakDayCounted: (day: number) => void;
  setStreakEvaluatedForDay: (day: number) => void;
  setThresholdMetToday: (day: number) => void;
  setLastStreakMessage: (msg: string) => void;
  setLastRolloverPrevDayEvaluated: (day: number) => void;
  setRolloverBannerInfo: (info: RolloverBannerInfo | null) => void;
  setRolloverBannerDismissedDay: (day: number) => void;
  setStartDate: (date: string) => void;
  setDevDayOffset: (offset: number) => void;
  setAdherenceWindowDays: (days: number) => void;
}

/**
 * UrgesContext value type
 */
export interface UrgesContextValue {
  urges: Urge[];
  addUrge: (intensity: string, triggerText?: string, momentNotes?: string, emotion?: string) => Urge;
  updateUrgeOutcome: (id: string, outcome: string) => void;
  setUrgesFromData: (urgesData: Urge[]) => void;
  getUrgeCount: () => number;
  getRecentUrges: (days?: number) => Urge[];
  getUrgesForDate: (dateKey: string) => Urge[];
  setUrges: (urges: Urge[]) => void;
}

/**
 * BadgesContext value type
 */
export interface BadgesContextValue {
  badges: Badge[];
  calmPoints: number;
  badgeToast: BadgeToast | null;
  claimBadge: (badgeId: string) => void;
  checkAndClaimBadges: (metricsState: {
    streakVal?: number;
    calmPointsVal?: number;
    tasksVal?: Task[];
    urgesVal?: Urge[];
    completionsState?: DayCompletionsMap;
  }) => void;
  setCalmPoints: (points: number) => void;
  clearBadgeToast: () => void;
  setBadgesFromData: (badgesData: Badge[]) => void;
  setBadges: (badges: Badge[]) => void;
}

/**
 * SettingsContext value type
 */
export interface SettingsContextValue {
  enableEnhancedFeatures: boolean;
  completedWeeksWithFireworks: number[];
  setCompletedWeeksWithFireworks: (weeks: number[]) => void;
  markWeekFireworksFired: (weekNumber: number) => Promise<void>;
  setCompletedWeeksFromData: (data: number[]) => void;
}

/**
 * ThemeContext value type
 */
export interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  colors: ColorPalette;
  allColors: ThemeColors;
}

/**
 * AppContext value type (aggregates all contexts)
 */
export interface AppContextValue {
  // From AuthContext
  user: FirebaseUser | null;
  loading: boolean;
  hasAcceptedTerms: boolean;
  acceptanceLoaded: boolean;
  acceptTerms: () => Promise<void>;

  // From ProgramContext & AppContext
  streak: number;
  startDate: string | null;
  startDateResets: number;
  resetProgramStartDate: () => Promise<{ ok: boolean; reason?: string; used?: number }>;

  // UI & Metrics
  calmPoints: number;
  setCalmPoints: (points: number) => void;
  tasks: Task[];
  toggleTask: (taskId: string) => void;

  // Urges
  urges: Urge[];
  logUrge: (options: {
    emotion: string;
    note?: string;
    intensity?: string;
    trigger?: string;
  }) => string;
  updateUrgeOutcome: (id: string, outcome: string) => void;

  // Badges & Rewards
  badges: Badge[];
  badgeToast: BadgeToast | null;
  clearBadgeToast: () => void;
  claimBadge: (badgeId: string) => void;

  // Program Management
  todayPicks: DayPicksMap;
  setTodayPicksForDay: (dayNumber: number, picks: string[]) => void;
  setAllTodayPicks: (picksObject: DayPicksMap) => void;
  todayCompletions: DayCompletionsMap;
  toggleTodayTaskCompletion: (dayNumber: number, title: string, points?: number) => void;
  getCurrentDay: () => number;

  // Recommendations & Helpers
  getDailyRecommendations: (count?: number) => RecommendedTask[];
  getAdherence: (windowDays?: number) => number;
  getPicksIncrement: () => number;
  getDynamicTaskCount: (dayNumber: number) => number;
  getGeneratedTasks: (day: number) => any[];

  // Week 1
  week1SetupDone: boolean;
  setWeek1SetupDone: (done: boolean) => Promise<void>;
  week1Anchors: string[];
  setWeek1Anchors: (anchors: string[]) => void;
  week1RotationApplied: boolean;
  week1Completed: boolean;

  // Grace & Streaks
  graceUsages: GraceUsage[];
  lastStreakDayCounted: number;
  lastStreakMessage: string;
  evaluateStreakProgress: (dayNumber: number, completionsState: Record<string, boolean>) => void;
  getGraceStatus: () => GraceStatus;

  // Rollover
  rolloverBannerInfo: RolloverBannerInfo | null;
  dismissRolloverBanner: () => void;

  // Daily Features
  dailyQuote: Quote | null;
  dailyQuoteSource: 'cloud' | 'local' | 'generated';
  refreshDailyQuote: () => Promise<void>;
  dailyQuest: string | null;
  dailyQuestDone: DateKeyMap<boolean>;
  markDailyQuestDone: () => Promise<void>;
  dailyMood: DateKeyMap<MoodValue>;
  setDailyMood?: (updated: DateKeyMap<MoodValue>) => void;

  // Metrics
  dailyMetrics: DateKeyMap<DailyMetrics>;
  getDailyMetrics: (dateKey: string) => DailyMetrics | null;
  getRecentMetrics: (days?: number) => Array<{ dateKey: string; metrics: DailyMetrics | null }>;

  // Testing & Dev
  seedTestData: (profile?: 'low' | 'medium' | 'high') => Promise<void>;
  resetTestData: () => Promise<void>;
  advanceProgramDay: (steps?: number) => Promise<number>;
  initializeBeginnerState: () => Promise<void>;
  setVirtualDay: (targetDay?: number) => Promise<{ ok: boolean; reason?: string; day?: number; offset?: number }>;
  completeDaySilently: (dayNumber: number) => Promise<{ ok: boolean; reason?: string; count?: number }>;
  devDayOffset: number;

  // Misc
  enableEnhancedFeatures: boolean;
  adherenceWindowDays: number;
  setAdherenceWindowDays: (days: number) => void;
  completedWeeksWithFireworks: number[];
  markWeekFireworksFired: (weekNumber: number) => Promise<void>;
  streakBumpSeq: number;
  PROGRAM_DAY_TITLES: ProgramDayTitles;
  backfillDisabledBeforeDay: number;
}
