// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import AdminSessionSwitcher from './AdminSessionSwitcher'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

describe('AdminSessionSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders Autumn and Winter corresponding buttons for A26 and highlights Autumn', () => {
        const container = document.createElement('div')
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="A26" basePath="/admin/allocations" />)
        })

        const autumnBtn = container.querySelector('button:nth-of-type(1)') as HTMLButtonElement
        const winterBtn = container.querySelector('button:nth-of-type(2)') as HTMLButtonElement
        const link = container.querySelector('a') as HTMLAnchorElement

        expect(autumnBtn.textContent).toContain('Automne 2026')
        expect(autumnBtn.className).toContain('btn-primary')

        expect(winterBtn.textContent).toContain('Hiver 2027')
        expect(winterBtn.className).not.toContain('btn-primary')

        expect(link.getAttribute('href')).toBe('/admin/allocations')

        // Clicking winter button navigates to /admin/allocations/H27
        act(() => {
            winterBtn.click()
        })
        expect(mockPush).toHaveBeenCalledWith('/admin/allocations/H27')

        // Clicking autumn button (already active) does not navigate
        mockPush.mockClear()
        act(() => {
            autumnBtn.click()
        })
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('highlights Winter and navigates to Autumn when on H27', () => {
        const container = document.createElement('div')
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="H27" basePath="/admin/groupes" />)
        })

        const autumnBtn = container.querySelector('button:nth-of-type(1)') as HTMLButtonElement
        const winterBtn = container.querySelector('button:nth-of-type(2)') as HTMLButtonElement

        expect(autumnBtn.textContent).toContain('Automne 2026')
        expect(autumnBtn.className).not.toContain('btn-primary')

        expect(winterBtn.textContent).toContain('Hiver 2027')
        expect(winterBtn.className).toContain('btn-primary')

        act(() => {
            autumnBtn.click()
        })
        expect(mockPush).toHaveBeenCalledWith('/admin/groupes/A26')
    })
})
