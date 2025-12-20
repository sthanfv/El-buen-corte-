import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  pricePerKg: z.number().positive('El precio debe ser positivo'),
  category: z.string().min(1, 'La categoría es requerida'),
  stock: z.number().int().nonnegative('El stock no puede ser negativo'),
  images: z.array(
    z.object({
      src: z.string().url('URL de imagen inválida'),
      alt: z.string(),
      aiHint: z.string().optional(),
    })
  ),
  badge: z.string().optional(),
  details: z
    .object({
      corte: z.string(),
      maduracion: z.string(),
      origen: z.string().optional(),
      grasificacion: z.string().optional(),
    })
    .optional(),
  pairing: z.string().optional(),
  reviews: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(5),
  
  // ✅ SOLUCIÓN AL DILEMA DEL CARNICERO: Peso Variable
  isFixedPrice: z.boolean().default(false).describe('Si true, el producto se vende por pieza a precio fijo, no por kg'),
  weightLabel: z.string().optional().describe('Etiqueta de peso visible (ej: "Aprox. 900g - 1.1kg")'),
  minWeight: z.number().positive().optional().describe('Peso mínimo garantizado en kg'),
  maxWeight: z.number().positive().optional().describe('Peso máximo esperado en kg'),
  averageWeight: z.number().positive().optional().describe('Peso promedio usado para calcular precio fijo'),
  fixedPrice: z.number().positive().optional().describe('Precio fijo de la pieza (calculado con margen de seguridad)'),
});

export type ProductInput = z.infer<typeof ProductSchema>;

