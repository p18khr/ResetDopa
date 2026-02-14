// User-related data structures

import { User as FirebaseUser } from 'firebase/auth';

export type { FirebaseUser };

/**
 * Main program task
 */
export interface Task {
  id: string;
  title: string;
  points: number;
  done: boolean;
}

/**
 * Urge logging entry
 */
export interface Urge {
  id: string;
  timestamp: number;
  intensity: 'low' | 'medium' | 'high';
  trigger: string | null;
  note: string;
  emotion: 'boredom' | 'stress' | 'habit' | 'lonely' | null;
  outcome: string | null;
}

/**
 * Achievement badge
 */
export interface Badge {
  id: string;
  title: string;
  got: boolean;
}

/**
 * Badge notification toast
 */
export interface BadgeToast {
  id: string;
  title: string;
  message: string;
}

/**
 * Motivational quote
 */
export interface Quote {
  text: string;
  author: string;
  tag: string;
}

/**
 * Mood value (simple or detailed)
 */
export type MoodValue = string | Record<string, any>;
