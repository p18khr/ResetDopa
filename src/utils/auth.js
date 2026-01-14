// src/utils/auth.js
// Google OAuth is now handled directly in Login.js using expo-auth-session hooks
// This file is kept for any future auth utilities

import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export { GoogleAuthProvider, signInWithCredential, auth };
