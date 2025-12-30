'use client';

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { z } from 'zod';
import { useState, useEffect } from 'react';

// Schema de validación
export const ConfigSchema = z.object({
  contactPhone: z.string().min(10, 'Teléfono requerido (+57...)'),
  contactAddress: z.string().min(5, 'Dirección requerida'),
  contactEmail: z.string().email('Email inválido'),
  instagramUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  facebookUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  twitterUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  footerText: z.string().optional(),
});

export type ConfigData = z.infer<typeof ConfigSchema>;

// ✅ MANDATO-FILTRO: Unified Firestore path
const CONFIG_DOC_PATH = 'general_config/settings';

// Hook para leer la configuración (Frontend)
export function useConfig() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Suscripción en tiempo real a Firestore
    const unsubscribe = onSnapshot(
      doc(db, CONFIG_DOC_PATH),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ConfigData;
          console.log('🔄 Config updated from Firestore:', data);
          setConfig(data);
        } else {
          // Default config si no existe
          console.warn('⚠️ No config found, using defaults');
          setConfig({
            contactPhone: '+57 (300) 123-4567',
            contactAddress: 'Cra 12 # 93 - 15, Bogotá',
            contactEmail: 'contacto@buencorte.co',
            footerText: 'Redefiniendo la experiencia carnívora en Colombia.',
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching config from Firestore:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { config, loading };
}

// Función para guardar (Admin)
export async function saveConfig(data: ConfigData) {
  console.log('💾 Saving config to Firestore:', CONFIG_DOC_PATH, data);
  await setDoc(doc(db, CONFIG_DOC_PATH), data, { merge: true });
}
