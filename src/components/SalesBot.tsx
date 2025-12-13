'use client';

import { useState, useEffect } from 'react';
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ShoppingBag, TrendingUp, AlertTriangle, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart-provider';

// Internal Memory for the Session
interface SessionMemory {
    viewedCategories: Record<string, number>;
    viewedProducts: string[];
    lastInteraction: number;
    shownMessages: Set<string>;
}

export function SalesBot() {
    const { logEvent } = useActivityTracker();
    const pathname = usePathname();
    const { order } = useCart();

    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [BotIcon, setBotIcon] = useState<LucideIcon>(Sparkles as LucideIcon);
    const [memory, setMemory] = useState<SessionMemory>({
        viewedCategories: {},
        viewedProducts: [],
        lastInteraction: Date.now(),
        shownMessages: new Set(),
    });

    // ✅ FIX: Update lastInteraction on navigation
    useEffect(() => {
        setMemory(prev => ({
            ...prev,
            lastInteraction: Date.now()
        }));
    }, [pathname]);

    // CLOSE BOT
    const dismiss = () => setIsVisible(false);

    // --- HEURISTIC ENGINE (The "Brain") ---
    useEffect(() => {
        const timer = setInterval(() => {
            evaluateHeuristics();
        }, 5000); // Check rules every 5 seconds

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, order]); // Removed 'memory' from deps to avoid infinite loop with setMemory in evaluateHeuristics

    const evaluateHeuristics = () => {
        if (isVisible) return; // Don't interrupt if already speaking

        const now = Date.now();
        const timeOnPage = (now - memory.lastInteraction) / 1000;
        const isProductPage = pathname.startsWith('/product/');

        // RULE 1: INDECISION (Dwell time > 30s on product)
        if (isProductPage && timeOnPage > 30 && timeOnPage < 35) {
            triggerBot("¿Tienes dudas sobre este corte? Es ideal para la parrilla.", Sparkles, 'indecision');
            return;
        }

        // RULE 2: CART HESITATION (Items in cart, no checkout > 1 min)
        if (order.length > 0 && timeOnPage > 60 && !pathname.includes('cart')) {
            triggerBot(`Tienes ${order.length} corte${order.length > 1 ? 's' : ''} delicioso${order.length > 1 ? 's' : ''} esperando. ¿Los preparamos?`, ShoppingBag, 'cart_hesitation');
            return;
        }

        // RULE 3: CATEGORY OBSESSION (Viewed 2+ items of same category)
        const viewedCategories = Object.keys(memory.viewedCategories);
        if (viewedCategories.length > 0) {
            const topCategory = viewedCategories.reduce((a, b) =>
                memory.viewedCategories[a] > memory.viewedCategories[b] ? a : b
            );

            if (memory.viewedCategories[topCategory] >= 2 && timeOnPage > 15 && timeOnPage < 20) {
                triggerBot(
                    `Veo que te interesa ${topCategory}. Tenemos más opciones premium de este tipo.`,
                    TrendingUp,
                    'category_obsession'
                );
                return;
            }
        }

        // RULE 4: EMPTY CART ENCOURAGEMENT (After viewing 3+ products, no items in cart)
        if (memory.viewedProducts.length >= 3 && order.length === 0 && timeOnPage > 40 && timeOnPage < 45) {
            triggerBot(
                "Has visto varios cortes increíbles. ¿Te ayudo a elegir el perfecto?",
                Sparkles,
                'empty_cart_encouragement'
            );
            return;
        }
    };

    const triggerBot = (msg: string, Icon: LucideIcon, ruleId: string) => {
        // ✅ ANTI-SPAM: Don't repeat messages
        if (memory.shownMessages.has(msg)) return;

        setMessage(msg);
        setBotIcon(Icon);
        setIsVisible(true);

        // Track bot trigger for analytics
        logEvent('view_page', {
            metadata: {
                salesbot_triggered: true,
                rule: ruleId
            }
        });

        // Mark message as shown
        setMemory(prev => ({
            ...prev,
            shownMessages: new Set(prev.shownMessages).add(msg)
        }));

        // Auto-dismiss after 10s
        setTimeout(() => setIsVisible(false), 10000);
    };

    // --- RETURN VISITOR CHECK ---
    useEffect(() => {
        try {
            const lastVisit = localStorage.getItem('bc_last_visit');
            const now = Date.now();

            // ✅ SECURITY: Validate localStorage value
            if (lastVisit && /^\d+$/.test(lastVisit)) {
                const timestamp = parseInt(lastVisit, 10);

                // ✅ SECURITY: Validate timestamp is sane
                if (!isNaN(timestamp) && timestamp < now && timestamp > (now - 30 * 24 * 60 * 60 * 1000)) {
                    const days = (now - timestamp) / (1000 * 60 * 60 * 24);
                    if (days > 1 && days < 7) {
                        setTimeout(() =>
                            triggerBot("¡Qué bueno verte de nuevo! Tenemos cortes frescos hoy.", TrendingUp, 'return_visitor'),
                            2000
                        );
                    }
                }
            }
            localStorage.setItem('bc_last_visit', now.toString());
        } catch (error) {
            // ✅ SECURITY: Fail silently if localStorage is disabled
        }
    }, []);

    // Public method to track product views (to be called from product pages)
    useEffect(() => {
        // Expose method globally for product pages to call
        if (typeof window !== 'undefined') {
            (window as any).salesBotTrackCategory = (category: string) => {
                setMemory(prev => ({
                    ...prev,
                    viewedCategories: {
                        ...prev.viewedCategories,
                        [category]: (prev.viewedCategories[category] || 0) + 1
                    }
                }));
            };

            (window as any).salesBotTrackProduct = (productId: string) => {
                setMemory(prev => ({
                    ...prev,
                    viewedProducts: [...new Set([...prev.viewedProducts, productId])]
                }));
            };
        }
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 max-w-sm w-full md:w-80"
            >
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 flex items-start gap-4 backdrop-blur-sm bg-opacity-95">
                    <div className="bg-primary/10 p-2 rounded-full shrink-0">
                        <BotIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                            <h5 className="font-semibold text-sm text-primary">Asistente Virtual</h5>
                            <button onClick={dismiss} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
