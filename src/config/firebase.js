// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2PGWjzEXOWOteFXCEiwNRZU9T9rhQD7s",
  authDomain: "dopareset.firebaseapp.com",
  projectId: "dopareset",
  storageBucket: "dopareset.firebasestorage.app",
  messagingSenderId: "900804786470",
  appId: "1:900804786470:web:1b3cf848226d05309b29e7",
  measurementId: "G-YXKYLB29E2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase initialized with project:', firebaseConfig.projectId);

// Initialize Firebase Authentication with proper platform-specific persistence
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('✅ Firebase persistence (web) configured'))
      .catch((err) => {
        console.error('❌ Firebase persistence error:', err?.code, err?.message);
      });
  } else {
    // React Native: Use AsyncStorage for persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('✅ Firebase persistence (React Native) configured');
  }
} catch (err) {
  console.error('❌ Firebase auth initialization error:', err?.code, err?.message);
  // Fallback to basic auth if initialization fails
  auth = getAuth(app);
}

export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
