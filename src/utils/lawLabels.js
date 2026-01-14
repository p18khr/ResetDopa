// Mapping of screens to laws with brief explanations
export const lawLabels = {
  Dashboard: {
    label: "Pareto Principle",
    description: "Focus on the vital few: 20% of actions drive 80% of results.",
  },
  Program: {
    label: "Gilbert's Law",
    description: "The best time to start was yesterday; the next best is now — begin with tiny steps.",
  },
  Tasks: {
    label: "Wilson's Law",
    description: "No task is too small to improve — small actions compound into big change.",
  },
  Stats: {
    label: "Goodhart's Law",
    description: "Metrics serve you; when a measure becomes a target, it can distort behavior — read trends, not just numbers.",
  },
  Badges: {
    label: "Lin's Law",
    description: "Clear, shareable progress spreads — celebrate wins that are easy to understand.",
  },
  Profile: {
    label: "Lin's Law",
    description: "Identity and clarity help progress travel — keep your story simple and visible.",
  },
  Settings: {
    label: "Wilson's Law",
    description: "Incremental tweaks matter — small configuration improvements reduce friction.",
  },
  Login: {
    label: "Murphy's Law",
    description: "Prepare for edge cases — simple, robust authentication and recovery paths.",
  },
  Signup: {
    label: "Gilbert's Law",
    description: "Start now with minimal friction — lower the barrier to begin.",
  },
  UrgeLogger: {
    label: "Lin's Law",
    description: "Clarity spreads: naming feelings and triggers makes patterns visible and easier to change.",
  },
  CompanionChat: {
    label: "Wilson's Law",
    description: "Small supportive messages add up — incremental guidance builds resilience.",
  },
  LevelUp: {
    label: "Gilbert's Law",
    description: "Progress rewards starting — keep moving and level up with consistent action.",
  },
};

export const getLawForRoute = (routeName) => lawLabels[routeName] || undefined;
