// src/services/ollama.service.js
// AI chat service - uses Groq (production) or Ollama (local dev fallback)

// Groq config (production - fast, hosted)
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Fast, free tier - replaces decommissioned llama3-8b-8192
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

// Ollama config (local dev fallback)
const OLLAMA_BASE_URL = 'http://192.168.29.10:11434';
const OLLAMA_MODEL = 'dopamine-coach:latest';

// Use Groq if API key is available, otherwise fall back to local Ollama
const USE_GROQ = !!GROQ_API_KEY;

/**
 * System prompt for DopaGuide - supportive coach + reflective guide
 */
const SYSTEM_PROMPT = `You are DopaGuide, an AI companion helping users overcome dopamine addiction and build healthy habits. Your role combines:

1. **Supportive Coach**: Encourage progress, celebrate wins (even small ones), provide motivation, and remind users they're capable of change.

2. **Reflective Guide**: Ask thoughtful questions to help users understand their patterns, explore feelings, and gain self-awareness about their triggers and behaviors.

Context: The user is working through a habit-building program focused on dopamine regulation. They track daily tasks, log urges, and maintain streaks.

Guidelines:
- Keep responses concise (2-4 sentences)
- Be warm and understanding, never judgmental
- Validate their efforts and progress
- Ask open-ended questions when appropriate
- Reference their specific situation when they share it
- Use "you" instead of "we" to empower individual agency
- Avoid clichés; be genuine and specific

Remember: Small wins matter. Every moment of awareness is progress.`;

/**
 * Send a chat message and get a response
 * @param {Array} messages - Array of message objects: [{from: 'user'|'bot', text: string}]
 * @param {Object} userContext - Optional context about user's progress
 * @returns {Promise<string>} - Bot's response text
 */
export async function sendMessage(messages, userContext = {}) {
  if (USE_GROQ) {
    return sendViaGroq(messages, userContext);
  } else {
    return sendViaOllama(messages, userContext);
  }
}

/**
 * Send message via Groq API (production)
 */
