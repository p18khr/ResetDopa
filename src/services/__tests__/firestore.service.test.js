// Unit tests for firestore.service.ts
// Tests Firestore service functions with mocked Firebase

import {
  getUserDocRef,
  getUserData,
  createUserDocument,
  updateUserData,
  updateUserDataWithRetry,
  deleteUserDocument,
  setUserField,
  BatchSaveManager,
  documentExists,
  mergeUserData,
} from '../firestore.service';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {},
}));

describe('Firestore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserDocRef', () => {
    it('should return document reference for user', () => {
      const mockDocRef = { id: 'test-uid' };
      (firestore.doc).mockReturnValue(mockDocRef);

      const result = getUserDocRef('test-uid');

      expect(firestore.doc).toHaveBeenCalled();
      expect(result).toBe(mockDocRef);
    });
  });

  describe('getUserData', () => {
    it('should return success result with data when document exists', async () => {
      const mockData = { streak: 10, calmPoints: 250 };
      const mockDocSnap = {
        exists: () => true,
        data: () => mockData,
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockResolvedValue(mockDocSnap);

      const result = await getUserData('test-uid');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });

    it('should return error result when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockResolvedValue(mockDocSnap);

      const result = await getUserData('test-uid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User document does not exist');
      expect(result.code).toBe('not-found');
    });

    it('should return error result on failure', async () => {
      const mockError = {
        code: 'permission-denied',
        message: 'Permission denied',
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockRejectedValue(mockError);

      const result = await getUserData('test-uid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.code).toBe('permission-denied');
    });
  });

  describe('createUserDocument', () => {
    it('should return success result on document creation', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockResolvedValue(undefined);

      const data = { streak: 0, calmPoints: 0 };
      const result = await createUserDocument('test-uid', data);

      expect(result.success).toBe(true);
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should return error result on failure', async () => {
      const mockError = {
        code: 'permission-denied',
        message: 'Permission denied',
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockRejectedValue(mockError);

      const result = await createUserDocument('test-uid', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('updateUserData', () => {
    it('should return success result on update', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.updateDoc).mockResolvedValue(undefined);

      const updates = { streak: 15 };
      const result = await updateUserData('test-uid', updates);

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalled();
    });

    it('should return error result on failure', async () => {
      const mockError = {
        code: 'not-found',
        message: 'Document not found',
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.updateDoc).mockRejectedValue(mockError);

      const result = await updateUserData('test-uid', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });

  describe('updateUserDataWithRetry', () => {
    it('should return success on first attempt', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.updateDoc).mockResolvedValue(undefined);

      const result = await updateUserDataWithRetry('test-uid', { streak: 20 });

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.updateDoc)
        .mockRejectedValueOnce({ message: 'Network error' })
        .mockResolvedValueOnce(undefined);

      const result = await updateUserDataWithRetry('test-uid', { streak: 20 }, 10);

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteUserDocument', () => {
    it('should return success result on deletion', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.deleteDoc).mockResolvedValue(undefined);

      const result = await deleteUserDocument('test-uid');

      expect(result.success).toBe(true);
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });

    it('should return error result on failure', async () => {
      const mockError = {
        code: 'permission-denied',
        message: 'Permission denied',
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.deleteDoc).mockRejectedValue(mockError);

      const result = await deleteUserDocument('test-uid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('setUserField', () => {
    it('should update specific field', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.updateDoc).mockResolvedValue(undefined);

      const result = await setUserField('test-uid', 'streak', 25);

      expect(result.success).toBe(true);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ streak: 25 })
      );
    });
  });

  describe('BatchSaveManager', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should queue updates and flush after debounce', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockResolvedValue(undefined);

      const manager = new BatchSaveManager('test-uid', { debounceMs: 50 });

      manager.queueUpdates({ streak: 10 });
      manager.queueUpdates({ calmPoints: 100 });

      expect(firestore.setDoc).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      await Promise.resolve();

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ streak: 10, calmPoints: 100 }),
        { merge: true }
      );
    });

    it('should flush immediately when requested', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockResolvedValue(undefined);

      const manager = new BatchSaveManager('test-uid');

      manager.queueUpdates({ streak: 15 });
      await manager.flush();

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should track pending updates count', () => {
      const manager = new BatchSaveManager('test-uid');

      expect(manager.getPendingCount()).toBe(0);

      manager.queueUpdates({ streak: 10 });
      expect(manager.getPendingCount()).toBe(1);

      manager.queueUpdates({ calmPoints: 100 });
      expect(manager.getPendingCount()).toBe(2);
    });

    it('should clear pending updates', () => {
      const manager = new BatchSaveManager('test-uid');

      manager.queueUpdates({ streak: 10 });
      expect(manager.getPendingCount()).toBe(1);

      manager.clear();
      expect(manager.getPendingCount()).toBe(0);
    });
  });

  describe('documentExists', () => {
    it('should return true when document exists', async () => {
      const mockDocSnap = { exists: () => true };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockResolvedValue(mockDocSnap);

      const result = await documentExists('test-uid');

      expect(result).toBe(true);
    });

    it('should return false when document does not exist', async () => {
      const mockDocSnap = { exists: () => false };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockResolvedValue(mockDocSnap);

      const result = await documentExists('test-uid');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.getDoc).mockRejectedValue(new Error('Network error'));

      const result = await documentExists('test-uid');

      expect(result).toBe(false);
    });
  });

  describe('mergeUserData', () => {
    it('should merge data into document', async () => {
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockResolvedValue(undefined);

      const data = { streak: 10 };
      const result = await mergeUserData('test-uid', data);

      expect(result.success).toBe(true);
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        data,
        { merge: true }
      );
    });

    it('should return error on failure', async () => {
      const mockError = {
        code: 'permission-denied',
        message: 'Permission denied',
      };
      (firestore.doc).mockReturnValue({ id: 'test-uid' });
      (firestore.setDoc).mockRejectedValue(mockError);

      const result = await mergeUserData('test-uid', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });
});
