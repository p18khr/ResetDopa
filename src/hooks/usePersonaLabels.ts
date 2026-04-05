// src/hooks/usePersonaLabels.ts
// Custom hook to access persona-specific labels from AppContext

import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getPersonaLabels, PersonaLabels, UserPersona } from '../constants/personaDictionary';

/**
 * Hook to get personalized metric labels based on user's selected persona
 * 
 * Reads userPersona from AppContext and returns appropriate labels
 * Falls back to default labels if persona is not set
 * 
 * @returns PersonaLabels object with metric1, metric2, metric3
 * 
 * @example
 * const labels = usePersonaLabels();
 * // For a student: { metric1: 'Study Hours Protected', ... }
 * // For a professional: { metric1: 'Deep Work Achieved', ... }
 */
export function usePersonaLabels(): PersonaLabels {
  const { userProfile } = useContext(AppContext);
  const persona = userProfile?.userPersona as UserPersona;
  
  return getPersonaLabels(persona);
}
