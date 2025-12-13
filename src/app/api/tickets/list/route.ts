import { NextResponse } from 'next/headers';
import { adminDb, adminAuth } from '@/lib/firebase';
import { headers } from 'next/headers';
import { TicketSchema, type Ticket } from '@/schemas/order';

// ✅ SECURITY: Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/tickets/list
 * Returns tickets for admin panel
 * Requires admin authentication
 */
export async function GET(req: Request) {
    try {
        // ✅ SECURITY: Verify admin authentication
        const headersList = await headers();
        const authorization = headersList.get('Authorization');

        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (tokenError) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        if (decodedToken.admin !== true) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

        // ✅ Parse query parameters
        const url = new URL(req.url);
        const date = url.searchParams.get('date'); // Format: YYYY-MM-DD
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = adminDb.collection('tickets').orderBy('createdAt', 'desc');

        // Filter by date if provided
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query = query
                .where('createdAt', '>=', startOfDay.toISOString())
                .where('createdAt', '<=', endOfDay.toISOString()) as any;
        }

        // Filter by status if provided
        if (status) {
            query = query.where('status', '==', status) as any;
        }

        // Limit results
        query = query.limit(Math.min(limit, 500)) as any;

        const snapshot = await query.get();

        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Calculate summary stats
        const totalAmount = tickets.reduce((sum, t: any) => sum + (t.totalAmount || 0), 0);
        const summary = {
            totalTickets: tickets.length,
            totalAmount,
            byStatus: {
                pending: tickets.filter((t: any) => t.status === 'pending').length,
                confirmed: tickets.filter((t: any) => t.status === 'confirmed').length,
                preparing: tickets.filter((t: any) => t.status === 'preparing').length,
                delivered: tickets.filter((t: any) => t.status === 'delivered').length,
                cancelled: tickets.filter((t: any) => t.status === 'cancelled').length,
            },
        };

        return NextResponse.json({
            tickets,
            summary,
        });
    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            console.error('[API ERROR] /api/tickets/list:', error);
        }

        return NextResponse.json({ error: 'Error al cargar tickets' }, { status: 500 });
    }
}
