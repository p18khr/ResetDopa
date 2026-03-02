// src/utils/timerUtils.js
// Utility functions for timer-related operations

/**
 * Parse task name to extract duration
 * @param {string} taskName - Task name (e.g., "Meditation 10 min", "Walk 10-15 min")
 * @returns {Object|null} - { duration, unit } or { duration, rangeEnd, unit } for ranges, or null if no duration found
 */
export function parseTaskDuration(taskName) {
  if (!taskName || typeof taskName !== 'string') return null;

  // Match patterns like "10 min", "10-15 min", "5min", "10 - 15 min"
  // Handles: "X min", "X-Y min", "Xmin", "X - Y min", etc.
  const durationRegex = /(\d+)\s*(?:-\s*(\d+))?\s*(?:min(?:utes?)?|m)\b/i;
  const match = taskName.match(durationRegex);

  if (!match) return null;

  const duration = parseInt(match[1], 10);
  const rangeEnd = match[2] ? parseInt(match[2], 10) : null;

  return {
    duration,
    ...(rangeEnd && { rangeEnd }),
    unit: 'min'
  };
}

/**
 * Convert duration to seconds
 * @param {number} minutes - Duration in minutes
 * @returns {number} - Duration in seconds
 */
export function minutesToSeconds(minutes) {
  return Math.floor(minutes * 60);
}

/**
 * Convert seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted time (e.g., "05:30")
 */
export function secondsToMMSS(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Check if a task name contains a timer-eligible duration
 * @param {string} taskName - Task name
 * @returns {boolean} - True if task has a parseable duration
 */
export function isTimerTask(taskName) {
  return parseTaskDuration(taskName) !== null;
}
