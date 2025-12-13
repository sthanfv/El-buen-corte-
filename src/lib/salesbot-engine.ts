import { db } from '@/firebase/client';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Product } from '@/types/products';
import { SalesBotContext, SalesBotMessage, SalesBotAction } from '@/types/salesbot';
import { SALESBOT_MESSAGES, SALESBOT_ACTIONS, fillMessage, formatPrice, suggestOccasion } from './salesbot-messages';

export class SalesBotEngine {
    private context: SalesBotContext;
    private allProducts: Product[] = [];
    private shownMessages: Set<string> = new Set();

    constructor(context: SalesBotContext) {
        this.context = context;
    }

    // ✅ Fetch products from Firestore in real-time
    async loadProducts(): Promise<void> {
        try {
            const productsRef = collection(db, 'products');
            const snapshot = await getDocs(productsRef);

            this.allProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Product));
        } catch (error) {
            // ✅ SECURITY: Fail silently
            this.allProducts = [];
        }
    }

    // Update context dynamically
    updateContext(updates: Partial<SalesBotContext>): void {
        this.context = { ...this.context, ...updates };
    }

    // Main decision engine
    async evaluateAndGetMessage(): Promise<SalesBotMessage | null> {
        // Load fresh data from Firestore
        await this.loadProducts();

        const messages: SalesBotMessage[] = [];

        // Evaluate all rules and collect potential messages
        const stockUrgency = this.checkStockUrgency();
        if (stockUrgency) messages.push(stockUrgency);

        const indecision = this.checkIndecision();
        if (indecision) messages.push(indecision);

        const cartHesitation = this.checkCartHesitation();
        if (cartHesitation) messages.push(cartHesitation);

        const categoryInterest = this.checkCategoryInterest();
        if (categoryInterest) messages.push(categoryInterest);

        const emptyCart = this.checkEmptyCart();
        if (emptyCart) messages.push(emptyCart);

        // ✅ ANTI-SPAM: Filter already shown messages
        const newMessages = messages.filter(msg => !this.shownMessages.has(msg.message));

        if (newMessages.length === 0) return null;

        // Get highest priority message
        const selected = newMessages.sort((a, b) => b.priority - a.priority)[0];

        // Mark as shown
        this.shownMessages.add(selected.message);

        return selected;
    }

    // RULE: Stock Urgency (HIGHEST PRIORITY)
    private checkStockUrgency(): SalesBotMessage | null {
        if (!this.context.currentProduct) return null;

        const product = this.context.currentProduct;
        const stock = product.stock || 0;

        if (stock === 1) {
            return {
                message: fillMessage(SALESBOT_MESSAGES.STOCK_URGENCY.CRITICAL, {
                    productName: product.name,
                    viewers: Math.floor(Math.random() * 3) + 2, // Simulated viewers
                }),
                icon: 'alert',
                actions: [
                    {
                        type: 'button',
                        label: 'Añadir al Carrito',
                        action: SALESBOT_ACTIONS.ADD_TO_CART,
                        primary: true,
                    },
                    {
                        type: 'button',
                        label: 'Cerrar',
                        action: SALESBOT_ACTIONS.CLOSE,
                    },
                ],
                ruleId: 'stock_critical',
                priority: 100,
            };
        }

        if (stock > 0 && stock <= 3) {
            return {
                message: fillMessage(SALESBOT_MESSAGES.STOCK_URGENCY.LOW, {
                    productName: product.name,
                    stock: stock,
                }),
                icon: 'alert',
                actions: [
                    {
                        type: 'button',
                        label: 'Añadir al Carrito',
                        action: SALESBOT_ACTIONS.ADD_TO_CART,
                        primary: true,
                    },
                ],
                ruleId: 'stock_low',
                priority: 90,
            };
        }

        return null;
    }

    // RULE: Indecision (with product context)
    private checkIndecision(): SalesBotMessage | null {
        if (!this.context.currentProduct) return null;

        const product = this.context.currentProduct;
        const stock = product.stock || 0;

        let message = '';
        let actions: SalesBotAction[] = [];

        if (product.badge === 'Premium') {
            message = fillMessage(SALESBOT_MESSAGES.INDECISION.PREMIUM, {
                productName: product.name,
                origin: product.details?.origen || 'origen premium',
                aging: product.details?.maduracion || 'maduración especial',
            });
            actions = [
                {
                    type: 'button',
                    label: 'Ver Detalles',
                    action: SALESBOT_ACTIONS.VIEW_PRODUCT,
                    primary: true,
                },
                {
                    type: 'button',
                    label: 'Añadir al Carrito',
                    action: SALESBOT_ACTIONS.ADD_TO_CART,
                },
            ];
        } else if (stock > 5) {
            const occasion = suggestOccasion(product.category, product.badge);
            message = fillMessage(SALESBOT_MESSAGES.INDECISION.WITH_STOCK, {
                productName: product.name,
                stock: stock,
                occasion: occasion,
            });
            actions = [
                {
                    type: 'button',
                    label: 'Añadir al Carrito',
                    action: SALESBOT_ACTIONS.ADD_TO_CART,
                    primary: true,
                },
            ];
        } else {
            message = SALESBOT_MESSAGES.INDECISION.DEFAULT;
            actions = [
                {
                    type: 'button',
                    label: 'Ver Más Info',
                    action: SALESBOT_ACTIONS.VIEW_PRODUCT,
                },
            ];
        }

        return {
            message,
            icon: 'sparkles',
            actions,
            ruleId: 'indecision',
            priority: 60,
        };
    }

    // RULE: Cart Hesitation (with real cart data)
    private checkCartHesitation(): SalesBotMessage | null {
        const cartCount = this.context.cartItems.length;
        if (cartCount === 0) return null;

        let message = '';
        let actions: SalesBotAction[] = [];

        if (cartCount === 1) {
            const productName = this.context.cartItems[0]?.name || 'producto';
            message = fillMessage(SALESBOT_MESSAGES.CART_HESITATION.SINGLE, {
                productName,
            });
        } else {
            const totalPrice = formatPrice(this.context.totalCartValue);
            message = fillMessage(SALESBOT_MESSAGES.CART_HESITATION.MULTIPLE, {
                count: cartCount,
                totalPrice,
            });
        }

        actions = [
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
        ];

        return {
            message,
            icon: 'cart',
            actions,
            ruleId: 'cart_hesitation',
            priority: 70,
        };
    }

    // RULE: Category Interest (with real alternatives from Firestore)
    private checkCategoryInterest(): SalesBotMessage | null {
        if (!this.context.currentCategory) return null;

        const alternatives = this.allProducts
            .filter(p => p.category === this.context.currentCategory && p.stock > 0)
            .slice(0, 3)
            .map(p => p.name)
            .join(', ');

        if (!alternatives) return null;

        const message = fillMessage(SALESBOT_MESSAGES.CATEGORY_INTEREST.WITH_ALTERNATIVES, {
            category: this.context.currentCategory,
            alternatives: alternatives,
        });

        return {
            message,
            icon: 'trending',
            actions: [
                {
                    type: 'link',
                    label: `Ver más de ${this.context.currentCategory}`,
                    action: `/?categoria=${this.context.currentCategory}`,
                    primary: true,
                },
            ],
            ruleId: 'category_interest',
            priority: 50,
        };
    }

    // RULE: Empty Cart (with personalized suggestion)
    private checkEmptyCart(): SalesBotMessage | null {
        if (this.context.cartItems.length > 0) return null;
        if (this.context.viewedProducts.length < 3) return null;

        // Find best suggestion based on viewed products
        const viewedCategories = this.context.viewedProducts.map(p => p.category);
        const topCategory = this.getMostFrequent(viewedCategories);

        const suggestion = this.allProducts.find(
            p => p.category === topCategory && p.stock > 0 && p.badge === 'Premium'
        ) || this.allProducts.find(p => p.stock > 0);

        if (!suggestion) {
            const message = fillMessage(SALESBOT_MESSAGES.EMPTY_CART.VIEWED_MANY, {
                count: this.context.viewedProducts.length,
            });

            return {
                message,
                icon: 'sparkles',
                ruleId: 'empty_cart',
                priority: 40,
            };
        }

        const message = fillMessage(SALESBOT_MESSAGES.EMPTY_CART.WITH_SUGGESTION, {
            suggestedProduct: suggestion.name,
            price: formatPrice(suggestion.pricePerKg),
        });

        return {
            message,
            icon: 'sparkles',
            actions: [
                {
                    type: 'link',
                    label: `Ver ${suggestion.name}`,
                    action: `/#producto-${suggestion.id}`,
                    primary: true,
                },
            ],
            ruleId: 'empty_cart_suggestion',
            priority: 45,
        };
    }

    // Helper: Get most frequent item in array
    private getMostFrequent(arr: string[]): string {
        const freq: Record<string, number> = {};
        arr.forEach(item => {
            freq[item] = (freq[item] || 0) + 1;
        });
        return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b, arr[0]);
    }
}
