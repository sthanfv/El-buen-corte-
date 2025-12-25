import { sendOrderConfirmation, OrderEmailData } from '../src/lib/email';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock Resend
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

// Mock Logger to avoid Firebase init
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Email Service', () => {
  const mockOrderData: OrderEmailData = {
    orderNumber: 12345,
    customerName: 'Juan Perez',
    customerEmail: 'juan@example.com',
    totalAmount: 50000,
    items: [{ name: 'Tomahawk', quantity: 1, price: 50000 }],
  };

  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return mock success if RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    console.warn = vi.fn(); // Suppress warn
    console.log = vi.fn(); // Suppress log

    const result = await sendOrderConfirmation(mockOrderData);

    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    vi.unstubAllEnvs();
  });

  it('should attempt to send email if RESEND_API_KEY is present', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_123');

    // We assume the mock implementation set above works
    const result = await sendOrderConfirmation(mockOrderData);

    expect(result.success).toBe(true);
    vi.unstubAllEnvs();
  });
});
