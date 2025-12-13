import { useEffect, useRef } from 'react';
import { db } from '@/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAnonymousAuth } from './use-anonymous-auth';
import { usePathname } from 'next/navigation';

export type ActivityType = 'view_page' | 'view_product' | 'add_to_cart' | 'dwell_high' | 'scroll_depth';

interface ActivityPayload {
    productId?: string;
    category?: string;
    price?: number;
    metadata?: any;
}

export function useActivityTracker() {
    const { user } = useAnonymousAuth();
    const pathname = usePathname();
    const startTime = useRef<number>(Date.now());
    const maxScroll = useRef<number>(0);

    // Helper to log event
    const logEvent = async (type: ActivityType, payload: ActivityPayload = {}) => {
        if (!user) return;

        try {
            // ✅ SECURITY: Get minimal device info (not full user-agent)
            const getDeviceType = () => {
                const ua = navigator.userAgent;
                if (ua.includes('Mobile')) return 'Mobile';
                if (ua.includes('Tablet')) return 'Tablet';
                return 'Desktop';
            };

            await addDoc(collection(db, 'user_activity'), {
                uid: user.uid,
                isAnonymous: user.isAnonymous,
                type,
                path: pathname,
                payload,
                timestamp: serverTimestamp(),
                device: getDeviceType(),
            });
        } catch (error) {
            // ✅ SECURITY: Fail silently to not impact UX, no console.warn
        }
    };

    // Track Page Views & Dwell Time
    useEffect(() => {
        if (!user) return;

        // 1. Log Page View
        logEvent('view_page', { metadata: { title: document.title } });

        // Reset timers
        startTime.current = Date.now();
        maxScroll.current = 0;

        // 2. Track Dwell Time on Unmount (or Change)
        return () => {
            const duration = (Date.now() - startTime.current) / 1000;
            if (duration > 15) {
                // Only log if they stayed > 15s (Meaningful Visit)
                logEvent('dwell_high', { metadata: { duration } });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, user]);

    return { logEvent };
}
