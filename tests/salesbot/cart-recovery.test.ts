import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectAbandonedCart,
  generateRecoveryMessage,
  saveAbandonedCart,
  loadAbandonedCart,
  clearAbandonedCart,
  shouldShowRecoveryMessage,
  markRecoveryShown,
  type AbandonedCart,
} from '@/lib/salesbot-cart-recovery';

describe('Cart Abandonment Recovery', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    vi.clearAllMocks();
  });

  describe('detectAbandonedCart', () => {
    it('should detect abandoned cart after 5 minutes', () => {
      const cartItems = [
        { name: 'Product A', finalPrice: 50000 },
        { name: 'Product B', finalPrice: 75000 },
      ];

      const lastInteraction = Date.now() - 6 * 60 * 1000; // 6 minutes ago

      const abandoned = detectAbandonedCart(cartItems, lastInteraction);

      expect(abandoned).not.toBeNull();
      expect(abandoned?.itemCount).toBe(2);
      expect(abandoned?.cartValue).toBe(125000);
    });

    it('should not detect if inactivity < 5 minutes', () => {
      const cartItems = [{ name: 'Product A', finalPrice: 50000 }];
      const lastInteraction = Date.now() - 3 * 60 * 1000; // 3 minutes ago

      const abandoned = detectAbandonedCart(cartItems, lastInteraction);

      expect(abandoned).toBeNull();
    });

    it('should not detect if cart is empty', () => {
      const cartItems: any[] = [];
      const lastInteraction = Date.now() - 10 * 60 * 1000;

      const abandoned = detectAbandonedCart(cartItems, lastInteraction);

      expect(abandoned).toBeNull();
    });

    it('should calculate correct cart value', () => {
      const cartItems = [
        { name: 'Item 1', finalPrice: 25000 },
        { name: 'Item 2', finalPrice: 35000 },
        { name: 'Item 3', finalPrice: 40000 },
      ];

      const lastInteraction = Date.now() - 6 * 60 * 1000;

      const abandoned = detectAbandonedCart(cartItems, lastInteraction);

      expect(abandoned?.cartValue).toBe(100000);
      expect(abandoned?.items).toHaveLength(3);
    });
  });

  describe('generateRecoveryMessage', () => {
    it('should generate basic recovery message', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 75000,
        itemCount: 2,
        abandonedAt: Date.now(),
        items: [
          { name: 'Product A', price: 50000 },
          { name: 'Product B', price: 25000 },
        ],
      };

      const message = generateRecoveryMessage(cart);

      expect(message.ruleId).toBe('cart_abandonment_recovery');
      expect(message.icon).toBe('cart');
      expect(message.message).toContain('2');
      expect(message.actions).toHaveLength(2);
    });

    it('should generate high-value message for carts > 150k', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 200000,
        itemCount: 3,
        abandonedAt: Date.now(),
        items: [{ name: 'Premium Product', price: 200000 }],
      };

      const message = generateRecoveryMessage(cart);

      expect(message.priority).toBe(95);
      expect(message.message).toContain('Bonus');
    });

    it('should personalize for multiple items', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 100000,
        itemCount: 5,
        abandonedAt: Date.now(),
        items: [
          { name: 'Tomahawk Steak', price: 50000 },
          { name: 'Product B', price: 50000 },
        ],
      };

      const message = generateRecoveryMessage(cart);

      expect(message.message).toContain('Tomahawk Steak');
    });

    it('should include checkout action', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now(),
        items: [{ name: 'Product', price: 50000 }],
      };

      const message = generateRecoveryMessage(cart);
      const checkoutAction = message.actions?.find(
        (a) => a.action === 'checkout'
      );

      expect(checkoutAction).toBeDefined();
      expect(checkoutAction?.primary).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should save abandoned cart to localStorage', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 75000,
        itemCount: 2,
        abandonedAt: Date.now(),
        items: [{ name: 'Product A', price: 75000 }],
      };

      saveAbandonedCart(cart);

      const stored = localStorage.getItem('bc_abandoned_cart');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.cartValue).toBe(75000);
    });

    it('should load abandoned cart from localStorage', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now(),
        items: [{ name: 'Product', price: 50000 }],
      };

      saveAbandonedCart(cart);
      const loaded = loadAbandonedCart();

      expect(loaded).not.toBeNull();
      expect(loaded?.cartValue).toBe(50000);
      expect(loaded?.itemCount).toBe(1);
    });

    it('should expire carts older than 24 hours', () => {
      const oldCart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        items: [{ name: 'Product', price: 50000 }],
      };

      saveAbandonedCart(oldCart);
      const loaded = loadAbandonedCart();

      expect(loaded).toBeNull();
    });

    it('should clear abandoned cart', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now(),
        items: [{ name: 'Product', price: 50000 }],
      };

      saveAbandonedCart(cart);
      clearAbandonedCart();

      const loaded = loadAbandonedCart();
      expect(loaded).toBeNull();
    });
  });

  describe('shouldShowRecoveryMessage', () => {
    it('should not show immediately after abandonment', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        items: [{ name: 'Product', price: 50000 }],
      };

      const should = shouldShowRecoveryMessage(cart);
      expect(should).toBe(false);
    });

    it('should show after 5 minutes', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        items: [{ name: 'Product', price: 50000 }],
      };

      const should = shouldShowRecoveryMessage(cart);
      expect(should).toBe(true);
    });

    it('should respect 30-minute cooldown', () => {
      const cart: AbandonedCart = {
        userId: 'test_user',
        cartValue: 50000,
        itemCount: 1,
        abandonedAt: Date.now() - 6 * 60 * 1000,
        items: [{ name: 'Product', price: 50000 }],
      };

      markRecoveryShown();
      const should = shouldShowRecoveryMessage(cart);

      expect(should).toBe(false);
    });
  });
});
