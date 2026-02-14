// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChange, getUserId } from '../services/auth.service';
import { updateUserData } from '../services/firestore.service';

const AuthContext = createContext({
  user: null,
  loading: true,
  hasAcceptedTerms: false,
  acceptanceLoaded: false,
  acceptTerms: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [acceptanceLoaded, setAcceptanceLoaded] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setAcceptanceLoaded(false);

      if (!firebaseUser) {
        // Reset auth state when logged out
        setHasAcceptedTerms(false);
        setAcceptanceLoaded(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Accept terms and conditions
  const acceptTerms = async () => {
    setHasAcceptedTerms(true);
    setAcceptanceLoaded(true);
    if (user) {
      const result = await updateUserData(user.uid, {
        hasAcceptedTerms: true,
        termsAcceptedAt: new Date().toISOString(),
      });

      if (!result.success && __DEV__) {
        console.error('[AuthContext] Failed to save terms acceptance:', result.error);
      }
    }
  };

  // Expose setter for hasAcceptedTerms (needed when loading user data)
  const setHasAcceptedTermsValue = (value) => {
    setHasAcceptedTerms(value);
  };

  // Expose setter for acceptanceLoaded (needed when loading user data)
  const setAcceptanceLoadedValue = (value) => {
    setAcceptanceLoaded(value);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasAcceptedTerms,
        acceptanceLoaded,
        acceptTerms,
        setHasAcceptedTerms: setHasAcceptedTermsValue,
        setAcceptanceLoaded: setAcceptanceLoadedValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
