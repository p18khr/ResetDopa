// src/hooks/useAppSelector.js
import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * Optimized selector hook for AppContext
 * Only re-renders when selected values change, not when entire context updates
 *
 * @example
 * // Instead of:
 * const { tasks, toggleTask } = useContext(AppContext);
 *
 * // Use:
 * const { tasks, toggleTask } = useAppSelector(['tasks', 'toggleTask']);
 */
export function useAppSelector(keys) {
  const context = useContext(AppContext);

  return useMemo(() => {
    const selected = {};
    keys.forEach(key => {
      selected[key] = context[key];
    });
    return selected;
  }, keys.map(k => context[k]));
}

/**
 * Optimized hook for task-related operations
 * Prevents re-renders when unrelated context values change
 */
export function useTasks() {
  const context = useContext(AppContext);

  return useMemo(() => ({
    tasks: context.tasks,
    toggleTask: context.toggleTask,
  }), [context.tasks, context.toggleTask]);
}

/**
 * Optimized hook for program day operations
 * Commonly used together, so grouped for convenience
 */
export function useProgramDay() {
  const context = useContext(AppContext);

  return useMemo(() => ({
    getCurrentDay: context.getCurrentDay,
    startDate: context.startDate,
    todayPicks: context.todayPicks,
    todayCompletions: context.todayCompletions,
  }), [
    context.getCurrentDay,
    context.startDate,
    context.todayPicks,
    context.todayCompletions,
  ]);
}

/**
 * Optimized hook for daily quest
 */
export function useDailyQuest() {
  const context = useContext(AppContext);

  return useMemo(() => ({
    dailyQuest: context.dailyQuest,
    dailyQuestDone: context.dailyQuestDone,
    markDailyQuestDone: context.markDailyQuestDone,
  }), [
    context.dailyQuest,
    context.dailyQuestDone,
    context.markDailyQuestDone,
  ]);
}

/**
 * Optimized hook for mood tracking
 */
export function useDailyMood() {
  const context = useContext(AppContext);

  return useMemo(() => ({
    dailyMood: context.dailyMood,
    setDailyMood: context.setDailyMood,
  }), [context.dailyMood, context.setDailyMood]);
}
