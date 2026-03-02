/**
 * Task Guide Detector - Determines which guide to show for a task
 * No side effects - pure utility function
 */

export const TASK_GUIDE_MAP = {
  // Breathwork tasks
  'Breathwork 5 min': { type: 'breathwork', duration: 5 },
  'Breathwork 10 min': { type: 'breathwork', duration: 10 },
  'Breathwork 15 min': { type: 'breathwork', duration: 15 },

  // Meditation tasks
  'Meditation 5 min': { type: 'meditation', duration: 5 },
  'Meditation 10 min': { type: 'meditation', duration: 10 },
  'Meditation 15 min': { type: 'meditation', duration: 15 },

  // Stretching tasks
  '5 min stretching': { type: 'stretching', duration: 5 },
  '5 min stretching/yoga': { type: 'stretching', duration: 5 },
  '5 min yoga': { type: 'stretching', duration: 5 },

  // Could add more later
};

/**
 * Get guide config for a task, if it exists
 * Returns null if no guide available (task works normally)
 */
export function getGuideForTask(taskName) {
  if (!taskName) return null;

  // Exact match first
  if (TASK_GUIDE_MAP[taskName]) {
    return TASK_GUIDE_MAP[taskName];
  }

  // Fuzzy match for variants
  const lowerTask = taskName.toLowerCase();
  for (const [key, guide] of Object.entries(TASK_GUIDE_MAP)) {
    if (lowerTask.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTask)) {
      return guide;
    }
  }

  return null;
}

/**
 * Check if a task has a guide available
 */
export function hasGuide(taskName) {
  return getGuideForTask(taskName) !== null;
}

/**
 * Get all tasks that have guides (for reference)
 */
export function getTasksWithGuides() {
  return Object.keys(TASK_GUIDE_MAP);
}
