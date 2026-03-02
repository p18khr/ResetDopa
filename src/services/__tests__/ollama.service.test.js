// Unit tests for selectAdaptiveTasksWithAI in ollama.service.js
// API key is read lazily inside the function, so process.env set in jest.setup.js applies

global.__DEV__ = false;
global.AbortController = class {
  constructor() { this.signal = {}; }
  abort() {}
};

const POOL = [
  'Breathwork 5 min',
  'Meditation 10 min',
  'Gratitude list',
  '10-15 min walk',
  'Write 1 fear + response',
  'Sit still 3 min',
];

import { selectAdaptiveTasksWithAI } from '../ollama.service';

describe('selectAdaptiveTasksWithAI', () => {
  beforeEach(() => {
    // Explicitly set the API key so the lazy read inside the function resolves correctly
    process.env['EXPO_PUBLIC_GROQ_API_KEY'] = 'test-groq-key';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env['EXPO_PUBLIC_GROQ_API_KEY'];
    jest.clearAllMocks();
  });

  // ─── Guard conditions ───────────────────────────────────────────────────────

  it('returns null when availableTasks is empty', async () => {
    const result = await selectAdaptiveTasksWithAI('stressed', [], 2, {});

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns AI-selected tasks when Groq returns valid JSON array', async () => {
    const picked = ['Breathwork 5 min', 'Gratitude list'];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(picked) } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, { streak: 5 });

    expect(result).toEqual(picked);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns exactly `count` tasks even when Groq returns more', async () => {
    const picked = ['Breathwork 5 min', 'Gratitude list', '10-15 min walk'];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(picked) } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toHaveLength(2);
  });

  it('passes streak, recentTasks, and urgeEmotions in the prompt body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Meditation 10 min"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('anxious', POOL, 2, {
      streak: 7,
      recentTasks: ['Meditation 10 min'],
      recentUrgeEmotions: ['boredom'],
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const prompt = body.messages[0].content;
    expect(prompt).toContain('7-day streak');
    expect(prompt).toContain('Meditation 10 min');
    expect(prompt).toContain('boredom');
  });

  it('sends correct model and low temperature for deterministic selection', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Gratitude list"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.3);
    expect(body.model).toBe('llama-3.1-8b-instant');
  });

  it('sends Authorization Bearer header with the API key', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Gratitude list"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer test-groq-key');
  });

  // ─── Validation — rejects bad AI responses ──────────────────────────────────

  it('returns null when Groq response contains tasks not in the pool', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Invented task A", "Invented task B"]' } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when Groq returns fewer valid tasks than count', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Fake task"]' } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when Groq returns invalid JSON (no array found)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Here are my picks: Breathwork and Gratitude' } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when Groq returns a non-array JSON value', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"tasks": ["Breathwork 5 min"]}' } }],
      }),
    });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  // ─── Network / API errors ────────────────────────────────────────────────────

  it('returns null when fetch throws a network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network request failed'));

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when Groq returns a non-OK status (429 rate limit)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when Groq returns 401 unauthorized', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  it('returns null when AbortController times out', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValueOnce(abortError);

    const result = await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    expect(result).toBeNull();
  });

  // ─── Context string edge cases ──────────────────────────────────────────────

  it('uses "just starting out" context when userContext is empty', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Gratitude list"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('just starting out');
  });

  it('includes timeOfDay period in the AI prompt when provided in context', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Gratitude list"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('stressed', POOL, 2, { timeOfDay: 'evening' });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('evening');
    expect(body.messages[0].content).toContain('5pm-9pm');
  });

  it('defaults to morning time period when timeOfDay is not provided in context', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Breathwork 5 min", "Gratitude list"]' } }],
      }),
    });

    await selectAdaptiveTasksWithAI('stressed', POOL, 2, {});

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('morning');
    expect(body.messages[0].content).toContain('5am-12pm');
  });
});
