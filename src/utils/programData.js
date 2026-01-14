// src/utils/programData.js
// Export shared program tasks and explanations for Program and Dashboard

export const TASK_EXPLANATIONS = {
  '10 min sunlight': 'Boosts serotonin → improves baseline dopamine',
  'Make bed': 'Identity-shaping + early win',
  'Cold face splash': 'Lowers stress response',
  'Cold shower': 'Lowers stress response',
  'Drink water first thing': 'Physical reset',
  'Drink water first': 'Physical reset',
  'No phones first 30 min': 'Discipline foundation',
  'Write 3 intentions': 'Clarity & planning',
  'Breathwork 5 min': 'Regulate stress & impulsivity',
  'Breathwork 10 min': 'Regulate stress & impulsivity',
  '10-15 min walk': 'Resets dopamine baseline & improves mood',
  '30 push-ups': 'Urgency release',
  '5 min stretching/yoga': 'Grounding',
  '5 min stretching': 'Grounding',
  '5 min yoga': 'Grounding',
  'Dance to 1 song': 'Increases serotonin naturally',
  'Clean a small area': 'Visible progress feeling',
  'Clean area': 'Visible progress feeling',
  'Clean small area': 'Visible progress feeling',
  '25-min Pomodoro work': 'Builds focus muscle',
  '25-min Pomodoro': 'Builds focus muscle',
  '25-min Pomodoro x2': 'Builds focus muscle intensely',
  '25-min Pomodoro x3': 'Maximum focus training',
  'Prioritize top 1 task': 'Removes overwhelm',
  'Prioritize top task': 'Removes overwhelm',
  'Remove phone 1 hour': 'Reduces temptation',
  'Read 10 pages': 'Builds cognitive stamina',
  'Study without music 15 min': 'Increases mental discomfort tolerance',
  'Study without music': 'Increases mental discomfort tolerance',
  'Meditation 5 min': 'Strengthens prefrontal cortex',
  'Meditation 10 min': 'Strengthens prefrontal cortex',
  'Meditation 15 min': 'Strengthens prefrontal cortex',
  'Gratitude list (3 lines)': 'Increases baseline pleasure',
  'Gratitude list': 'Increases baseline pleasure',
  'Journal 5 sentences': 'Emotional clarity',
  'Pause and identify what you\'re avoiding': 'Catch avoidance patterns before they control you',
  'Ask "What am I avoiding?"': 'Catch avoidance patterns before they control you',
  'Ask "What avoiding?"': 'Catch avoidance patterns before they control you',
  'Write 1 fear + response': 'Stress processing',
  'Write fear + response': 'Stress processing',
  'Sit still 3 min': 'Discomfort tolerance building',
  'Sit still 3 min silence': 'Discomfort tolerance building',
  'Call friend/family 10 min': 'Natural dopamine source',
  'Call friend/family': 'Natural dopamine source',
  'Speak to 1 person IRL': 'Social skill realignment',
  'Speak to person IRL': 'Social skill realignment',
  'Compliment someone': 'Prosocial reward',
  'Device-free meal': 'Presence & awareness',
  'Delete 5 useless apps': 'Reduce triggers',
  'Delete 5 apps': 'Reduce triggers',
  'Delete apps': 'Reduce triggers',
  'Turn off notifications': 'Stop dopamine hits',
  'Remove SM from home screen': 'Friction',
  'Remove SM from home': 'Friction',
  '2-hour no-phone block': 'Discipline',
  '2-hour no-phone': 'Discipline',
  'No-phone block 2 hours': 'Discipline',
  'No scrolling after 9pm': 'Sleep & regulation',
  'Draw/write/music 10 min': 'Real dopamine',
  'Draw/write 10 min': 'Real dopamine',
  'Learn something new 15 min': 'Growth reward',
  'Learn new thing 15 min': 'Growth reward',
  'Learn new 15 min': 'Growth reward',
  'Cook a meal': 'Sensory grounding',
  'Cook meal': 'Sensory grounding',
  'Nature observation 5 min': 'Parasympathetic activation',
  'Nature observation': 'Parasympathetic activation',
  'Review streak': 'Self-belief',
  'Write a win of the day': 'Memory encoding',
  'Write win of the day': 'Memory encoding',
  'Write win of day': 'Memory encoding',
  'Help someone': 'Purpose',
  'Affirmation practice': 'Neural rewiring',
  'Celebrate 7-day streak': 'Milestone reinforcement',
  'Set week 2 intentions': 'Direction setting',
  'Celebrate 2 weeks': 'Progress acknowledgment',
  'Set week 3 goals': 'Momentum building',
  'Celebrate 3 weeks!': 'Major milestone',
  'Set week 4 goals': 'Final push preparation',
  'Celebrate 4 weeks!': 'Month achievement',
  'All morning tasks': 'Complete morning routine mastery',
  'Journal journey reflection': 'Integration & learning',
  'Review all achievements': 'Identity solidification',
  'Full body workout': 'Physical excellence',
  'Write full journey story': 'Narrative transformation',
  'Gratitude for 30 days': 'Appreciation practice',
  'Celebrate with loved ones': 'Social reward',
  'Plan next 30 days': 'Continuous growth',
  'Journal week review': 'Weekly integration',
  'Review full week': 'Weekly reflection',
};

