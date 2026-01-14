// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Firebase Authentication with proper persistence per platform
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  // Ensure web uses local (non-session) persistence
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
