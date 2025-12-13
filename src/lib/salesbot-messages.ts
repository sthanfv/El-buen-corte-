// Sistema de mensajes pre-escritos con placeholders dinámicos
export const SALESBOT_MESSAGES = {
    // Mensajes de Indecisión
    INDECISION: {
        WITH_STOCK: "¿Dudas sobre el {productName}? Tenemos {stock} unidades disponibles. Es perfecto para {occasion}.",
        LOW_STOCK: "⚠️ Solo quedan {stock} unidades del {productName}. ¿Lo añadimos a tu pedido?",
        PREMIUM: "El {productName} es nuestro corte premium. {origin}, {aging}. ¿Te interesa?",
        DEFAULT: "¿Tienes dudas sobre este corte? Puedo ayudarte a decidir.",
    },

    // Carrito Abandonado
    CART_HESITATION: {
        SINGLE: "Tienes el {productName} esperando en tu carrito. ¿Continuamos con tu pedido?",
        MULTIPLE: "Tienes {count} cortes deliciosos esperando ({totalPrice}). ¿Los preparamos?",
        WITH_SUGGESTION: "Tu carrito tiene {count} productos. ¿Te gustaría agregar {suggestedProduct} para completar tu parrillada?",
    },

    // Category Obsession
    CATEGORY_INTEREST: {
        WITH_ALTERNATIVES: "Veo que te interesa {category}. También tenemos {alternatives} que te pueden gustar.",
        WITH_STOCK: "Te interesa {category}. Tenemos {availableCount} opciones disponibles. ¿Las ves?",
        TRENDING: "{category} es muy popular hoy. Nuestro favorito es {topProduct}.",
    },

    // Stock Urgency
    STOCK_URGENCY: {
        CRITICAL: "⚠️ ¡ÚLTIMA UNIDAD! El {productName} se está agotando. {viewers} personas lo están viendo ahora.",
        LOW: "Solo quedan {stock} unidades del {productName}. Se venden rápido.",
        BACK_SOON: "El {productName} está agotado pero recibimos más el {restockDate}. ¿Te avisamos?",
    },

    // Empty Cart Encouragement
    EMPTY_CART: {
        VIEWED_MANY: "Has visto {count} cortes increíbles. ¿Te ayudo a elegir según tu presupuesto?",
        WITH_SUGGESTION: "Basado en lo que viste, el {suggestedProduct} ({price}) sería perfecto para ti.",
        FIRST_TIME: "¿Primera vez comprando cortes premium? Te recomiendo empezar con {beginnerProduct}.",
    },

    // Return Visitor
    RETURN_VISITOR: {
        WITH_HISTORY: "¡Bienvenido de nuevo! La última vez miraste {lastProduct}. ¿Lo agregamos hoy?",
        NEW_ARRIVALS: "¡Qué bueno verte! Tenemos {newCount} cortes nuevos desde tu última visita.",
        DEFAULT: "¡Qué bueno verte de nuevo! Tenemos cortes frescos hoy.",
    },

    // Price Comparison
    PRICE_INSIGHT: {
        GOOD_DEAL: "El {productName} está {discount}% más barato que el precio regular. ¡Gran oferta!",
        PREMIUM_VALUE: "El {productName} vale cada peso: {origin}, {aging}. Calidad excepcional.",
    },

    // Pairing Suggestions
    PAIRING: {
        WINE: "El {productName} marida perfecto con {pairing}. ¿Necesitas recomendación de vino?",
        SIDES: "Con el {productName} recomendamos {sideSuggestion}. ¿Armamos el combo?",
    },

    // Occasion-Based
    OCCASION: {
        WEEKEND: "¿Parrillada de fin de semana? El {productName} es ideal para {servings} personas.",
        SPECIAL: "Para una ocasión especial, el {productName} ({badge}) es la elección perfecta.",
    },
};

// Actions disponibles para el bot
export const SALESBOT_ACTIONS = {
    VIEW_PRODUCT: "view_product",
    ADD_TO_CART: "add_to_cart",
    VIEW_CATEGORY: "view_category",
    CHECKOUT: "checkout",
    VIEW_ALTERNATIVES: "view_alternatives",
    NOTIFY_RESTOCK: "notify_restock",
    APPLY_DISCOUNT: "apply_discount",
    CLOSE: "close",
};

// Helper para reemplazar placeholders
export function fillMessage(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

// Helper para formatear precio
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(price);
}

// Determinar ocasión sugerida basada en el producto
export function suggestOccasion(category: string, badge?: string): string {
    if (badge === 'Premium') return 'una ocasión especial';
    if (category === 'Res') return 'asados familiares';
    if (category === 'Cerdo') return 'parrilladas casuales';
    if (category === 'Pollo') return 'comidas diarias';
    return 'tu próxima parrillada';
}
