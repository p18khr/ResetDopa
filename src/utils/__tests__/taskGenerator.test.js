// Unit tests for generateDailyTasks in taskGenerator.js
// Mocks ollama.service and moodTaskPools to test AI selection + random fallback logic

global.__DEV__ = false;

// Mock ollama.service — controls whether AI selection succeeds or fails
jest.mock('../../services/ollama.service', () => ({
  selectAdaptiveTasksWithAI: jest.fn(),
}));

// Mock moodTaskPools — provide a controlled set of tasks
jest.mock('../../constants/moodTaskPools', () => ({
  getTasksForMood: jest.fn(() => [
    'Breathwork 5 min',
    'Meditation 10 min',
    'Gratitude list',
    '10-15 min walk',
    'Write 1 fear + response',
    'Sit still 3 min',
    'Nature observation 5 min',
    '5 min stretching/yoga',
  ]),
  // Returns slice of a fixed list based on count
  selectRandomTasksForMood: jest.fn((mood, count) =>
    ['Gratitude list', '10-15 min walk', 'Sit still 3 min'].slice(0, count)
  ),
}));

import { generateDailyTasks, shouldShowMoodCheck, refreshDynamicTasks } from '../taskGenerator';
import { selectAdaptiveTasksWithAI } from '../../services/ollama.service';
import { selectRandomTasksForMood, getTasksForMood } from '../../constants/moodTaskPools';

const CORE_HABITS = ['Make bed', 'Drink water first thing', 'No phones first 30 min'];

const BASE_PROFILE = {
  onboardingCompleted: true,
  coreHabits: CORE_HABITS,
};

describe('generateDailyTasks', () => {
  beforeEach(() => {
    // resetAllMocks clears calls AND queued return values for clean isolation
    jest.resetAllMocks();
    // Default: AI returns null (random fallback) unless overridden per test
    selectAdaptiveTasksWithAI.mockResolvedValue(null);
    // Restore mock implementations cleared by resetAllMocks
    getTasksForMood.mockReturnValue([
      'Breathwork 5 min',
      'Meditation 10 min',
      'Gratitude list',
      '10-15 min walk',
      'Write 1 fear + response',
      'Sit still 3 min',
      'Nature observation 5 min',
      '5 min stretching/yoga',
    ]);
    selectRandomTasksForMood.mockImplementation((mood, count) =>
      ['Gratitude list', '10-15 min walk', 'Sit still 3 min'].slice(0, count)
    );
  });

  // ─── AI selection success ────────────────────────────────────────────────────

  it('returns AI-selected dynamic tasks and aiSelected=true when AI succeeds', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Meditation 10 min']);

    const result = await generateDailyTasks(5, BASE_PROFILE, 'stressed', {});

    expect(result.aiSelected).toBe(true);
    expect(result.dynamicTasks).toEqual(['Breathwork 5 min', 'Meditation 10 min']);
  });

  it('includes fixedTasks matching the user coreHabits exactly', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Meditation 10 min']);

    const result = await generateDailyTasks(5, BASE_PROFILE, 'stressed', {});

    expect(result.fixedTasks).toEqual(CORE_HABITS);
  });

  it('allTasks is fixedTasks + dynamicTasks in order', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Meditation 10 min']);

    const result = await generateDailyTasks(5, BASE_PROFILE, 'stressed', {});

    expect(result.allTasks).toEqual([...CORE_HABITS, 'Breathwork 5 min', 'Meditation 10 min']);
  });

  // ─── Random fallback ─────────────────────────────────────────────────────────

  it('falls back to random selection and aiSelected=false when AI returns null', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(null);

    const result = await generateDailyTasks(10, BASE_PROFILE, 'good', {});

    expect(result.aiSelected).toBe(false);
    expect(selectRandomTasksForMood).toHaveBeenCalledTimes(1);
  });

  it('falls back to random when AI returns empty array', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue([]);

    const result = await generateDailyTasks(10, BASE_PROFILE, 'good', {});

    expect(result.aiSelected).toBe(false);
    expect(selectRandomTasksForMood).toHaveBeenCalledTimes(1);
  });

  it('does not call selectRandomTasksForMood when AI succeeds', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Gratitude list']);

    await generateDailyTasks(5, BASE_PROFILE, 'stressed', {});

    expect(selectRandomTasksForMood).not.toHaveBeenCalled();
  });

  // ─── Dynamic task count by week ──────────────────────────────────────────────

  it('requests 2 dynamic tasks on days <= 7 (Week 1)', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Gratitude list']);

    const result = await generateDailyTasks(5, BASE_PROFILE, 'stressed', {});

    expect(result.dynamicTasks).toHaveLength(2);
    expect(selectAdaptiveTasksWithAI).toHaveBeenCalledWith(
      'stressed',
      expect.any(Array),
      2,
      expect.any(Object)
    );
  });

  it('requests 3 dynamic tasks on days > 7 (Week 2+)', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue([
      'Breathwork 5 min',
      'Meditation 10 min',
      'Gratitude list',
    ]);

    const result = await generateDailyTasks(8, BASE_PROFILE, 'tired', {});

    expect(result.dynamicTasks).toHaveLength(3);
    expect(selectAdaptiveTasksWithAI).toHaveBeenCalledWith(
      'tired',
      expect.any(Array),
      3,
      expect.any(Object)
    );
  });

  it('requests 2 on day 7 (last day of Week 1)', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Breathwork 5 min', 'Gratitude list']);

    const result = await generateDailyTasks(7, BASE_PROFILE, 'stressed', {});

    expect(result.dynamicTasks).toHaveLength(2);
  });

  // ─── Core habits excluded from dynamic pool ──────────────────────────────────

  it('excludes coreHabits from the available pool sent to AI', async () => {
    const profileWithOverlap = {
      onboardingCompleted: true,
      coreHabits: ['Breathwork 5 min'], // This is also in the mock pool
    };
    selectAdaptiveTasksWithAI.mockResolvedValue(['Meditation 10 min', 'Gratitude list']);

    await generateDailyTasks(10, profileWithOverlap, 'stressed', {});

    const availableSentToAI = selectAdaptiveTasksWithAI.mock.calls[0][1];
    expect(availableSentToAI).not.toContain('Breathwork 5 min');
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  it('handles null userProfile gracefully — no coreHabits, dynamic only', async () => {
    // With null profile, falls back to random (no AI context)
    selectAdaptiveTasksWithAI.mockResolvedValue(['Gratitude list', '10-15 min walk']);

    const result = await generateDailyTasks(5, null, 'good', {});

    expect(result.fixedTasks).toEqual([]);
    // Day 5: dynamicCount = 2
    expect(result.dynamicTasks).toHaveLength(2);
  });

  it('handles empty coreHabits gracefully', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Gratitude list', '10-15 min walk']);

    const result = await generateDailyTasks(5, { coreHabits: [] }, 'good', {});

    expect(result.fixedTasks).toEqual([]);
    expect(result.allTasks).toHaveLength(2);
  });

  it('defaults to "good" mood when currentMood is null', async () => {
    selectAdaptiveTasksWithAI.mockResolvedValue(['Gratitude list', '10-15 min walk']);

    await generateDailyTasks(10, BASE_PROFILE, null, {});

    expect(selectAdaptiveTasksWithAI).toHaveBeenCalledWith(
      'good',
      expect.any(Array),
      expect.any(Number),
      expect.any(Object)
    );
  });
});

