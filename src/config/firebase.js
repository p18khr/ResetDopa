// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, reactNativeLocalPersistence } from 'firebase/auth';
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

// Initialize Firebase Authentication with React Native persistence
const auth = getAuth(app);
setPersistence(auth, reactNativeLocalPersistence).catch((err) => {
  if (__DEV__) console.warn('Firebase persistence error:', err);
});

export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
