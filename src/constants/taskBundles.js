// src/constants/taskBundles.js
// Pre-curated task bundles for personalized onboarding

export const TASK_BUNDLES = {
  clarity_starter: {
    id: 'clarity_starter',
    name: 'Clarity Starter',
    description: 'Morning reset for mental sharpness',
    painPoint: 'brain_fog',
    tags: ['morning', 'focus', 'energy'],
    tasks: [
      '10 min sunlight',
      'Cold face splash',
      'Breathwork 5 min',
      'Meditation 5 min',
      '10-15 min walk'
    ]
  },

  digital_detox: {
    id: 'digital_detox',
    name: 'Digital Detox',
    description: 'Break phone habits, reclaim focus',
    painPoint: 'scrolling',
    tags: ['detox', 'discipline', 'focus'],
    tasks: [
      'No phones first 30 min',
      'Turn off notifications',
      'Remove SM from home screen',
      'Dance to 1 song',
      'Read 10 pages'
    ]
  },

  calm_ground: {
    id: 'calm_ground',
    name: 'Calm & Ground',
    description: 'Stress regulation and grounding',
    painPoint: 'anxious',
    tags: ['calm', 'stress', 'mindfulness'],
    tasks: [
      'Breathwork 5 min',
      'Meditation 10 min',
      'Gratitude list (3 lines)',
      '5 min stretching/yoga',
      'Nature observation 5 min'
    ]
  },

  connection_rebuild: {
    id: 'connection_rebuild',
    name: 'Connection Rebuild',
    description: 'Social connection and prosocial rewards',
    painPoint: 'lonely',
    tags: ['social', 'connection', 'purpose'],
    tasks: [
      'Make bed',
      'Call friend/family 10 min',
      'Compliment someone',
      'Device-free meal',
      'Help someone'
    ]
  },

  morning_momentum: {
    id: 'morning_momentum',
    name: 'Morning Momentum',
    description: 'Identity-building early wins',
    timeOfDay: 'morning',
    tags: ['morning', 'identity', 'discipline'],
    tasks: [
      'Make bed',
      'Drink water first thing',
      '10 min sunlight',
      'Cold face splash',
      'Write 3 intentions'
    ]
  },

  focus_builder: {
    id: 'focus_builder',
    name: 'Focus Builder',
    description: 'Deep work and energy management',
    timeOfDay: 'afternoon',
    tags: ['focus', 'productivity', 'discipline'],
    tasks: [
      '25-min Pomodoro work',
      'Prioritize top 1 task',
      'Remove phone 1 hour',
      '10-15 min walk',
      'Study without music 15 min'
    ]
  },

  evening_reset: {
    id: 'evening_reset',
    name: 'Evening Reset',
    description: 'Wind-down and reflection',
    timeOfDay: 'evening',
    tags: ['evening', 'reflection', 'discipline'],
    tasks: [
      'No scrolling after 9pm',
      '2-hour no-phone block',
      'Journal 5 sentences',
      'Gratitude list',
      'Write a win of the day'
    ]
  }
};

/**
 * Get recommended bundle based on diagnostic answers
 * @param {string} q1Answer - Answer to Q1 (pain point)
 * @param {string} q2Answer - Answer to Q2 (time of day)
 * @returns {object} - Task bundle object
 */
export const getBundleForAnswers = (q1Answer, q2Answer) => {
  // Primary mapping based on pain point (Q1)
  const painPointMap = {
    brain_fog: 'clarity_starter',
    scrolling: 'digital_detox',
    anxious: 'calm_ground',
    lonely: 'connection_rebuild'
  };

  // Secondary mapping based on time of day (Q2)
  const timeOfDayMap = {
    morning: 'morning_momentum',
    afternoon: 'focus_builder',
    evening: 'evening_reset'
  };

  // Prefer pain point mapping, fallback to time of day
  const bundleId = painPointMap[q1Answer] || timeOfDayMap[q2Answer] || 'clarity_starter';

  return TASK_BUNDLES[bundleId];
};

/**
 * Get all available bundles as array
 * @returns {Array} - Array of bundle objects
 */
export const getAllBundles = () => {
  return Object.values(TASK_BUNDLES);
};

/**
 * Get bundle by ID
 * @param {string} bundleId - Bundle identifier
 * @returns {object|null} - Task bundle object or null
 */
export const getBundleById = (bundleId) => {
  return TASK_BUNDLES[bundleId] || null;
};

// Diagnostic question definitions
export const DIAGNOSTIC_QUESTIONS = {
  q1: {
    id: 'q1',
    question: 'What brings you here today?',
    header: 'Your Goal',
    options: [
      {
        value: 'brain_fog',
        label: 'Brain Fog & Can\'t Focus',
        emoji: '🌫️',
        description: 'Difficulty concentrating, mental fatigue, scattered thoughts'
      },
      {
        value: 'scrolling',
        label: 'Scrolling Too Much',
        emoji: '📱',
        description: 'Phone addiction, endless scrolling, feeling numb'
      },
      {
        value: 'anxious',
        label: 'Anxious & Overwhelmed',
        emoji: '😰',
        description: 'Stress, anxiety, feeling out of control'
      },
      {
        value: 'lonely',
        label: 'Lonely & Disconnected',
        emoji: '😔',
        description: 'Isolated, lacking real connections, socially withdrawn'
      }
    ]
  },

  q2: {
    id: 'q2',
    question: 'What time of day feels hardest?',
    header: 'Challenge Time',
    options: [
      {
        value: 'morning',
        label: 'Morning',
        emoji: '🌅',
        description: 'Hard to get started, low motivation, struggle to wake up'
      },
      {
        value: 'afternoon',
        label: 'Afternoon',
        emoji: '☀️',
        description: 'Energy crashes, procrastination peaks, focus fades'
      },
      {
        value: 'evening',
        label: 'Evening',
        emoji: '🌙',
        description: 'Doom scrolling, can\'t wind down, sleep issues'
      }
    ]
  }
};
