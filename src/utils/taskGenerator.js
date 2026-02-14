// src/utils/taskGenerator.js
// Dynamic task generation based on mood and user profile

import { selectRandomTasksForMood } from '../constants/moodTaskPools';

/**
 * Generate daily tasks: fixed core habits + dynamic mood-based tasks
 * @param {number} currentDay - Current program day
 * @param {object} userProfile - User profile with coreHabits
 * @param {string} currentMood - Current mood identifier
 * @returns {object} - { fixedTasks, dynamicTasks, allTasks }
 */
export const generateDailyTasks = (currentDay, userProfile, currentMood) => {
  // Get fixed core habits from user profile (set during onboarding)
  const fixedTasks = userProfile?.coreHabits || [];

  // Determine how many dynamic tasks to add based on week
  const dynamicCount = currentDay <= 7 ? 2 : 3; // Week 1: 5 tasks total, Week 2+: 6 tasks total

  // Get dynamic tasks from mood pool, excluding fixed tasks
  const dynamicTasks = selectRandomTasksForMood(currentMood || 'good', dynamicCount, fixedTasks);

  // Combine for total task list
  const allTasks = [...fixedTasks, ...dynamicTasks];

  return {
    fixedTasks,
    dynamicTasks,
    allTasks
  };
};

/**
 * Check if mood check is needed
 * @param {string|null} lastMoodCheckTime - ISO timestamp of last mood check
 * @param {number} cooldownHours - Hours to wait between mood checks (default: 4)
 * @returns {boolean} - True if mood check is needed
 */
export const shouldShowMoodCheck = (lastMoodCheckTime, cooldownHours = 4) => {
  if (!lastMoodCheckTime) return true;

  try {
    const lastCheck = new Date(lastMoodCheckTime);
    const now = new Date();
    const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);

    return hoursSinceLastCheck >= cooldownHours;
  } catch {
    return true;
  }
};

/**
 * Check if tasks should be refreshed (only swap uncompleted dynamic tasks)
 * @param {object} todayCompletions - { taskName: boolean }
 * @param {Array} currentDynamicTasks - Current dynamic tasks
 * @param {Array} newDynamicTasks - New dynamic tasks from mood change
 * @returns {Array} - Updated dynamic tasks (completed ones preserved, uncompleted swapped)
 */
export const refreshDynamicTasks = (todayCompletions, currentDynamicTasks, newDynamicTasks) => {
  const completedDynamic = currentDynamicTasks.filter(task => todayCompletions[task] === true);
  const uncompletedCount = currentDynamicTasks.length - completedDynamic.length;

  // Take only enough new tasks to replace uncompleted ones
  const newTasksToAdd = newDynamicTasks
    .filter(task => !completedDynamic.includes(task))
    .slice(0, uncompletedCount);

  return [...completedDynamic, ...newTasksToAdd];
};

/**
 * Get task category emoji from task name
 * @param {string} taskName - Task name
 * @returns {string} - Category emoji
 */
export const getTaskCategory = (taskName) => {
  const lower = taskName.toLowerCase();

  if (lower.includes('sunlight') || lower.includes('bed') || lower.includes('water') ||
      lower.includes('intention') || lower.includes('splash') || lower.includes('phones')) {
    return '🌅 Morning';
  }
  if (lower.includes('walk') || lower.includes('push') || lower.includes('stretch') ||
      lower.includes('yoga') || lower.includes('dance') || lower.includes('shower') ||
      lower.includes('clean')) {
    return '💪 Physical';
  }
  if (lower.includes('pomodoro') || lower.includes('prioritize') || lower.includes('study') ||
      lower.includes('read') || lower.includes('phone') || lower.includes('remove')) {
    return '🎯 Focus';
  }
  if (lower.includes('meditation') || lower.includes('breath') || lower.includes('gratitude') ||
      lower.includes('journal') || lower.includes('fear') || lower.includes('sit still') ||
      lower.includes('avoid')) {
    return '🧠 Mind';
  }
  if (lower.includes('call') || lower.includes('compliment') || lower.includes('speak') ||
      lower.includes('meal') || lower.includes('help')) {
    return '🌿 Social';
  }
  if (lower.includes('delete') || lower.includes('notification') || lower.includes('sm from') ||
      lower.includes('scrolling') || lower.includes('no-phone')) {
    return '🎧 Detox';
  }
  if (lower.includes('draw') || lower.includes('write') || lower.includes('music') ||
      lower.includes('learn') || lower.includes('cook') || lower.includes('nature')) {
    return '🎨 Creative';
  }
  if (lower.includes('streak') || lower.includes('win') || lower.includes('affirmation') ||
      lower.includes('celebrate')) {
    return '🎁 Identity';
  }

  return '📌 Task';
};

/**
 * Validate that fixed tasks don't overlap with dynamic tasks
 * @param {Array} fixedTasks - Fixed core habits
 * @param {Array} dynamicTasks - Dynamic mood-based tasks
 * @returns {boolean} - True if no overlap
 */
export const validateTaskSeparation = (fixedTasks, dynamicTasks) => {
  return !dynamicTasks.some(task => fixedTasks.includes(task));
};

/**
 * Get default mood based on time of day
 * @returns {string} - Default mood identifier
 */
export const getDefaultMoodByTime = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'foggy';      // Morning: often groggy
  if (hour >= 12 && hour < 17) return 'scattered'; // Afternoon: energy dip
  if (hour >= 17 && hour < 21) return 'tired';     // Evening: fatigue
  return 'calm';                                    // Night: winding down
};
