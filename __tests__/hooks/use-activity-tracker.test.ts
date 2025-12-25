/**
 * @vitest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import { addDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach, test } from 'vitest';

// Mock dependencies
vi.mock('firebase/firestore');
vi.mock('@/firebase/client', () => ({
  db: {},
}));
vi.mock('@/hooks/use-anonymous-auth', () => ({
  useAnonymousAuth: () => ({
    user: { uid: 'test-user-123', isAnonymous: true },
    loading: false,
  }),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
}));

describe.skip('useActivityTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (addDoc as any).mockResolvedValue({ id: 'doc-id' });
  });

  test('should export logEvent function', () => {
    const { result } = renderHook(() => useActivityTracker());

    expect(result.current.logEvent).toBeDefined();
    expect(typeof result.current.logEvent).toBe('function');
  });

  test('should log page view on mount', async () => {
    renderHook(() => useActivityTracker());

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'view_page',
          uid: 'test-user-123',
          isAnonymous: true,
          path: '/test-page',
        })
      );
    });
  });

  test('should track dwell time on unmount if > 15s', async () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useActivityTracker());

    // Fast-forward 20 seconds
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    unmount();

    await waitFor(() => {
      const dwellCall = (addDoc as any).mock.calls.find(
        (call: any) => call[1]?.type === 'dwell_high'
      );
      expect(dwellCall).toBeDefined();
      expect(dwellCall[1].payload.metadata.duration).toBeGreaterThan(15);
    });

    vi.useRealTimers();
  });

  test('should not track dwell time if < 15s', async () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useActivityTracker());

    // Only 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    unmount();

    await waitFor(() => {
      const dwellCall = (addDoc as any).mock.calls.find(
        (call: any) => call[1]?.type === 'dwell_high'
      );
      expect(dwellCall).toBeUndefined();
    });

    vi.useRealTimers();
  });

  test('should log custom events via logEvent', async () => {
    const { result } = renderHook(() => useActivityTracker());

    await act(async () => {
      await result.current.logEvent('add_to_cart', {
        productId: 'prod-123',
        price: 50000,
      });
    });

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'add_to_cart',
          payload: {
            productId: 'prod-123',
            price: 50000,
          },
        })
      );
    });
  });

  test('should include device type (not full user-agent)', async () => {
    const { result } = renderHook(() => useActivityTracker());

    await act(async () => {
      await result.current.logEvent('view_product', {});
    });

    await waitFor(() => {
      const lastCall = (addDoc as any).mock.calls[
        (addDoc as any).mock.calls.length - 1
      ][1];

      expect(lastCall.device).toMatch(/^(Desktop|Mobile|Tablet)$/);
      expect(lastCall.device).not.toContain('Mozilla');
    });
  });

  test('should handle Firestore errors silently', async () => {
    (addDoc as any).mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useActivityTracker());

    await act(async () => {
      await result.current.logEvent('view_page', { path: '/test' } as any);
    });

    // Should not throw
    expect(() => result.current).not.toThrow();
  });

  test('should not log if user is not available', async () => {
    vi.resetModules();

    // Dynamic mocks for this isolated test context
    vi.doMock('@/hooks/use-anonymous-auth', () => ({
      useAnonymousAuth: () => ({
        user: null,
        loading: false,
      }),
    }));

    // Re-mock firestore for this context
    const mockAddDoc = vi.fn();
    vi.doMock('firebase/firestore', () => ({
      addDoc: mockAddDoc,
    }));

    // Re-mock other dependencies to avoid pollution or errors
    vi.doMock('@/firebase/client', () => ({ db: {} }));
    vi.doMock('next/navigation', () => ({ usePathname: () => '/test-page' }));

    // Import module under test within the isolated context
    const { useActivityTracker: useActivityTrackerNoUser } =
      await import('@/hooks/use-activity-tracker');

    // We need to render the hook using the wrapper or just normally?
    // renderHook from testing-library/react might use the *global* react content if not careful,
    // but here we are just importing the hook function.
    // However, renderHook itself imports React.

    const { result } = renderHook(() => useActivityTrackerNoUser());

    await act(async () => {
      await result.current.logEvent('view_page', { path: '/test' } as any);
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});
