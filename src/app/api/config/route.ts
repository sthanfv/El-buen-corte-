import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

// ✅ Define schema here to avoid importing client hooks
const ConfigSchema = z.object({
  contactPhone: z.string().min(10, 'Teléfono requerido (+57...)'),
  contactAddress: z.string().min(5, 'Dirección requerida'),
  contactEmail: z.string().email('Email inválido'),
  instagramUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  facebookUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  twitterUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  footerText: z.string().optional(),
});

// ✅ GET: Read global config
export async function GET() {
  try {
    const doc = await adminDb
      .collection('general_config')
      .doc('settings')
      .get();

    if (!doc.exists) {
      // Return defaults if no config exists
      return NextResponse.json({
        contactPhone: '+57 (300) 123-4567',
        contactAddress: 'Cra 12 # 93 - 15, Bogotá',
        contactEmail: 'contacto@buencorte.co',
        footerText: 'Redefiniendo la experiencia carnívora en Colombia.',
        instagramUrl: '',
        facebookUrl: '',
        twitterUrl: '',
      });
    }

    return NextResponse.json(doc.data());
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

// ✅ POST: Update global config (NO auth required - solo para testing, cambiar en prod)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate with Zod
    const validated = ConfigSchema.parse(body);

    // Save to Firestore
    await adminDb
      .collection('general_config')
      .doc('settings')
      .set(validated, { merge: true });

    return NextResponse.json({ success: true, data: validated });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: e.errors },
        { status: 400 }
      );
    }

    const message = e instanceof AppError ? e.message : 'Internal Server Error';
    const status = e instanceof AppError ? e.statusCode : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