async function sendViaGroq(messages, userContext) {
  try {
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    // Inject user context into last message
    if (userContext && Object.keys(userContext).length > 0) {
      const last = formattedMessages.length - 1;
      const contextStr = formatUserContext(userContext);
      formattedMessages[last].content += `\n\n[User context: ${contextStr}]`;
    }

    if (__DEV__) {
      console.log('[AI] Using Groq:', GROQ_MODEL);
      console.log('[AI] Message count:', formattedMessages.length);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s - Groq is fast

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: formattedMessages,
        temperature: 0.8,
        max_tokens: 200,
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (__DEV__) {
      console.log('[AI] Groq response length:', data.choices?.[0]?.message?.content?.length || 0);
    }

    return data.choices?.[0]?.message?.content || "I'm here to support you. How are you feeling?";

  } catch (error) {
    console.error('[AI] Groq error:', error.message);

    if (error.name === 'AbortError') {
      throw new Error('Response timed out. Please try again.');
    } else if (error.message.includes('401')) {
      throw new Error('Invalid Groq API key. Please check your configuration.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('No internet connection. DopaGuide needs internet to respond.');
    }

    throw new Error('DopaGuide is temporarily unavailable. Please try again.');
  }
}

/**
 * Send message via local Ollama (dev fallback)
 */
async function sendViaOllama(messages, userContext) {
  try {
    const ollamaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    if (userContext && Object.keys(userContext).length > 0) {
      const last = ollamaMessages.length - 1;
      const contextStr = formatUserContext(userContext);
      ollamaMessages[last].content += `\n\n[User context: ${contextStr}]`;
    }

    if (__DEV__) {
      console.log('[AI] Using local Ollama:', OLLAMA_MODEL);
      console.log('[AI] Message count:', ollamaMessages.length);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min - local is slow

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_predict: 150,
        }
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (__DEV__) {
      console.log('[AI] Ollama response length:', data.message?.content?.length || 0);
    }

    return data.message?.content || "I'm here to support you. How are you feeling?";

  } catch (error) {
    console.error('[AI] Ollama error:', error.message);

    if (error.name === 'AbortError') {
      throw new Error('Response is taking too long. Your device may be running slowly.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to local DopaGuide. Make sure Ollama is running.');
    }

    throw new Error('DopaGuide is temporarily unavailable. Please try again.');
  }
}

/**
 * Format user context into a readable string for the AI
 */
function formatUserContext(context) {
  const parts = [];
  if (context.streak !== undefined) parts.push(`${context.streak} day streak`);
  if (context.tasksCompleted !== undefined && context.totalTasks !== undefined) {
    parts.push(`${context.tasksCompleted}/${context.totalTasks} tasks today`);
  }
  if (context.currentMood) parts.push(`feeling ${context.currentMood}`);
  if (context.recentUrge) parts.push(`just logged an urge`);
  return parts.join(', ') || 'starting their journey';
}

/**
 * Use AI to select the best adaptive tasks from a mood pool
 * @param {string} mood - Current mood identifier
 * @param {Array<string>} availableTasks - Task names from the mood pool
 * @param {number} count - How many tasks to select
 * @param {Object} userContext - User context (streak, completions, mood)
 * @returns {Promise<Array<string>|null>} - Selected task names, or null to trigger random fallback
 */
export async function selectAdaptiveTasksWithAI(mood, availableTasks, count, userContext = {}) {
  // Read API key at call time via dynamic access — defeats Babel compile-time inlining of EXPO_PUBLIC_*
  const apiKey = process.env['EXPO_PUBLIC_GROQ_API_KEY'];
  if (!apiKey || !availableTasks.length) return null;

  try {
    const contextParts = [];
    if (userContext.streak !== undefined) contextParts.push(`${userContext.streak}-day streak`);
    if (userContext.recentTasks?.length) contextParts.push(`recently did: ${userContext.recentTasks.slice(0, 4).join(', ')}`);
    if (userContext.recentUrgeEmotions?.length) contextParts.push(`recent urge emotions: ${userContext.recentUrgeEmotions.join(', ')}`);
    const contextStr = contextParts.length ? contextParts.join('; ') : 'just starting out';

    const timeOfDay = userContext.timeOfDay || 'morning';
    const timeGuidance = {
      morning: 'morning hours (5am-12pm). Prioritize tasks like "no phone first X min", hydration, sunlight, and intention-setting.',
      afternoon: 'afternoon hours (12pm-5pm). Prioritize energizing and focus-based tasks to combat afternoon energy dips.',
      evening: 'evening hours (5pm-9pm). Prioritize calming or moderate-intensity tasks. Avoid morning-specific tasks like "first X min of the day".',
      night: 'late night hours (9pm-5am). Prioritize wind-down and relaxation tasks.'
    };

    const prompt = `You are a habit coach. Select exactly ${count} tasks from this list for a user feeling "${mood}" during ${timeGuidance[timeOfDay]}.

User context: ${contextStr}

Available tasks:
${availableTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Rules:
- Pick tasks that best match the "${mood}" mood AND are appropriate for ${timeOfDay}
- Avoid tasks they recently did (if listed above)
- Consider time-of-day context: morning tasks with "first X min" should only appear in morning hours
- Return ONLY a valid JSON array of exactly ${count} task names copied exactly from the list
- No explanation, no extra text

Example format: ["Task A", "Task B"]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 120,
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Groq ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON array found');

    const selected = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(selected)) throw new Error('Not an array');

    // Validate: only accept names that exist in the available pool
    const validated = selected.filter(t =>
      typeof t === 'string' && availableTasks.includes(t)
    ).slice(0, count);

    if (validated.length < count) {
      if (__DEV__) console.log('[AI] Task selection: not enough valid picks, falling back to random');
      return null;
    }

    if (__DEV__) console.log('[AI] AI-selected adaptive tasks:', validated);
    return validated;

  } catch (error) {
    if (__DEV__) console.log('[AI] Adaptive task selection failed, using random fallback:', error.message);
    return null;
  }
}

/**
 * Check if AI service is available
 */
export async function checkOllamaStatus() {
  if (USE_GROQ) {
    // Groq is a hosted service - assume available if key exists
    if (__DEV__) console.log('[AI] Using Groq for production');
    return { available: true };
  }

  // Check local Ollama
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { available: false, error: 'Ollama server not responding' };

    const data = await response.json();
    const hasModel = data.models?.some(m =>
      m.name === OLLAMA_MODEL || m.name.includes(OLLAMA_MODEL.split(':')[0])
    );

    if (!hasModel) {
      if (__DEV__) console.log('[AI] Available models:', data.models?.map(m => m.name));
      return { available: false, error: `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}` };
    }

    return { available: true };

  } catch (error) {
    if (__DEV__) console.log('[AI] Ollama status check failed:', error.message);
    return { available: false, error: "Cannot connect to Ollama. Make sure it's running." };
  }
}
