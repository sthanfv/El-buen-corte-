import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  stock: number;
  images: {
    src: string;
    alt: string;
    aiHint: string;
  }[];
  rating: number;
  reviews: number;
  details: Record<string, string>;
  pairing: string;
  badge: string;
  tags?: string[];

  // ✅ SOLUCIÓN AL DILEMA DEL CARNICERO: Peso Variable
  isFixedPrice?: boolean; // Si true, se vende por pieza a precio fijo
  weightLabel?: string; // Etiqueta visible (ej: "Aprox. 900g - 1.1kg")
  minWeight?: number; // Peso mínimo garantizado en kg
  maxWeight?: number; // Peso máximo esperado en kg
  averageWeight?: number; // Peso promedio para cálculo
  fixedPrice?: number; // Precio fijo de la pieza (si isFixedPrice es true)

  createdAt?: Timestamp;
  tenantId?: string; // ✅ MULTI-TENANT: Aislamiento por negocio
}

export interface OrderItem extends Product {
  orderId: string;
  selectedWeight: number; // en kg
  finalPrice: number; // precio calculado
  weightLabel?: string; // Etiqueta de peso seleccionada
}
