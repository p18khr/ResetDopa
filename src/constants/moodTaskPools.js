// src/constants/moodTaskPools.js
// Mood-specific task pools for dynamic task generation

export const MOOD_TASK_POOLS = {
  stressed: [
    'Breathwork 5 min',
    'Breathwork 10 min',
    'Meditation 10 min',
    'Meditation 15 min',
    'Gratitude list (3 lines)',
    'Gratitude list',
    'Nature observation 5 min',
    'Nature observation',
    '5 min stretching/yoga',
    '5 min yoga',
    '5 min stretching',
    'Write 1 fear + response',
    'Write fear + response',
    'Sit still 3 min',
    'Sit still 3 min silence',
    '10-15 min walk'
  ],

  tired: [
    '10-15 min walk',
    'Dance to 1 song',
    'Cold face splash',
    'Cold shower',
    'Drink water first thing',
    'Drink water first',
    'Clean a small area',
    'Clean area',
    'Clean small area',
    '30 push-ups',
    '5 min stretching/yoga',
    '5 min yoga',
    'Nature observation 5 min',
    'Nature observation',
    'Make bed',
    '10 min sunlight'
  ],

  scattered: [
    '25-min Pomodoro work',
    '25-min Pomodoro',
    'Prioritize top 1 task',
    'Prioritize top task',
    'Write 3 intentions',
    'Study without music 15 min',
    'Study without music',
    'Remove phone 1 hour',
    'Ask "What am I avoiding?"',
    'Ask "What avoiding?"',
    'Pause and identify what you\'re avoiding',
    'Read 10 pages',
    'Meditation 10 min',
    'Breathwork 5 min',
    'No phones first 30 min'
  ],

  good: [
    'Call friend/family 10 min',
    'Call friend/family',
    'Help someone',
    'Compliment someone',
    'Learn something new 15 min',
    'Learn new thing 15 min',
    'Learn new 15 min',
    'Draw/write/music 10 min',
    'Draw/write 10 min',
    'Cook a meal',
    'Cook meal',
    'Device-free meal',
    'Speak to 1 person IRL',
    'Speak to person IRL',
    '25-min Pomodoro work',
    'Read 10 pages'
  ],

  numb: [
    'Dance to 1 song',
    '10-15 min walk',
    '30 push-ups',
    'Cold shower',
    'Cold face splash',
    'Call friend/family 10 min',
    'Call friend/family',
    'Speak to 1 person IRL',
    'Speak to person IRL',
    'Cook a meal',
    'Cook meal',
    'Draw/write/music 10 min',
    'Draw/write 10 min',
    'Learn something new 15 min',
    'Compliment someone',
    'Help someone'
  ],

  calm: [
    'Meditation 10 min',
    'Meditation 15 min',
    'Read 10 pages',
    'Nature observation 5 min',
    'Nature observation',
    'Gratitude list (3 lines)',
    'Gratitude list',
    'Journal 5 sentences',
    'Write a win of the day',
    'Write win of the day',
    'Write win of day',
    'Learn something new 15 min',
    'Draw/write/music 10 min',
    '5 min stretching/yoga',
    '5 min yoga'
  ],

  foggy: [
    'Cold face splash',
    'Cold shower',
    'Breathwork 5 min',
    '10 min sunlight',
    '10-15 min walk',
    'Drink water first thing',
    'Drink water first',
    '30 push-ups',
    'Dance to 1 song',
    'Write 3 intentions',
    'Prioritize top 1 task',
    'Prioritize top task',
    '25-min Pomodoro work',
    'Meditation 5 min',
    'No phones first 30 min'
  ],

  anxious: [
    'Breathwork 10 min',
    'Breathwork 5 min',
    'Meditation 10 min',
    'Meditation 15 min',
    'Gratitude list (3 lines)',
    'Gratitude list',
    '5 min stretching/yoga',
    '5 min yoga',
    '5 min stretching',
    'Nature observation 5 min',
    'Nature observation',
    '10-15 min walk',
    'Write 1 fear + response',
    'Write fear + response',
    'Sit still 3 min silence',
    'Journal 5 sentences'
  ]
};

// Mood display configuration
export const MOOD_OPTIONS = [
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '😰',
    color: '#EF4444',
    description: 'Feeling pressure and tension'
  },
  {
    id: 'tired',
    label: 'Tired',
    emoji: '😴',
    color: '#6B7280',
    description: 'Low energy, need a boost'
  },
  {
    id: 'scattered',
    label: 'Scattered',
    emoji: '🤯',
    color: '#F59E0B',
    description: 'Unfocused, can\'t concentrate'
  },
  {
    id: 'good',
    label: 'Feeling Good',
    emoji: '😊',
    color: '#10B981',
    description: 'Positive and energized'
  },
  {
    id: 'numb',
    label: 'Numb',
    emoji: '😶',
    color: '#9CA3AF',
    description: 'Disconnected, feeling flat'
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    color: '#3B82F6',
    description: 'Peaceful and centered'
  },
  {
    id: 'foggy',
    label: 'Brain Fog',
    emoji: '🌫️',
    color: '#8B5CF6',
    description: 'Mental cloudiness'
  },
  {
    id: 'anxious',
    label: 'Anxious',
    emoji: '😟',
    color: '#F97316',
    description: 'Worried and on edge'
  }
];

/**
 * Get tasks for a specific mood
 * @param {string} mood - Mood identifier
 * @returns {Array} - Array of task names
 */
export const getTasksForMood = (mood) => {
  return MOOD_TASK_POOLS[mood] || MOOD_TASK_POOLS.good;
};

/**
 * Get random tasks from mood pool
 * @param {string} mood - Mood identifier
 * @param {number} count - Number of tasks to select
 * @param {Array} excludeTasks - Tasks to exclude (e.g., core habits)
 * @returns {Array} - Array of randomly selected task names
 */
export const selectRandomTasksForMood = (mood, count, excludeTasks = []) => {
  const pool = getTasksForMood(mood);
  const availableTasks = pool.filter(task => !excludeTasks.includes(task));

  // Shuffle and select
  const shuffled = [...availableTasks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Get mood option by ID
 * @param {string} moodId - Mood identifier
 * @returns {object|null} - Mood option object or null
 */
export const getMoodOption = (moodId) => {
  return MOOD_OPTIONS.find(m => m.id === moodId) || null;
};
