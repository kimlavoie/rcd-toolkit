// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useGenericAdmin } from './useGenericAdmin'
import { useFirestoreCollection } from '@/app/utilities/firebaseDb'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/app/utilities/firebaseDb', () => ({
    useFirestoreCollection: vi.fn(),
    firebaseDb: {
        allocations: {
            add: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        }
    }
}))

describe('useGenericAdmin', () => {
    const mockAllocations = [
        { id: 'a1', code: 'ALLOC1', description: 'Coordination', quantite: 0.2, session: 'A26' },
        { id: 'a2', code: 'ALLOC2', description: 'Recherche', quantite: 0.1, session: 'H26' },
        { id: 'a3', code: 'ALLOC3', description: 'Projet', quantite: 0.15, session: 'A26' },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useFirestoreCollection).mockReturnValue(mockAllocations as any)
    })

    it('filters data by session when search is empty', () => {
        let hookResult: any = null

        function TestComponent({ targetSession }: { targetSession: string }) {
            hookResult = useGenericAdmin<any>({
                collectionName: 'allocations' as any,
                initialSortKey: 'code',
                filterFn: (a, search) => {
                    if (a.session !== targetSession) return false
                    if (!search) return true
                    const s = search.toLowerCase()
                    return (a.code ?? '').toLowerCase().includes(s) ||
                           (a.description ?? '').toLowerCase().includes(s)
                },
                defaultNewData: { code: '', description: '', quantite: 0 }
            })
            return null
        }

        const container = document.createElement('div')
        const root = createRoot(container)

        act(() => {
            root.render(<TestComponent targetSession="A26" />)
        })

        // Without any search query, only A26 allocations should appear
        expect(hookResult.sortedData).toHaveLength(2)
        expect(hookResult.sortedData.map((a: any) => a.id)).toEqual(['a1', 'a3'])

        // When searching within A26
        act(() => {
            hookResult.setSearch('Coordination')
        })

        expect(hookResult.sortedData).toHaveLength(1)
        expect(hookResult.sortedData[0].id).toBe('a1')

        // When switching session to H26
        act(() => {
            hookResult.setSearch('')
            root.render(<TestComponent targetSession="H26" />)
        })

        expect(hookResult.sortedData).toHaveLength(1)
        expect(hookResult.sortedData[0].id).toBe('a2')
    })
})
