// src/context/__tests__/AuthContext.test.js
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
}));

// Import mocked functions
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

// Test component to access auth context
function TestComponent({ onRender }) {
  const auth = useAuth();
  React.useEffect(() => {
    if (onRender) onRender(auth);
  }, [auth.user, auth.loading, auth.hasAcceptedTerms, auth.acceptanceLoaded]);
  return null;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading=true and no user', async () => {
      let capturedAuth;

      // Mock onAuthStateChanged to never call callback (simulates still loading)
      onAuthStateChanged.mockImplementation(() => () => {});

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
        expect(capturedAuth.loading).toBe(true);
        expect(capturedAuth.user).toBeNull();
      });
    });

    it('should initialize with hasAcceptedTerms=false and acceptanceLoaded=false', async () => {
      let capturedAuth;

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(null); // No user
        return () => {};
      });

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(false);
        expect(capturedAuth.acceptanceLoaded).toBe(false);
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when authentication changes', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(mockUser);
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser);
        expect(capturedAuth.loading).toBe(false);
      });
    });

    it('should reset acceptance state when user logs out', async () => {
      let authCallback;
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        authCallback = callback;
        callback(mockUser); // Start with user
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser);
      });

      // Manually set terms acceptance
      act(() => {
        capturedAuth.setHasAcceptedTerms(true);
        capturedAuth.setAcceptanceLoaded(true);
      });

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(true);
        expect(capturedAuth.acceptanceLoaded).toBe(true);
      });

      // Simulate user logout
      act(() => {
        authCallback(null);
      });

      await waitFor(() => {
        expect(capturedAuth.user).toBeNull();
        expect(capturedAuth.hasAcceptedTerms).toBe(false);
        expect(capturedAuth.acceptanceLoaded).toBe(false);
      });
    });

    it('should reset acceptanceLoaded flag when new user logs in', async () => {
      let authCallback;
      const mockUser1 = { uid: 'user-1', email: 'user1@example.com' };
      const mockUser2 = { uid: 'user-2', email: 'user2@example.com' };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        authCallback = callback;
        callback(mockUser1); // Start with user1
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser1);
      });

      // Set acceptance loaded for user1
      act(() => {
        capturedAuth.setAcceptanceLoaded(true);
      });

      await waitFor(() => {
        expect(capturedAuth.acceptanceLoaded).toBe(true);
      });

      // Switch to user2
      act(() => {
        authCallback(mockUser2);
      });

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser2);
        expect(capturedAuth.acceptanceLoaded).toBe(false); // Should reset
      });
    });
  });

  describe('Terms Acceptance Flow', () => {
    it('should update local state when acceptTerms is called', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(mockUser);
        return () => {};
      });

      updateDoc.mockResolvedValue();

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(false);
      });

      await act(async () => {
        await capturedAuth.acceptTerms();
      });

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(true);
        expect(capturedAuth.acceptanceLoaded).toBe(true);
      });
    });

    it('should save acceptance to Firestore when user accepts terms', async () => {
      const mockUser = { uid: 'test-uid-456', email: 'test@example.com' };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(mockUser);
        return () => {};
      });

      updateDoc.mockResolvedValue();
      doc.mockReturnValue({ id: 'test-uid-456' });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser);
      });

      await act(async () => {
        await capturedAuth.acceptTerms();
      });

      await waitFor(() => {
        expect(doc).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            hasAcceptedTerms: true,
            termsAcceptedAt: expect.any(String),
          })
        );
      });
    });

    it('should handle Firestore write errors gracefully', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockError = new Error('Firestore write failed');

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(mockUser);
        return () => {};
      });

      updateDoc.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(false);
      });

      await act(async () => {
        await capturedAuth.acceptTerms();
      });

      await waitFor(() => {
        // Local state should still update even if Firestore write fails
        expect(capturedAuth.hasAcceptedTerms).toBe(true);
        expect(capturedAuth.acceptanceLoaded).toBe(true);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not attempt Firestore write if no user is logged in', async () => {
      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(null); // No user
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toBeNull();
      });

      await act(async () => {
        await capturedAuth.acceptTerms();
      });

      // Should update local state but not call Firestore
      expect(capturedAuth.hasAcceptedTerms).toBe(true);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Direct State Setters', () => {
    it('should expose setHasAcceptedTerms setter', async () => {
      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(null);
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(false);
      });

      act(() => {
        capturedAuth.setHasAcceptedTerms(true);
      });

      await waitFor(() => {
        expect(capturedAuth.hasAcceptedTerms).toBe(true);
      });
    });

    it('should expose setAcceptanceLoaded setter', async () => {
      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(null);
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.acceptanceLoaded).toBe(false);
      });

      act(() => {
        capturedAuth.setAcceptanceLoaded(true);
      });

      await waitFor(() => {
        expect(capturedAuth.acceptanceLoaded).toBe(true);
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should clean up auth listener on unmount', () => {
      const unsubscribeMock = jest.fn();
      onAuthStateChanged.mockReturnValue(unsubscribeMock);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should maintain stable user reference across re-renders', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };

      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(mockUser);
        return () => {};
      });

      let capturedAuth;
      const { rerender } = render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth.user).toEqual(mockUser);
      });

      const firstUserRef = capturedAuth.user;

      // Force re-render
      rerender(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        // User object should be the same reference (stable)
        expect(capturedAuth.user).toBe(firstUserRef);
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should return auth context when used within AuthProvider', async () => {
      onAuthStateChanged.mockImplementation((authInstance, callback) => {
        callback(null);
        return () => {};
      });

      let capturedAuth;

      render(
        <AuthProvider>
          <TestComponent onRender={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
        expect(capturedAuth.user).toBeNull();
        expect(capturedAuth.loading).toBe(false);
        expect(capturedAuth.acceptTerms).toBeDefined();
        expect(capturedAuth.setHasAcceptedTerms).toBeDefined();
        expect(capturedAuth.setAcceptanceLoaded).toBeDefined();
      });
    });
  });
});
