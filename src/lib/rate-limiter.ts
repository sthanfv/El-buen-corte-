import { db } from '@/firebase/client';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface RateLimitEntry {
    ipAddress: string;
    endpoint: string;
    timestamp: number;
}

/**
 * Checks if an IP address has exceeded rate limits
 * Limits: 5 orders per hour per IP
 */
export async function checkRateLimit(ipAddress: string): Promise<void> {
    if (!ipAddress) {
        throw new Error('IP address is required for rate limiting');
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    try {
        const rateLimitsRef = collection(db, 'rate_limits');
        const q = query(
            rateLimitsRef,
            where('ipAddress', '==', ipAddress),
            where('endpoint', '==', '/api/orders/create'),
            where('timestamp', '>', now - oneHour)
        );

        const snapshot = await getDocs(q);

        // ✅ SECURITY: Limit is 5 orders per hour
        if (snapshot.size >= 5) {
            throw new Error(
                'Has alcanzado el límite de pedidos por hora. Por favor intenta más tarde.'
            );
        }

        // Record this check
        await addDoc(rateLimitsRef, {
            ipAddress,
            endpoint: '/api/orders/create',
            timestamp: now,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        if ((error as Error).message.includes('límite de pedidos')) {
            throw error;
        }
        // ✅ SECURITY: If Firestore fails, allow the request (fail-open for UX)
        // In production, you might want to fail-closed
    }
}

/**
 * Gets the client's IP address from request headers
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIP(request: Request): string {
    // Try various headers in order of preference
    const headers = request.headers;

    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Fallback
    return 'unknown';
}

/**
 * Cleans up old rate limit entries (should run periodically)
 * Can be called from a cron job or Cloud Function
 */
export async function cleanupOldRateLimits(): Promise<void> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    try {
        const rateLimitsRef = collection(db, 'rate_limits');
        const q = query(rateLimitsRef, where('timestamp', '<', oneDayAgo));

        const snapshot = await getDocs(q);

        // Note: In production, use batch deletes for efficiency
        // For now, this is a simple implementation
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        // ✅ SECURITY: Fail silently
    }
}
