// Unit tests for auth.service.ts
// Tests authentication service functions with mocked Firebase

import {
  signIn,
  signUp,
  signOut,
  deleteAccount,
  onAuthStateChange,
  getCurrentUser,
  isAuthenticated,
  getUserId,
  getUserEmail,
} from '../auth.service';
import * as firebaseAuth from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  deleteUser: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return success result on successful sign in', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      firebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it('should return error result on failed sign in', async () => {
      const mockError = {
        code: 'auth/wrong-password',
        message: 'Wrong password',
      };
      firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(mockError);

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wrong password');
      expect(result.code).toBe('auth/wrong-password');
      expect(result.user).toBeUndefined();
    });

    it('should handle errors without message', async () => {
      firebaseAuth.signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/network-error',
      });

      const result = await signIn('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to sign in');
      expect(result.code).toBe('auth/network-error');
    });
  });

  describe('signUp', () => {
    it('should return success result on successful sign up', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' };
      (firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      });

      const result = await signUp('new@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should return error result on failed sign up', async () => {
      const mockError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      };
      (firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(mockError);

      const result = await signUp('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already in use');
      expect(result.code).toBe('auth/email-already-in-use');
    });
  });

  describe('signOut', () => {
    it('should return success result on successful sign out', async () => {
      (firebaseAuth.signOut).mockResolvedValue(undefined);

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error result on failed sign out', async () => {
      const mockError = {
        code: 'auth/network-error',
        message: 'Network error',
      };
      (firebaseAuth.signOut).mockRejectedValue(mockError);

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('deleteAccount', () => {
    it('should return success result on successful account deletion', async () => {
      const mockUser = { uid: 'test-uid' };
      (firebaseAuth.deleteUser).mockResolvedValue(undefined);

      const result = await deleteAccount(mockUser);

      expect(result.success).toBe(true);
      expect(firebaseAuth.deleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('should return error result on failed account deletion', async () => {
      const mockUser = { uid: 'test-uid' };
      const mockError = {
        code: 'auth/requires-recent-login',
        message: 'Requires recent login',
      };
      (firebaseAuth.deleteUser).mockRejectedValue(mockError);

      const result = await deleteAccount(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Requires recent login');
      expect(result.code).toBe('auth/requires-recent-login');
    });
  });

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged with callback', () => {
      const mockUnsubscribe = jest.fn();
      (firebaseAuth.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = onAuthStateChange(callback);

      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from auth instance', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = { uid: 'test-uid', email: 'test@example.com' };

      const user = getCurrentUser();

      expect(user).toEqual({ uid: 'test-uid', email: 'test@example.com' });
    });

    it('should return null when no user is signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = null;

      const user = getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = { uid: 'test-uid' };

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no user is signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = null;

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('should return user UID when signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = { uid: 'test-uid-123' };

      expect(getUserId()).toBe('test-uid-123');
    });

    it('should return null when not signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = null;

      expect(getUserId()).toBeNull();
    });
  });

  describe('getUserEmail', () => {
    it('should return user email when signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = { uid: 'test-uid', email: 'user@example.com' };

      expect(getUserEmail()).toBe('user@example.com');
    });

    it('should return null when not signed in', () => {
      const mockConfig = require('../../config/firebase');
      mockConfig.auth.currentUser = null;

      expect(getUserEmail()).toBeNull();
    });
  });
});