// Keep static day titles & legacy milestone tasks for labeling; tasks will be dynamically generated.
export const PROGRAM_DAY_TITLES = [
  {
    day: 1,
    title: 'Foundation & Awareness',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Drink water first thing', points: 2, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Meditation 5 min', points: 6, category: '🧠 Mind' },
      { task: 'Gratitude list (3 lines)', points: 5, category: '🧠 Mind' },
      { task: 'Journal 5 sentences', points: 5, category: '🧠 Mind' },
      { task: 'Delete 5 useless apps', points: 8, category: '🎧 Detox' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' },
      { task: 'No scrolling after 9pm', points: 7, category: '🎧 Detox' }
    ]
  },
  {
    day: 2,
    title: 'Morning Reset Power',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold face splash', points: 4, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: 'Clean a small area', points: 4, category: '💪 Physical' },
      { task: 'Ask "What am I avoiding?"', points: 5, category: '🧠 Mind' },
      { task: '25-min Pomodoro work', points: 8, category: '🎯 Focus' },
      { task: 'Turn off notifications', points: 7, category: '🎧 Detox' },
      { task: 'Write a win of the day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 3,
    title: 'Focus & Discipline',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '5 min stretching/yoga', points: 5, category: '💪 Physical' },
      { task: 'Prioritize top 1 task', points: 6, category: '🎯 Focus' },
      { task: 'Remove phone 1 hour', points: 8, category: '🎯 Focus' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'No-phone block 2 hours', points: 9, category: '🎧 Detox' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 4,
    title: 'Social Connection',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Cold shower/splash', points: 4, category: '🌅 Morning' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Call friend/family 10 min', points: 8, category: '🌿 Social' },
      { task: 'Compliment someone', points: 4, category: '🌿 Social' },
      { task: 'Device-free meal', points: 6, category: '🌿 Social' },
      { task: '25-min Pomodoro', points: 8, category: '🎯 Focus' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 5,
    title: 'Creative Expression',
    tasks: [
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Draw/write/music 10 min', points: 7, category: '🎨 Creative' },
      { task: 'Learn something new 15 min', points: 7, category: '🎨 Creative' },
      { task: 'Cook a meal', points: 6, category: '🎨 Creative' },
      { task: 'Study without music 15 min', points: 7, category: '🎯 Focus' },
      { task: 'Write 1 fear + response', points: 6, category: '🧠 Mind' },
      { task: 'Remove SM from home screen', points: 8, category: '🎧 Detox' },
      { task: 'Help someone', points: 5, category: '🎁 Identity' }
    ]
  },
  {
    day: 6,
    title: 'Deep Work Day',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: '25-min Pomodoro x2', points: 10, category: '🎯 Focus' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'Remove phone 1 hour', points: 8, category: '🎯 Focus' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Journal 5 sentences', points: 5, category: '🧠 Mind' },
      { task: 'Write win of the day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 7,
    title: 'Week 1 Review',
    tasks: [
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Review full week', points: 8, category: '🎁 Identity' },
      { task: 'Celebrate 7-day streak', points: 10, category: '🎁 Identity' },
      { task: 'No scrolling after 9pm', points: 7, category: '🎧 Detox' },
      { task: 'Set week 2 intentions', points: 6, category: '🎁 Identity' }
    ]
  },
  {
    day: 8,
    title: 'Discomfort Training',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold face splash', points: 4, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '5 min yoga/stretch', points: 5, category: '💪 Physical' },
      { task: 'Sit still 3 min silence', points: 6, category: '🧠 Mind' },
      { task: 'Study without music 15 min', points: 7, category: '🎯 Focus' },
      { task: 'Ask "What am I avoiding?"', points: 5, category: '🧠 Mind' },
      { task: '2-hour no-phone block', points: 9, category: '🎧 Detox' },
      { task: 'Nature observation 5 min', points: 5, category: '🎨 Creative' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 9,
    title: 'Physical Power',
    tasks: [
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Drink water first', points: 2, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: '5 min stretching', points: 5, category: '💪 Physical' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: '25-min Pomodoro', points: 8, category: '🎯 Focus' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 10,
    title: 'Mental Clarity',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Clean small area', points: 4, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Journal 5 sentences', points: 5, category: '🧠 Mind' },
      { task: 'Write 1 fear + response', points: 6, category: '🧠 Mind' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'Turn off notifications', points: 7, category: '🎧 Detox' },
      { task: 'Write win of day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 11,
    title: 'Social & Real',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Speak to 1 person IRL', points: 6, category: '🌿 Social' },
      { task: 'Compliment someone', points: 4, category: '🌿 Social' },
      { task: 'Device-free meal', points: 6, category: '🌿 Social' },
      { task: 'Call friend/family', points: 8, category: '🌿 Social' },
      { task: 'Prioritize top task', points: 6, category: '🎯 Focus' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Help someone', points: 5, category: '🎁 Identity' }
    ]
  },
  {
    day: 12,
    title: 'Creative Flow',
    tasks: [
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Cold shower/splash', points: 4, category: '🌅 Morning' },
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Draw/write 10 min', points: 7, category: '🎨 Creative' },
      { task: 'Learn new thing 15 min', points: 7, category: '🎨 Creative' },
      { task: 'Cook a meal', points: 6, category: '🎨 Creative' },
      { task: '25-min Pomodoro', points: 8, category: '🎯 Focus' },
      { task: 'No scrolling after 9pm', points: 7, category: '🎧 Detox' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 13,
    title: 'Digital Detox Deep',
    tasks: [
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: 'Delete 5 apps', points: 8, category: '🎧 Detox' },
      { task: 'Remove SM from home', points: 8, category: '🎧 Detox' },
      { task: '2-hour no-phone', points: 9, category: '🎧 Detox' },
      { task: 'Remove phone 1 hour', points: 8, category: '🎯 Focus' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 14,
    title: 'Week 2 Review',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '5 min yoga', points: 5, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Journal week review', points: 8, category: '🧠 Mind' },
      { task: 'Celebrate 2 weeks', points: 10, category: '🎁 Identity' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'Set week 3 goals', points: 6, category: '🎁 Identity' }
    ]
  },
  {
    day: 15,
    title: 'Habit Reinforcement',
    tasks: [
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: '25-min Pomodoro x2', points: 10, category: '🎯 Focus' },
      { task: 'Study without music', points: 7, category: '🎯 Focus' },
      { task: 'Ask "What avoiding?"', points: 5, category: '🧠 Mind' },
      { task: 'Write win of day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 16,
    title: 'Physical Excellence',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: 'Drink water first', points: 2, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: '5 min stretching', points: 5, category: '💪 Physical' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Nature observation', points: 5, category: '🎨 Creative' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 17,
    title: 'Mind Mastery',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Journal 5 sentences', points: 5, category: '🧠 Mind' },
      { task: 'Sit still 3 min', points: 6, category: '🧠 Mind' },
      { task: 'Write fear + response', points: 6, category: '🧠 Mind' },
      { task: 'Turn off notifications', points: 7, category: '🎧 Detox' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 18,
    title: 'Social Strength',
    tasks: [
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Call friend/family', points: 8, category: '🌿 Social' },
      { task: 'Speak to person IRL', points: 6, category: '🌿 Social' },
      { task: 'Compliment someone', points: 4, category: '🌿 Social' },
      { task: 'Device-free meal', points: 6, category: '🌿 Social' },
      { task: '25-min Pomodoro', points: 8, category: '🎯 Focus' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Help someone', points: 5, category: '🎁 Identity' }
    ]
  },
  {
    day: 19,
    title: 'Creative Energy',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Draw/write 10 min', points: 7, category: '🎨 Creative' },
      { task: 'Learn new 15 min', points: 7, category: '🎨 Creative' },
      { task: 'Cook meal', points: 6, category: '🎨 Creative' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'No scrolling after 9pm', points: 7, category: '🎧 Detox' },
      { task: 'Write win of day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 20,
    title: 'Focus Power',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: 'Prioritize top task', points: 6, category: '🎯 Focus' },
      { task: '25-min Pomodoro x2', points: 10, category: '🎯 Focus' },
      { task: 'Remove phone 1 hour', points: 8, category: '🎯 Focus' },
      { task: 'Study without music', points: 7, category: '🎯 Focus' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 21,
    title: 'Week 3 Milestone',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '5 min yoga', points: 5, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Journal week review', points: 8, category: '🧠 Mind' },
      { task: 'Celebrate 3 weeks!', points: 12, category: '🎁 Identity' },
      { task: '2-hour no-phone', points: 9, category: '🎧 Detox' },
      { task: 'Set week 4 goals', points: 6, category: '🎁 Identity' }
    ]
  },
  {
    day: 22,
    title: 'Mastery Building',
    tasks: [
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: '25-min Pomodoro x2', points: 10, category: '🎯 Focus' },
      { task: 'Ask "What avoiding?"', points: 5, category: '🧠 Mind' },
      { task: 'Delete apps', points: 8, category: '🎧 Detox' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 23,
    title: 'Total Body',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: 'Drink water first', points: 2, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: '5 min stretching', points: 5, category: '💪 Physical' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: 'Nature observation', points: 5, category: '🎨 Creative' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' }
    ]
  },
  {
    day: 24,
    title: 'Mental Fortress',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: 'Sit still 3 min', points: 6, category: '🧠 Mind' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Journal 5 sentences', points: 5, category: '🧠 Mind' },
      { task: 'Write fear + response', points: 6, category: '🧠 Mind' },
      { task: 'Study without music', points: 7, category: '🎯 Focus' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' },
      { task: 'Turn off notifications', points: 7, category: '🎧 Detox' },
      { task: 'Write win of day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 25,
    title: 'Connection Day',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Call friend/family', points: 8, category: '🌿 Social' },
      { task: 'Speak to person IRL', points: 6, category: '🌿 Social' },
      { task: 'Compliment someone', points: 4, category: '🌿 Social' },
      { task: 'Device-free meal', points: 6, category: '🌿 Social' },
      { task: 'Help someone', points: 5, category: '🎁 Identity' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Review streak', points: 3, category: '🎁 Identity' }
    ]
  },
  {
    day: 26,
    title: 'Creative Peak',
    tasks: [
      { task: 'Make bed', points: 3, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: 'Breathwork 5 min', points: 6, category: '🌅 Morning' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Draw/write 10 min', points: 7, category: '🎨 Creative' },
      { task: 'Learn new 15 min', points: 7, category: '🎨 Creative' },
      { task: 'Cook meal', points: 6, category: '🎨 Creative' },
      { task: 'Nature observation', points: 5, category: '🎨 Creative' },
      { task: 'No scrolling after 9pm', points: 7, category: '🎧 Detox' },
      { task: 'Affirmation practice', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 27,
    title: 'Maximum Focus',
    tasks: [
      { task: 'Write 3 intentions', points: 5, category: '🌅 Morning' },
      { task: 'No phones first 30 min', points: 6, category: '🌅 Morning' },
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Clean area', points: 4, category: '💪 Physical' },
      { task: 'Prioritize top task', points: 6, category: '🎯 Focus' },
      { task: '25-min Pomodoro x3', points: 12, category: '🎯 Focus' },
      { task: 'Remove phone 1 hour', points: 8, category: '🎯 Focus' },
      { task: 'Study without music', points: 7, category: '🎯 Focus' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Write win of day', points: 4, category: '🎁 Identity' }
    ]
  },
  {
    day: 28,
    title: 'Week 4 Review',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower', points: 4, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '5 min yoga', points: 5, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Gratitude list', points: 5, category: '🧠 Mind' },
      { task: 'Journal week review', points: 8, category: '🧠 Mind' },
      { task: 'Celebrate 4 weeks!', points: 15, category: '🎁 Identity' },
      { task: '2-hour no-phone', points: 9, category: '🎧 Detox' },
      { task: 'Read 10 pages', points: 6, category: '🎯 Focus' }
    ]
  },
  {
    day: 29,
    title: 'Final Push',
    tasks: [
      { task: 'All morning tasks', points: 10, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: '30 push-ups', points: 5, category: '💪 Physical' },
      { task: 'Dance to 1 song', points: 5, category: '💪 Physical' },
      { task: 'Meditation 10 min', points: 7, category: '🧠 Mind' },
      { task: 'Journal journey reflection', points: 10, category: '🧠 Mind' },
      { task: '25-min Pomodoro x2', points: 10, category: '🎯 Focus' },
      { task: 'Call friend/family', points: 8, category: '🌿 Social' },
      { task: 'Help someone', points: 5, category: '🎁 Identity' },
      { task: 'Review all achievements', points: 8, category: '🎁 Identity' }
    ]
  },
  {
    day: 30,
    title: '🏆 COMPLETION DAY',
    tasks: [
      { task: '10 min sunlight', points: 5, category: '🌅 Morning' },
      { task: 'Cold shower celebration', points: 4, category: '🌅 Morning' },
      { task: 'Breathwork 10 min', points: 8, category: '🌅 Morning' },
      { task: '10-15 min walk', points: 6, category: '💪 Physical' },
      { task: 'Full body workout', points: 10, category: '💪 Physical' },
      { task: 'Meditation 15 min', points: 10, category: '🧠 Mind' },
      { task: 'Write full journey story', points: 15, category: '🧠 Mind' },
      { task: 'Gratitude for 30 days', points: 10, category: '🧠 Mind' },
      { task: 'Celebrate with loved ones', points: 10, category: '🌿 Social' },
      { task: 'Plan next 30 days', points: 10, category: '🎁 Identity' }
    ]
  }
];

// Task pools for dynamic generation (each has friction and domain already in TASK_METADATA)
export const TASK_POOLS = [
  '10 min sunlight','Make bed','Drink water first thing','No phones first 30 min','Cold face splash','Cold shower',
  'Breathwork 5 min','Meditation 5 min','Meditation 10 min','Gratitude list','Journal 5 sentences','Ask "What avoiding?"',
  '10-15 min walk','5 min stretching','30 push-ups','Dance to 1 song','Clean area','Prioritize top task','25-min Pomodoro','25-min Pomodoro x2','25-min Pomodoro x3',
  'Remove phone 1 hour','Read 10 pages','Study without music','Turn off notifications','Delete 5 apps','Remove SM from home','2-hour no-phone','No scrolling after 9pm',
  'Draw/write 10 min','Learn new 15 min','Cook meal','Nature observation','Sit still 3 min','Write fear + response','Write win of day','Affirmation practice','Help someone','Review streak'
];

// Milestone extras appended on specific days
export const MILESTONE_EXTRAS = {
  7: ['Review full week','Celebrate 7-day streak','Set week 2 intentions'],
  14: ['Journal week review','Celebrate 2 weeks','Set week 3 goals'],
  21: ['Journal week review','Celebrate 3 weeks!','Set week 4 goals'],
  28: ['Journal week review','Celebrate 4 weeks!'],
  29: ['Review all achievements','Journal journey reflection'],
  30: ['Write full journey story','Celebrate with loved ones','Plan next 30 days']
};

// Domain to emoji category mapping for display
const DOMAIN_CATEGORY_MAP = {
  morning: '🌅 Morning',
  mind: '🧠 Mind',
  physical: '💪 Physical',
  focus: '🎯 Focus',
  detox: '🎧 Detox',
  social: '🌿 Social',
  creative: '🎨 Creative',
  identity: '🎁 Identity'
};

// Assign base points by friction
const frictionPoints = { low: 5, med: 7, high: 10 };

// Generate tasks for a given day based on week1 picks & adherence
export function generateDayTasks(day, week1Picks = [], adherence = 0) {
  const picksCanonical = week1Picks.map(p => getCanonicalTask(p));
  // Target task counts ramp
  let target = day <= 7 ? 8 : day <= 14 ? 9 : day <= 21 ? 10 : 10;
  if (adherence < 0.5) target = Math.max(6, target - 2);
  const allowHigh = adherence >= 0.8 && day > 7; // don't push high friction in week1

  // Build pool objects
  const poolObjects = TASK_POOLS.map(t => {
    const meta = TASK_METADATA[getCanonicalTask(t)] || { friction: 'med', domain: 'focus' };
    return { title: t, meta };
  });

  // Day-seeded deterministic shuffle to vary order per day while stable within a day
  const hashStr = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0; // 32-bit
    }
    return Math.abs(h);
  };
  const daySeed = String(day);
  poolObjects.sort((a, b) => (hashStr(a.title + '|' + daySeed) % 100000) - (hashStr(b.title + '|' + daySeed) % 100000));

  const chosen = [];
  const usedTitles = new Set();
  const usedDomains = new Set();

  // Include week1 picks as anchors on days 1-7
  if (day <= 7 && picksCanonical.length) {
    picksCanonical.slice(0, 5).forEach(title => {
      const meta = TASK_METADATA[title] || { friction: 'low', domain: 'focus' };
      if (!usedTitles.has(title)) {
        chosen.push({ task: title, points: frictionPoints[meta.friction] || 5, category: DOMAIN_CATEGORY_MAP[meta.domain] || '🎯 Focus' });
        usedTitles.add(title); usedDomains.add(meta.domain);
      }
    });
  }

  // Selection strategy: try to diversify domains then fill remaining by friction rule
  const domainQuota = Math.min(5, target - chosen.length); // aim for up to 5 distinct domains

  // First pass: add one task per new domain (low/med friction first week, allow high later if allowHigh)
  for (const item of poolObjects) {
    if (chosen.length >= target) break;
    const { title, meta } = item;
    const canonical = getCanonicalTask(title);
    if (usedTitles.has(canonical)) continue;
    if (!allowHigh && meta.friction === 'high') continue;
    if (usedDomains.size < domainQuota && usedDomains.has(meta.domain)) continue; // seek diversity for initial domain fill
    chosen.push({ task: title, points: frictionPoints[meta.friction] || 5, category: DOMAIN_CATEGORY_MAP[meta.domain] || '🎯 Focus' });
    usedTitles.add(canonical); usedDomains.add(meta.domain);
  }

  // Second pass: fill remaining slots (include high friction if allowed)
  for (const item of poolObjects) {
    if (chosen.length >= target) break;
    const { title, meta } = item;
    const canonical = getCanonicalTask(title);
    if (usedTitles.has(canonical)) continue;
    if (!allowHigh && meta.friction === 'high') continue;
    chosen.push({ task: title, points: frictionPoints[meta.friction] || 5, category: DOMAIN_CATEGORY_MAP[meta.domain] || '🎯 Focus' });
    usedTitles.add(canonical); usedDomains.add(meta.domain);
  }

  // Milestone extras appended (do not count toward target to avoid losing anchors)
  if (MILESTONE_EXTRAS[day]) {
    MILESTONE_EXTRAS[day].forEach(extra => {
      if (!usedTitles.has(getCanonicalTask(extra))) {
        const meta = TASK_METADATA[getCanonicalTask(extra)] || { friction: 'med', domain: 'identity' };
        chosen.push({ task: extra, points: frictionPoints[meta.friction] || 7, category: DOMAIN_CATEGORY_MAP[meta.domain] || '🎁 Identity' });
        usedTitles.add(getCanonicalTask(extra));
      }
    });
  }

  return chosen;
}

// Map variant task strings to a single canonical form (keep UX flexible)
export const TASK_ALIASES = {
  'Drink water first': 'Drink water first thing',
  'Clean a small area': 'Clean area',
  'Clean small area': 'Clean area',
  '5 min stretching/yoga': '5 min stretching',
  '5 min yoga': '5 min stretching',
  'Draw/write/music 10 min': 'Draw/write 10 min',
  'Learn something new 15 min': 'Learn new 15 min',
  'Learn new thing 15 min': 'Learn new 15 min',
  'Study without music 15 min': 'Study without music',
  'Call friend/family 10 min': 'Call friend/family',
  'Speak to 1 person IRL': 'Speak to person IRL',
  'Sit still 3 min silence': 'Sit still 3 min',
  'Ask "What am I avoiding?"': 'Ask "What avoiding?"',
  'Write 1 fear + response': 'Write fear + response',
  'Write win of the day': 'Write win of day',
  'Write a win of the day': 'Write win of day',
  'Review full week': 'Journal week review',
  'Delete 5 useless apps': 'Delete 5 apps',
  '2-hour no-phone block': '2-hour no-phone',
  'No-phone block 2 hours': '2-hour no-phone',
  'Cold shower/splash': 'Cold shower',
  'Nature observation 5 min': 'Nature observation',
};

// Resolve a task to its canonical representative
export const getCanonicalTask = (title) => {
  return TASK_ALIASES[title] || title;
};

// Provide explanation using canonical resolution, falling back to direct match
export const getTaskExplanation = (title) => {
  if (TASK_EXPLANATIONS[title]) return TASK_EXPLANATIONS[title];
  const canonical = getCanonicalTask(title);
  return TASK_EXPLANATIONS[canonical] || null;
};

// Concise benefit-focused explanations (avoid jargon)
export const TASK_BENEFITS = {
  '10 min sunlight': 'Boosts alertness and sets body clock',
  'Make bed': 'Quick tidy to start with control',
  'Drink water first thing': 'Hydrates and signals a fresh start',
  'No phones first 30 min': 'Protects focus at the start of day',
  'Cold face splash': 'Rapid reset to break urge loop',
  'Cold shower': 'Energizes and builds resilience',
  'Breathwork 5 min': 'Calms the nervous system',
  'Breathwork 10 min': 'Extended calm and nervous system reset',
  'Meditation 5 min': 'Trains attention and reduces stress',
  'Meditation 10 min': 'Deeper calm and clarity',
  'Meditation 15 min': 'Deep focus training for maximum mental clarity',
  '10-15 min walk': 'Increases energy and lifts mood',
  '5 min stretching': 'Releases tension and improves mobility',
  '30 push-ups': 'Quick strength burst for energy',
  'Clean area': 'Clears visual noise; easier to focus',
  'Prioritize top task': 'Removes indecision and guides action',
  'Dance to 1 song': 'Energizes mood and boosts serotonin naturally',
  '25-min Pomodoro': 'Creates a focused work block',
  '25-min Pomodoro x2': 'Sustained output with short breaks',
  '25-min Pomodoro x3': 'Maximum deep work endurance',
  'Read 10 pages': 'Builds knowledge and attention span',
  'Turn off notifications': 'Reduces interruptions and stress',
  'Delete 5 apps': 'Removes digital temptation at the source',
  'Remove SM from home': 'Cuts scrolling habits at the source',
  '2-hour no-phone': 'Long block for deep work or rest',
  'No scrolling after 9pm': 'Improves sleep and reduces anxiety',
  'Draw/write 10 min': 'Expresses ideas; unlocks creativity',
  'Learn new 15 min': 'Builds skill with small steps',
  'Cook meal': 'Mindful hands-on break; healthy fuel',
  'Nature observation': 'Resets attention; lowers stress',
  'Review streak': 'Reflects progress; boosts identity',
  'Gratitude list': 'Shifts mood toward baseline pleasure',
  'Journal 5 sentences': 'Processes emotions and builds clarity',
  'Pause and identify what you\'re avoiding': 'Builds emotional awareness and distress tolerance',
  'Write fear + response': 'Processes anxiety and reduces rumination',
  'Call friend/family': 'Creates genuine social connection and support',
  'Speak to person IRL': 'Builds social confidence and real connection',
  'Compliment someone': 'Boosts mood through prosocial action',
  'Device-free meal': 'Increases presence and digestion quality',
  'Write win of day': 'Anchors progress in memory and identity',
  'Help someone': 'Creates purpose and meaningful contribution',
  'Affirmation practice': 'Rewires self-talk toward self-compassion',
};

export const getTaskBenefit = (title) => {
  const canonical = getCanonicalTask(title);
  return TASK_BENEFITS[canonical] || null;
};

// Science-backed blurbs per task (concise). Fallback used when absent.
export const TASK_STUDIES = {
  '10 min sunlight': 'Morning light helps entrain circadian rhythms and supports cortisol awakening, improving alertness and mood.',
  'Make bed': 'Small, reliable habits build identity and reduce decision friction, supporting broader habit formation.',
  'Cold face splash': 'Brief cold exposure can increase noradrenaline and modulate stress responses; quick sensory reset reduces urge cycles.',
  'Cold shower': 'Short cold exposure elevates catecholamines and can improve stress resilience through controlled discomfort.',
  'Drink water first thing': 'Hydration after sleep aids autonomic regulation and energy; simple cues anchor healthy routines.',
  'No phones first 30 min': 'Reducing early dopaminergic cues prevents attentional capture and lowers immediate distraction load.',
  'Write 3 intentions': 'Implementation intentions increase goal adherence by pre-committing context and next steps.',
  'Breathwork 5 min': 'Slow diaphragmatic breathing activates parasympathetic pathways, lowering arousal and impulsivity.',
  'Breathwork 10 min': 'Extended breathwork deepens vagal activation, increasing stress resilience and emotional regulation over time.',
  'Meditation 5 min': 'Even brief meditation activates the default mode network and strengthens prefrontal-limbic connections.',
  'Meditation 10 min': 'Brief mindfulness practice improves attention control and emotion regulation with consistent repetition.',
  'Meditation 15 min': 'Extended meditation produces neuroplastic changes in brain regions associated with self-referential processing and compassion.',
  '10-15 min walk': 'Light aerobic activity produces acute mood benefits and enhances executive function shortly after.',
  '5 min stretching': 'Mobility and interoceptive attention reduce muscle tension and support calm engagement.',
  '30 push-ups': 'Short, intense effort can increase arousal and redirect attention away from urges.',
  'Clean area': 'Reducing visual clutter lowers cognitive load and improves task initiation readiness.',
  'Prioritize top task': 'Prioritization lowers indecision and decision fatigue; clear first action improves follow-through.',
  'Dance to 1 song': 'Movement triggers dopamine and serotonin release; coordination engages reward pathways naturally without artificial stimuli.',
  '25-min Pomodoro': 'Time-boxing reduces procrastination and increases focused work by lowering task initiation barriers.',
  '25-min Pomodoro x2': 'Stacked focus blocks sustain output while breaks prevent depletion; supports deep work habits.',
  '25-min Pomodoro x3': 'Triple Pomodoro blocks train sustained attention and deep flow state, building intense focus capacity.',
  'Read 10 pages': 'Focused reading trains sustained attention and reduces habitual task switching.',
  'Turn off notifications': 'Fewer interruptions reduce context switching costs and stress, improving productivity.',
  'Delete 5 apps': 'Removing cues reduces environmental triggers for addictive behavior; friction engineering is effective addiction intervention.',
  'Remove SM from home': 'Making scrolling less immediately accessible increases activation energy and gives prefrontal cortex time to assert control.',
  '2-hour no-phone': 'Extended digital break reduces cue-driven behavior and supports deep work or restorative rest.',
  'No scrolling after 9pm': 'Evening screen reduction supports melatonin onset and sleep quality; lowers late-night impulsivity.',
  'Draw/write 10 min': 'Creative engagement produces intrinsic reward and can reduce cravings via absorbed attention.',
  'Learn new 15 min': 'Skill acquisition engages focused, effortful learning associated with healthier dopamine signaling.',
  'Cook meal': 'Hands-on, sensory tasks increase presence and reduce passive consumption patterns.',
  'Nature observation': 'Attention Restoration Theory: brief nature engagement replenishes directed attention and reduces stress.',
  'Review streak': 'Consistency reflection strengthens self-identity and increases motivation via evidence of progress.',
  'Gratitude list': 'Regular gratitude practice is linked to improved well-being and reduced stress markers.',
  'Journal 5 sentences': 'Expressive writing improves emotional processing and clarity, reducing rumination.',
  'Pause and identify what you\'re avoiding': 'Metacognitive awareness activates the prefrontal cortex and interrupts automatic avoidance loops; builds distress tolerance.',
  'Write fear + response': 'Externalizing anxiety through writing engages cognitive processing and reduces amygdala activation.',
  'Call friend/family': 'Real social connection activates oxytocin systems, providing natural dopamine without withdrawal.',
  'Speak to person IRL': 'Face-to-face interaction engages multiple sensory systems and vagal activation, building authentic social reward.',
  'Compliment someone': 'Prosocial behavior activates reward circuits (ventral striatum) through authentic connection.',
  'Device-free meal': 'Removing digital distraction improves digestion via parasympathetic activation and increases mindful eating reward.',
  'Write win of day': 'Memory encoding of positive experiences increases hippocampal dopamine and strengthens reward prediction.',
  'Help someone': 'Purpose-driven action activates meaning networks in the brain, providing deep dopamine (not hedonic spike).',
  'Affirmation practice': 'Self-affirming statements activate anterior prefrontal regions and reduce threat-related amygdala activation over time.',
};

export const getTaskScience = (title) => {
  const canonical = getCanonicalTask(title);
  return TASK_STUDIES[canonical] || 'Research shows small, consistent actions improve mood, focus, and impulse control by shaping routines and physiology.';
};

// Task metadata for recommendation logic
export const TASK_METADATA = {
  '10 min sunlight': { friction: 'low', domain: 'morning' },
  'Make bed': { friction: 'low', domain: 'morning' },
  'Drink water first thing': { friction: 'low', domain: 'morning' },
  'Drink water first': { friction: 'low', domain: 'morning' },
  'No phones first 30 min': { friction: 'low', domain: 'morning' },
  'Cold face splash': { friction: 'low', domain: 'morning' },
  'Cold shower': { friction: 'med', domain: 'morning' },
  'Breathwork 5 min': { friction: 'low', domain: 'mind' },
  'Breathwork 10 min': { friction: 'med', domain: 'mind' },
  'Meditation 5 min': { friction: 'low', domain: 'mind' },
  'Meditation 10 min': { friction: 'med', domain: 'mind' },
  'Meditation 15 min': { friction: 'high', domain: 'mind' },
  '10-15 min walk': { friction: 'low', domain: 'physical' },
  '30 push-ups': { friction: 'med', domain: 'physical' },
  '5 min stretching/yoga': { friction: 'low', domain: 'physical' },
  '5 min stretching': { friction: 'low', domain: 'physical' },
  '5 min yoga': { friction: 'low', domain: 'physical' },
  'Dance to 1 song': { friction: 'low', domain: 'physical' },
  'Clean a small area': { friction: 'low', domain: 'physical' },
  'Clean area': { friction: 'low', domain: 'physical' },
  'Clean small area': { friction: 'low', domain: 'physical' },
  '25-min Pomodoro work': { friction: 'med', domain: 'focus' },
  '25-min Pomodoro': { friction: 'med', domain: 'focus' },
  '25-min Pomodoro x2': { friction: 'high', domain: 'focus' },
  '25-min Pomodoro x3': { friction: 'high', domain: 'focus' },
  'Prioritize top 1 task': { friction: 'low', domain: 'focus' },
  'Prioritize top task': { friction: 'low', domain: 'focus' },
  'Remove phone 1 hour': { friction: 'med', domain: 'focus' },
  'Read 10 pages': { friction: 'med', domain: 'focus' },
  'Study without music 15 min': { friction: 'med', domain: 'focus' },
  'Study without music': { friction: 'med', domain: 'focus' },
  'Gratitude list (3 lines)': { friction: 'low', domain: 'mind' },
  'Gratitude list': { friction: 'low', domain: 'mind' },
  'Journal 5 sentences': { friction: 'low', domain: 'mind' },
  'Pause and identify what you\'re avoiding': { friction: 'low', domain: 'mind' },
  'Ask "What am I avoiding?"': { friction: 'low', domain: 'mind' },
  'Ask "What avoiding?"': { friction: 'low', domain: 'mind' },
  'Write 1 fear + response': { friction: 'med', domain: 'mind' },
  'Write fear + response': { friction: 'med', domain: 'mind' },
  'Sit still 3 min': { friction: 'low', domain: 'mind' },
  'Sit still 3 min silence': { friction: 'low', domain: 'mind' },
  'Call friend/family 10 min': { friction: 'med', domain: 'social' },
  'Call friend/family': { friction: 'med', domain: 'social' },
  'Speak to 1 person IRL': { friction: 'med', domain: 'social' },
  'Speak to person IRL': { friction: 'med', domain: 'social' },
  'Compliment someone': { friction: 'low', domain: 'social' },
  'Device-free meal': { friction: 'low', domain: 'social' },
  'Delete 5 useless apps': { friction: 'med', domain: 'detox' },
  'Delete 5 apps': { friction: 'med', domain: 'detox' },
  'Delete apps': { friction: 'med', domain: 'detox' },
  'Turn off notifications': { friction: 'low', domain: 'detox' },
  'Remove SM from home screen': { friction: 'low', domain: 'detox' },
  'Remove SM from home': { friction: 'low', domain: 'detox' },
  '2-hour no-phone block': { friction: 'high', domain: 'detox' },
  '2-hour no-phone': { friction: 'high', domain: 'detox' },
  'No-phone block 2 hours': { friction: 'high', domain: 'detox' },
  'No scrolling after 9pm': { friction: 'low', domain: 'detox' },
  'Draw/write/music 10 min': { friction: 'low', domain: 'creative' },
  'Draw/write 10 min': { friction: 'low', domain: 'creative' },
  'Learn something new 15 min': { friction: 'med', domain: 'creative' },
  'Learn new thing 15 min': { friction: 'med', domain: 'creative' },
  'Learn new 15 min': { friction: 'med', domain: 'creative' },
  'Cook a meal': { friction: 'med', domain: 'creative' },
  'Cook meal': { friction: 'med', domain: 'creative' },
  'Nature observation 5 min': { friction: 'low', domain: 'creative' },
  'Nature observation': { friction: 'low', domain: 'creative' },
  'Review streak': { friction: 'low', domain: 'identity' },
  'Write a win of the day': { friction: 'low', domain: 'identity' },
  'Write win of the day': { friction: 'low', domain: 'identity' },
  'Write win of day': { friction: 'low', domain: 'identity' },
  'Help someone': { friction: 'low', domain: 'identity' },
  'Affirmation practice': { friction: 'low', domain: 'identity' },
  'All morning tasks': { friction: 'high', domain: 'morning' },
  'Full body workout': { friction: 'high', domain: 'physical' },
};
