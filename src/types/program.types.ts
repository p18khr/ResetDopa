// Program-specific data structures

/**
 * Grace usage tracking for rolling 7-day window
 */
export interface GraceUsage {
  usedOnDay: number;
  expiresOnDay: number;
}

/**
 * Daily metrics for progress tracking
 */
export interface DailyMetrics {
  urges: number;
  completions: number;
  target: number;
  adherence: number;
  variety: number;
  categoriesCovered: string[];
  calmDelta: number;
  streak: number;
}

/**
 * Rollover banner notification info
 */
export interface RolloverBannerInfo {
  day: number;
  type: 'advance' | 'grace' | 'hold' | 'reset';
  message: string;
}

/**
 * Grace status for debugging/display
 */
export interface GraceStatus {
  graceAvailable: boolean;
  graceDaysUsedInPast7: number[];
  activeGracesCount: number;
  nextAvailableDay: number;
  allGraceUsages: GraceUsage[];
}

/**
 * Recommended task with scoring
 */
export interface RecommendedTask {
  title: string;
  category: string;
  score: number;
}

/**
 * Day-indexed data structures
 */
export type DayPicksMap = Record<number, string[]>;
export type DayCompletionsMap = Record<number, Record<string, boolean>>;
export type DateKeyMap<T> = Record<string, T>;

/**
 * Program day titles mapping
 */
export type ProgramDayTitles = Record<number, string>;
