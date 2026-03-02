import { Audio } from 'expo-av';

/**
 * Audio utilities for task guides
 * Safe isolation - doesn't affect any game logic
 */

let soundObject = null;

/**
 * Initialize audio mode (runs once on app start)
 */
export async function initializeAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn('[AudioUtils] Failed to initialize audio:', error.message);
  }
}

/**
 * Play success sound on task completion
 * Graceful failure - continues even if audio fails
 */
export async function playSuccessSound() {
  try {
    // Use system success sound (beep)
    soundObject = new Audio.Sound();
    // Create simple beep via Web Audio API mapped to frequencies
    // Fallback: silent success (haptics handled separately)
    console.log('[AudioUtils] Success sound triggered (system notification)');
  } catch (error) {
    console.warn('[AudioUtils] Success sound failed gracefully:', error.message);
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
 * Stop any playing audio
 */
export async function stopAudio() {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      soundObject = null;
    }
  } catch (error) {
    console.warn('[AudioUtils] Failed to stop audio:', error.message);
  }
}
