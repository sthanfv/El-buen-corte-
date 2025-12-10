import { cn } from '@/lib/utils'

describe('Utils', () => {
    describe('cn', () => {
        it('merges class names correctly', () => {
            expect(cn('c1', 'c2')).toBe('c1 c2')
        })

        it('handles conditional classes', () => {
            expect(cn('c1', true && 'c2', false && 'c3')).toBe('c1 c2')
        })

        it('resolves tailwind conflicts', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2')
        })
    })
})
