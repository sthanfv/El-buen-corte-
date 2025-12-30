import { getAnonymousUserId } from './salesbot-analytics';
import { SalesBotMessage } from '@/types/salesbot';
import { SALESBOT_ACTIONS } from './salesbot-messages';

// ✅ Cart abandonment state
export interface AbandonedCart {
  userId: string;
  cartValue: number;
  itemCount: number;
  abandonedAt: number;
  items: { name: string; price: number }[];
}

// ✅ Recovery message templates
const RECOVERY_MESSAGES = {
  QUICK:
    '🛒 Tienes {count} productos en tu carrito ({value}). ¿Los preparamos?',
  PERSONALIZED:
    '¡No te olvides de {topProduct}! Está esperando en tu carrito junto con {count} productos más.',
  URGENCY:
    '⏰ Tu carrito ({value}) te está esperando. Completa tu pedido ahora y recibe mañana.',
  INCENTIVE:
    '💎 ¡Bonus! Completa tu pedido de {value} ahora y te damos envío express gratis.',
};

// ✅ Detect cart abandonment
export function detectAbandonedCart(
  cartItems: any[],
  lastInteractionTime: number
): AbandonedCart | null {
  if (cartItems.length === 0) return null;

  const now = Date.now();
  const timeSinceLastInteraction = (now - lastInteractionTime) / 1000 / 60; // minutes

  // ✅ TRIGGER: 5 minutes of inactivity with items in cart
  if (timeSinceLastInteraction < 5) return null;

  const cartValue = cartItems.reduce(
    (sum, item) => sum + (item.finalPrice || 0),
    0
  );

  return {
    userId: getAnonymousUserId(),
    cartValue,
    itemCount: cartItems.length,
    abandonedAt: now,
    items: cartItems.map((item) => ({
      name: item.name || 'Producto',
      price: item.finalPrice || 0,
    })),
  };
}

// ✅ Generate recovery message
export function generateRecoveryMessage(cart: AbandonedCart): SalesBotMessage {
  const value = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cart.cartValue);

  let messageTemplate = RECOVERY_MESSAGES.QUICK;
  let priority = 80;

  // Personalize based on cart value
  if (cart.cartValue > 150000) {
    messageTemplate = RECOVERY_MESSAGES.INCENTIVE;
    priority = 95;
  } else if (cart.itemCount > 3) {
    messageTemplate = RECOVERY_MESSAGES.PERSONALIZED;
    priority = 85;
  }

  const message = messageTemplate
    .replace('{count}', cart.itemCount.toString())
    .replace('{value}', value)
    .replace('{topProduct}', cart.items[0]?.name || 'tus productos');

  return {
    message,
    icon: 'cart',
    actions: [
      {
        type: 'button',
        label: 'Ir al Carrito',
        action: SALESBOT_ACTIONS.CHECKOUT,
        primary: true,
      },
      {
        type: 'button',
        label: 'Seguir Viendo',
        action: SALESBOT_ACTIONS.CLOSE,
      },
    ],
    ruleId: 'cart_abandonment_recovery',
    priority,
  };
}

// ✅ Save abandoned cart to localStorage (persistence)
export function saveAbandonedCart(cart: AbandonedCart): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('bc_abandoned_cart', JSON.stringify(cart));
  } catch (error) {
    console.warn('Failed to save abandoned cart:', error);
  }
}

// ✅ Load abandoned cart from localStorage
export function loadAbandonedCart(): AbandonedCart | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('bc_abandoned_cart');
    if (!saved) return null;

    const cart = JSON.parse(saved) as AbandonedCart;

    // ✅ EXPIRY: Only recover carts abandoned within last 24 hours
    const now = Date.now();
    const hoursSinceAbandoned = (now - cart.abandonedAt) / 1000 / 60 / 60;

    if (hoursSinceAbandoned > 24) {
      localStorage.removeItem('bc_abandoned_cart');
      return null;
    }

    return cart;
  } catch (error) {
    console.warn('Failed to load abandoned cart:', error);
    return null;
  }
}

// ✅ Clear abandoned cart (after recovery or checkout)
export function clearAbandonedCart(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('bc_abandoned_cart');
  } catch (error) {
    console.warn('Failed to clear abandoned cart:', error);
  }
}

// ✅ Check if recovery message should be shown
export function shouldShowRecoveryMessage(cart: AbandonedCart): boolean {
  // Don't show if cart was just abandoned (give user some time)
  const minutesSinceAbandoned = (Date.now() - cart.abandonedAt) / 1000 / 60;
  if (minutesSinceAbandoned < 5) return false;

  // Don't show if user already got recovery message recently
  const lastRecovery = localStorage.getItem('bc_last_recovery');
  if (lastRecovery) {
    const minutesSinceLastRecovery =
      (Date.now() - parseInt(lastRecovery)) / 1000 / 60;
    if (minutesSinceLastRecovery < 30) return false;
  }

  return true;
}

// ✅ Mark recovery message as shown
export function markRecoveryShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bc_last_recovery', Date.now().toString());
}
