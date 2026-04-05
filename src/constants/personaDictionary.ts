// src/constants/personaDictionary.ts
// Identity-mapped labels for personalized stats dashboard
// Creates Variable Reward effect by tailoring language to user's chosen persona

export type UserPersona = 'student' | 'professional' | 'minimalist' | null;

export interface PersonaLabels {
  metric1: string;
  metric2: string;
  metric3: string;
}

/**
 * Dictionary mapping user personas to personalized metric labels
 * Used on Stats dashboard to create identity-aligned language
 */
export const PERSONA_LABELS: Record<NonNullable<UserPersona>, PersonaLabels> = {
  student: {
    metric1: 'Study Hours Protected',
    metric2: 'Exam Readiness',
    metric3: 'Distractions Blocked',
  },
  professional: {
    metric1: 'Deep Work Achieved',
    metric2: 'Focus ROI',
    metric3: 'Productivity Intact',
  },
  minimalist: {
    metric1: 'Mindful Hours',
    metric2: 'Scroll Urges Defeated',
    metric3: 'Digital Clutter Blocked',
  },
};

/**
 * Default labels when persona is not set or invalid
 */
export const DEFAULT_LABELS: PersonaLabels = {
  metric1: 'Focus Time Protected',
  metric2: 'Daily Progress',
  metric3: 'Distractions Blocked',
};

/**
 * Get persona-specific labels with fallback to defaults
 * @param persona - User's selected persona
 * @returns PersonaLabels object
 */
export function getPersonaLabels(persona: UserPersona): PersonaLabels {
  if (!persona || !(persona in PERSONA_LABELS)) {
    return DEFAULT_LABELS;
  }
  return PERSONA_LABELS[persona];
}
