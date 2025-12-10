import { render, screen } from '@testing-library/react'
import MeatProductCard from '@/components/MeatProductCard'
import { Product } from '@/types/products'

// Mock dependencies
jest.mock('lucide-react', () => ({
    ShoppingCart: () => 'CartIcon',
    Info: () => 'InfoIcon',
    Flame: () => 'FlameIcon',
    Share2: () => 'ShareIcon',
    Star: () => 'StarIcon',
    Award: () => 'AwardIcon',
    Clock: () => 'ClockIcon',
    Undo2: () => 'UndoIcon',
}))

const mockProduct: Product = {
    id: '1',
    name: 'Tomahawk Premium',
    category: 'Res',
    pricePerKg: 150000,
    stock: 10,
    rating: 5,
    reviews: 12,
    images: [{ src: '/img.jpg', alt: 'img', aiHint: 'img' }],
    details: { origen: 'USA' },
    pairing: 'Vino Tinto',
    badge: 'Best Seller'
}

import { ToastProvider } from '@/components/ui/toast'

describe.skip('MeatProductCard', () => {
    it('renders product information correctly', () => {
        // Mock onAddToCart function
        const onAddToCart = jest.fn()

        render(
            <ToastProvider>
                <MeatProductCard product={mockProduct} onAddToCart={onAddToCart} />
            </ToastProvider>
        )

        expect(screen.getByText('Tomahawk Premium')).toBeInTheDocument()
        // Using loose matcher for formatted price to avoid locale issues
        expect(screen.getByText(/150/)).toBeInTheDocument()
        expect(screen.getByText('Best Seller')).toBeInTheDocument()
    })

    it('shows generic category image if no image provided', () => {
        const noImgProduct = { ...mockProduct, images: [] }
        const onAddToCart = jest.fn()

        render(
            <ToastProvider>
                <MeatProductCard product={noImgProduct} onAddToCart={onAddToCart} />
            </ToastProvider>
        )
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', expect.stringContaining('placehold.co'))
    })
})
