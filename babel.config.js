module.exports = function(api) {
  // Cache by NODE_ENV so switching between test and production invalidates transforms
  api.cache.using(() => process.env.NODE_ENV);

  // In Jest (NODE_ENV=test), set a dummy EXPO_PUBLIC_GROQ_API_KEY so
  // babel-preset-expo's expoInlineEnvVars plugin inlines a truthy value
  // instead of undefined — allows selectAdaptiveTasksWithAI tests to pass the guard.
  if (process.env.NODE_ENV === 'test' && !process.env.EXPO_PUBLIC_GROQ_API_KEY) {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'test-groq-key';
  }

  return {
    presets: ['babel-preset-expo'],
  };
};
