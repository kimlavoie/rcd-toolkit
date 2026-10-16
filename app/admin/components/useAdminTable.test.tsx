// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useAdminTable } from './useAdminTable'

// Configure React act environment
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('useAdminTable', () => {
    it('filters data using filterFn even when search is empty', () => {
        interface Item {
            id: string
            session: string
            name: string
        }

        const items: Item[] = [
            { id: '1', session: 'A26', name: 'Allocation 1' },
            { id: '2', session: 'H26', name: 'Allocation 2' },
            { id: '3', session: 'A26', name: 'Allocation 3' }
        ]

        let hookResult: any = null

        function TestComponent({ selectedSession }: { selectedSession: string }) {
            hookResult = useAdminTable<Item>({
                data: items,
                initialSortKey: 'name',
                filterFn: (item, search) => {
                    if (item.session !== selectedSession) return false
                    if (!search) return true
                    return item.name.toLowerCase().includes(search.toLowerCase())
                }
            })
            return null
        }

        const container = document.createElement('div')
        const root = createRoot(container)

        act(() => {
            root.render(<TestComponent selectedSession="A26" />)
        })

        // When search is empty, only A26 items should be returned
        expect(hookResult.sortedData).toHaveLength(2)
        expect(hookResult.sortedData.map((i: Item) => i.id)).toEqual(['1', '3'])

        // When search is updated
        act(() => {
            hookResult.setSearch('Allocation 3')
        })

        expect(hookResult.sortedData).toHaveLength(1)
        expect(hookResult.sortedData[0].id).toBe('3')

        // When switching session to H26 and search is empty
        act(() => {
            hookResult.setSearch('')
            root.render(<TestComponent selectedSession="H26" />)
        })

        expect(hookResult.sortedData).toHaveLength(1)
        expect(hookResult.sortedData[0].id).toBe('2')
    })
})
