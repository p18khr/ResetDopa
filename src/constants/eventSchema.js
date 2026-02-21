// src/constants/eventSchema.js
// Unified UserEvent schema - foundation for AI analytics and training data
// All app events follow this structure for consistent ML feature extraction

// ─── Event Types ─────────────────────────────────────────────────────────────
export const EVENT_TYPES = {
  URGE_LOGGED:      'urge_logged',
  URGE_OUTCOME:     'urge_outcome',
  MOOD_CHECK:       'mood_check',
  TASK_COMPLETED:   'task_completed',
  TASK_UNCOMPLETED: 'task_uncompleted',
  STREAK_ACHIEVED:  'streak_achieved',
  STEPS_GOAL_MET:   'steps_goal_met',
  CHAT_MESSAGE:     'chat_message',
  SESSION_START:    'session_start',
};

// ─── Time Context ─────────────────────────────────────────────────────────────
export const TIME_OF_DAY = {
  EARLY_MORNING: 'early_morning', // 05:00 - 08:59
  MORNING:       'morning',       // 09:00 - 11:59
  AFTERNOON:     'afternoon',     // 12:00 - 16:59
  EVENING:       'evening',       // 17:00 - 20:59
  NIGHT:         'night',         // 21:00 - 23:59
  LATE_NIGHT:    'late_night',    // 00:00 - 04:59
};

export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ─── Urge Schema ──────────────────────────────────────────────────────────────
export const URGE_INTENSITY = {
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
};

export const URGE_OUTCOME = {
  RESISTED: 'resisted',
  SLIPPED:  'slipped',
  PENDING:  null,
};

// ─── Mood Values ──────────────────────────────────────────────────────────────
export const MOOD_VALUES = {
  stressed:  1,
  anxious:   2,
  tired:     3,
  numb:      4,
  foggy:     5,
  scattered: 6,
  calm:      7,
  good:      8,
};

// ─── Schema Builders ─────────────────────────────────────────────────────────
// These functions build correctly typed event objects

/**
 * Build base event metadata (common across all event types)
 */
export function buildEventBase(type, dayNumber) {
  const now = new Date();
  return {
    type,
    timestamp:   now.toISOString(),
    timestampMs: now.getTime(),
    dayNumber:   dayNumber || 0,
    timeOfDay:   getTimeOfDay(now),
    weekDay:     WEEK_DAYS[now.getDay()],
    weekNumber:  Math.ceil((dayNumber || 1) / 7),
  };
}

/**
 * Build a urge event object
 * @param {object} urgeData - { emotion, trigger, intensity, note, currentMood, dayNumber, steps? }
 */
export function buildUrgeEvent(urgeData) {
  return {
    ...buildEventBase(EVENT_TYPES.URGE_LOGGED, urgeData.dayNumber),
    // Core urge fields
    emotion:     urgeData.emotion || null,
    trigger:     urgeData.trigger || null,
    intensity:   urgeData.intensity || URGE_INTENSITY.MEDIUM,
    note:        urgeData.note || null,
    outcome:     URGE_OUTCOME.PENDING,
    // Context at time of urge - rich features for AI
    moodAtTime:  urgeData.currentMood || null,
    moodScore:   MOOD_VALUES[urgeData.currentMood] || null,
    stepsAtTime: urgeData.steps || null,
  };
}

/**
 * Build a mood check event
 * @param {object} moodData - { mood, source, dayNumber }
 */
export function buildMoodEvent(moodData) {
  return {
    ...buildEventBase(EVENT_TYPES.MOOD_CHECK, moodData.dayNumber),
    mood:      moodData.mood,
    moodScore: MOOD_VALUES[moodData.mood] || null,
    source:    moodData.source || 'checkin', // 'checkin' | 'chat'
  };
}

/**
 * Build a task completion event
 * @param {object} taskData - { taskName, isAdaptive, dayNumber, currentMood }
 */
export function buildTaskEvent(taskData) {
  return {
    ...buildEventBase(EVENT_TYPES.TASK_COMPLETED, taskData.dayNumber),
    taskName:   taskData.taskName,
    isAdaptive: taskData.isAdaptive || false,
    mood:       taskData.currentMood || null,
  };
}

/**
 * Build a steps goal event
 * @param {object} stepsData - { steps, goal, dayNumber }
 */
export function buildStepsEvent(stepsData) {
  return {
    ...buildEventBase(EVENT_TYPES.STEPS_GOAL_MET, stepsData.dayNumber),
    steps:    stepsData.steps,
    goal:     stepsData.goal,
    pctOfGoal: Math.round((stepsData.steps / stepsData.goal) * 100),
  };
}

/**
 * Build a chat message event (only logged if user opted in)
 * @param {object} chatData - { role, content, dayNumber, currentMood }
 */
export function buildChatEvent(chatData) {
  return {
    ...buildEventBase(EVENT_TYPES.CHAT_MESSAGE, chatData.dayNumber),
    role:    chatData.role, // 'user' | 'assistant'
    content: chatData.content,
    mood:    chatData.currentMood || null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get time of day category from a Date object
 */
export function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5  && hour < 9)  return TIME_OF_DAY.EARLY_MORNING;
  if (hour >= 9  && hour < 12) return TIME_OF_DAY.MORNING;
  if (hour >= 12 && hour < 17) return TIME_OF_DAY.AFTERNOON;
  if (hour >= 17 && hour < 21) return TIME_OF_DAY.EVENING;
  if (hour >= 21)              return TIME_OF_DAY.NIGHT;
  return TIME_OF_DAY.LATE_NIGHT; // 00:00 - 04:59
}

/**
 * Get numeric intensity value for ML features
 */
export function intensityToScore(intensity) {
  const map = { low: 1, medium: 2, high: 3 };
  return map[intensity] || 0;
}

/**
 * Derive AI-ready feature vector from a urge event
 * Useful for pattern analysis and model training
 */
export function urgeToFeatures(urgeEvent) {
  return {
    // Temporal features
    hour:        new Date(urgeEvent.timestamp).getHours(),
    dayOfWeek:   WEEK_DAYS.indexOf(urgeEvent.weekDay),
    weekNumber:  urgeEvent.weekNumber,
    timeOfDay:   Object.values(TIME_OF_DAY).indexOf(urgeEvent.timeOfDay),
    // Urge features
    intensityScore: intensityToScore(urgeEvent.intensity),
    moodScore:      urgeEvent.moodScore || 0,
    stepsAtTime:    urgeEvent.stepsAtTime || 0,
    // Outcome (label for supervised learning)
    resisted: urgeEvent.outcome === URGE_OUTCOME.RESISTED ? 1 : 0,
  };
}
