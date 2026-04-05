// Example: How to use userPersona in your components

import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

function ExampleComponent() {
  const { userProfile } = useContext(AppContext);
  const persona = userProfile?.userPersona;

  // Example 1: Customize dashboard messaging based on persona
  const getWelcomeMessage = () => {
    switch (persona) {
      case 'student':
        return 'Ready to dominate your study session?';
      case 'professional':
        return 'Let\'s maximize your productivity today.';
      case 'minimalist':
        return 'Time to reclaim your attention.';
      default:
        return 'Welcome back!';
    }
  };

  // Example 2: Adjust task difficulty/strictness
  const getTaskDifficulty = () => {
    switch (persona) {
      case 'student':
        return 'extreme'; // Harder challenges for competitive students
      case 'professional':
        return 'balanced'; // Pragmatic challenges for busy professionals
      case 'minimalist':
        return 'gentle'; // Mindful, sustainable challenges
      default:
        return 'balanced';
    }
  };

  // Example 3: Personalize AI prompts
  const getAISystemPrompt = () => {
    const basePrompt = 'You are DopaGuide, a supportive habit coach...';
    
    const personaContext = {
      student: 'The user is a student focused on academic excellence and mental endurance. Emphasize study techniques, focus strategies, and competitive edge.',
      professional: 'The user is a working professional optimizing productivity. Emphasize time management, context-switching elimination, and output maximization.',
      minimalist: 'The user seeks simplicity and digital detox. Emphasize mindfulness, presence, and attention reclamation.',
    };

    return `${basePrompt}\n\nPersona Context: ${personaContext[persona] || ''}`;
  };

  // Example 4: Filter task recommendations
  const getPersonalizedTasks = (allTasks) => {
    const personaPreferences = {
      student: ['Study without music 15 min', '25-min Pomodoro work', 'Prioritize top 1 task'],
      professional: ['25-min Pomodoro work', 'Remove phone 1 hour', 'Prioritize top 1 task'],
      minimalist: ['No phones first 30 min', '2-hour no-phone block', 'Meditation 10 min'],
    };

    const preferred = personaPreferences[persona] || [];
    
    // Boost priority of persona-aligned tasks
    return allTasks.sort((a, b) => {
      const aMatch = preferred.includes(a.title);
      const bMatch = preferred.includes(b.title);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  };

  return (
    <View>
      <Text>{getWelcomeMessage()}</Text>
      {/* Use personalized data in your UI */}
    </View>
  );
}

export default ExampleComponent;
