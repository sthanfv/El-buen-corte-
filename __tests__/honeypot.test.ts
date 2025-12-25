import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createOrder } from '@/app/api/orders/create/route';
import { firebaseMocks } from './vitest.setup';

/**
 * Honeypot Integration Test (MANDATO-FILTRO)
 */
describe('Honeypot Logic (Defensa Proactiva)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe detectar un bot si el campo business_fax está lleno', async () => {
    const payload = {
      customerInfo: {
        customerName: 'Cyber Bot',
        customerPhone: '1234567890',
        customerAddress: 'Calle Falsa 123',
        city: 'Bogota',
      },
      items: [
        {
          id: '1',
          name: 'Product 1',
          finalPrice: 100,
          pricePerKg: 10,
          selectedWeight: 1,
        },
      ],
      total: 100,
      paymentMethod: 'efectivo',
      business_fax: 'I AM A BOT', // 🍯 El campo trampa
    };

    const req = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: 'Bearer valid_token' },
    });

    const res = await createOrder(req);
    const data = await res.json();

    // 1. Debe devolver el objeto conforme a route.ts (ok: true)
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.id).toMatch(/^fake_ord_/);

    // 2. No debe haber creado el pedido, pero SÍ debe haber registrado el bloqueo de seguridad
    // Verificamos que se llamó a .set() para registrar el BOT_AUTOMATION
    expect(firebaseMocks.set).toHaveBeenCalled();
  });

  it('Debe permitir pedidos legítimos si el campo business_fax está vacío', async () => {
    const payload = {
      customerInfo: {
        customerName: 'Humano Real',
        customerPhone: '1234567890',
        customerAddress: 'Calle Falsa 123',
        city: 'Bogota',
      },
      items: [
        {
          id: '1',
          name: 'Product 1',
          finalPrice: 100,
          pricePerKg: 10,
          selectedWeight: 1,
        },
      ],
      total: 100,
      paymentMethod: 'efectivo',
      habeasDataAccepted: true,
      business_fax: '',
    };

    vi.mock('resend', () => {
      return {
        Resend: vi.fn().mockImplementation(function (this: any) {
          this.emails = {
            send: vi
              .fn()
              .mockResolvedValue({ data: { id: 'mock_id' }, error: null }),
          };
        }),
      };
    });

    firebaseMocks.get.mockResolvedValue({
      exists: true,
      data: () => ({ stock: 100 }),
    });

    const req = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: 'Bearer valid_token' },
    });

    const res = await createOrder(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(firebaseMocks.set).toHaveBeenCalled();
  });
});
