// jest.setup.js — runs before all tests, before any module is loaded
// Sets env vars so module-level constants (like USE_GROQ) evaluate correctly
process.env.EXPO_PUBLIC_GROQ_API_KEY = 'test-groq-key';

global.__DEV__ = false;
