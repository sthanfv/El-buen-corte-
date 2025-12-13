import { Product } from '@/types/products';

export interface SalesBotContext {
    currentProduct: Product | null;
    currentCategory: string | null;
    viewedProducts: Product[];
    cartItems: any[];
    totalCartValue: number;
    isFirstVisit: boolean;
    previousProduct: Product | null;
}

export interface SalesBotAction {
    type: 'link' | 'button' | 'close';
    label: string;
    action: string; // URL or action name
    primary?: boolean;
}

export interface SalesBotMessage {
    message: string;
    icon: 'sparkles' | 'cart' | 'trending' | 'alert' | 'info';
    actions?: SalesBotAction[];
    ruleId: string;
    priority: number; // Higher = more urgent
}
