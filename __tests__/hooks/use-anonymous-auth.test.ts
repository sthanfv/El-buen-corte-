/**
 * @vitest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { describe, it, expect, vi, beforeEach, test } from 'vitest';

// Mock Firebase
vi.mock('firebase/auth');
vi.mock('@/firebase/client', () => ({
  auth: {},
}));

describe('useAnonymousAuth', () => {
  const mockUser = {
    uid: 'test-uid-123',
    isAnonymous: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with loading state', () => {
    (onAuthStateChanged as any).mockImplementation(
      (auth: any, callback: any) => {
        // Don't call callback immediately
        return vi.fn();
      }
    );

    const { result } = renderHook(() => useAnonymousAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  test('should set user when already authenticated', async () => {
    (onAuthStateChanged as any).mockImplementation(
      (auth: any, callback: any) => {
        callback(mockUser);
        return vi.fn();
      }
    );

    const { result } = renderHook(() => useAnonymousAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  test('should create anonymous user when no user exists', async () => {
    (signInAnonymously as any).mockResolvedValue({ user: mockUser });

    let authCallback: any;
    (onAuthStateChanged as any).mockImplementation(
      (auth: any, callback: any) => {
        authCallback = callback;
        callback(null); // No user initially
        return vi.fn();
      }
    );

    const { result } = renderHook(() => useAnonymousAuth());

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
    });

    // Simulate Firebase calling callback with new user
    act(() => {
      authCallback(mockUser);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  test('should handle signInAnonymously failure silently', async () => {
    (signInAnonymously as any).mockRejectedValue(new Error('Auth failed'));
    (onAuthStateChanged as any).mockImplementation(
      (auth: any, callback: any) => {
        callback(null);
        return vi.fn();
      }
    );

    const { result } = renderHook(() => useAnonymousAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
    });

    // Should not throw error
    expect(() => result.current).not.toThrow();
  });

  test('should cleanup on unmount', () => {
    const unsubscribe = vi.fn();
    (onAuthStateChanged as any).mockImplementation(() => unsubscribe);

    const { unmount } = renderHook(() => useAnonymousAuth());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
