/**
 * Audio utilities for task guides
 * Safe isolation - doesn't affect any game logic
 * Uses native Expo libraries: expo-speech (TTS) and expo-haptics (vibration)
 */

import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

/**
 * Initialize audio mode (runs once on app start)
 */
export async function initializeAudio() {
  try {
    await Speech.stop();
    console.log('[AudioUtils] Audio system initialized');
  } catch (error) {
    console.warn('[AudioUtils] Failed to initialize audio:', error.message);
  }
}

/**
 * Play success sound on task completion
 * Uses haptic feedback + console log
 */
export async function playSuccessSound() {
  try {
    // Haptic feedback: light tap
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('[AudioUtils] Success sound triggered');
  } catch (error) {
    console.warn('[AudioUtils] Success sound failed gracefully:', error.message);
  }
}

/**
 * Speak breathing instruction (TTS)
 * Used during breathwork session
 */
export async function speakBreathingPhase(phase, duration) {
  try {
    const messages = {
      inhale: `Inhale for ${duration} counts`,
      hold: `Hold for ${duration} counts`,
      exhale: `Exhale for ${duration} counts`,
      pause: `Pause for ${duration} counts`,
    };

    const text = messages[phase] || '';
    if (text) {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8, // Slower speech for calming effect
      });
    }
  } catch (error) {
    console.warn('[AudioUtils] TTS failed gracefully:', error.message);
  }
}

/**
 * Haptic pulse for meditation
 * Called periodically during meditation
 */
export async function meditationPulse() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('[AudioUtils] Haptic pulse failed:', error.message);
  }
}

/**
 * Generate breathwork audio guide text
 * Returns script for TTS or manual reading
 */
export function generateBreathworkGuide(duration = 5) {
  // duration in minutes
  const cycles = Math.max(1, Math.floor(duration * 4)); // ~4 cycles per minute

  const guide = {
    intro: `Let's do a ${duration}-minute breathwork session. Find a comfortable position and relax.`,
    cycles: Array.from({ length: cycles }, (_, i) => ({
      number: i + 1,
      inhale: 'Inhale for 4 counts...',
      hold: 'Hold for 2 counts...',
      exhale: 'Exhale for 4 counts...',
      pause: 'Pause for 2 counts...',
    })),
    outro: `Great job! You've completed ${duration} minutes of breathing. Feel free to rest for a moment.`,
  };

  return guide;
}

/**
 * Generate meditation ambient sounds concept
 * Returns metadata for audio selection
 */
export const MEDITATION_SOUNDS = {
  rain: {
    name: 'Rain',
    description: 'Gentle rain sounds',
    emoji: '🌧️',
  },
  forest: {
    name: 'Forest',
    description: 'Birds and nature sounds',
    emoji: '🌲',
  },
  waves: {
    name: 'Ocean Waves',
    description: 'Calming ocean sounds',
    emoji: '🌊',
  },
  silence: {
    name: 'Silence',
    description: 'Pure quiet',
    emoji: '🤫',
  },
};

/**
 * Stop any playing speech
 */
export async function stopAudio() {
  try {
    await Speech.stop();
    console.log('[AudioUtils] Audio stopped');
  } catch (error) {
    console.warn('[AudioUtils] Failed to stop audio:', error.message);
  }
}
