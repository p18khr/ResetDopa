// jest.setup.js — runs before all tests, before any module is loaded
// Sets env vars so module-level constants (like USE_GROQ) evaluate correctly
process.env.EXPO_PUBLIC_GROQ_API_KEY = 'test-groq-key';

// Enable __DEV__ for testing dev-mode components like DevSandbox
global.__DEV__ = true;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));