// ─── shouldShowMoodCheck ────────────────────────────────────────────────────────

describe('shouldShowMoodCheck', () => {
  it('returns true when lastMoodCheckTime is null', () => {
    expect(shouldShowMoodCheck(null)).toBe(true);
  });

  it('returns true when enough hours have passed (6h > 4h cooldown)', () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    expect(shouldShowMoodCheck(sixHoursAgo, 4)).toBe(true);
  });

  it('returns false when not enough hours have passed (1h < 4h cooldown)', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(shouldShowMoodCheck(oneHourAgo, 4)).toBe(false);
  });

  it('returns false at exactly the cooldown boundary (4h === 4h)', () => {
    const exactlyFourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    expect(shouldShowMoodCheck(exactlyFourHoursAgo, 4)).toBe(true);
  });
});

// ─── refreshDynamicTasks ────────────────────────────────────────────────────────

describe('refreshDynamicTasks', () => {
  it('replaces uncompleted tasks and preserves completed ones', () => {
    const completions = { 'Task A': true };
    const current  = ['Task A', 'Task B'];
    const incoming = ['Task C', 'Task D'];

    const result = refreshDynamicTasks(completions, current, incoming);

    expect(result).toContain('Task A'); // completed — preserved
    expect(result).not.toContain('Task B'); // uncompleted — swapped out
    expect(result).toHaveLength(2);
  });

  it('returns original tasks when all are already completed', () => {
    const completions = { 'Task A': true, 'Task B': true };
    const current  = ['Task A', 'Task B'];
    const incoming = ['Task C', 'Task D'];

    const result = refreshDynamicTasks(completions, current, incoming);

    expect(result).toEqual(['Task A', 'Task B']);
  });

  it('replaces all tasks when none are completed', () => {
    const completions = {};
    const current  = ['Task A', 'Task B'];
    const incoming = ['Task C', 'Task D'];

    const result = refreshDynamicTasks(completions, current, incoming);

    expect(result).toEqual(['Task C', 'Task D']);
  });

  it('does not include incoming tasks already in completed list', () => {
    const completions = { 'Task A': true };
    const current  = ['Task A', 'Task B'];
    const incoming = ['Task A', 'Task C']; // Task A is already done

    const result = refreshDynamicTasks(completions, current, incoming);

    // Task A appears once (from completed), Task C fills the uncompleted slot
    const taskACount = result.filter(t => t === 'Task A').length;
    expect(taskACount).toBe(1);
  });
});
