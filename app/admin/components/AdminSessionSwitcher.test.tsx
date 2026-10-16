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
        document.body.innerHTML = ''
    })

    it('renders Autumn and Winter corresponding buttons for A26 and highlights Autumn', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="A26" basePath="/admin/allocations" />)
        })

        const autumnBtn = container.querySelectorAll('button')[0] as HTMLButtonElement
        const winterBtn = container.querySelectorAll('button')[1] as HTMLButtonElement
        const otherBtn = container.querySelectorAll('button')[2] as HTMLButtonElement

        expect(autumnBtn.textContent).toContain('Automne 2026')
        expect(autumnBtn.className).toContain('btn-primary')

        expect(winterBtn.textContent).toContain('Hiver 2027')
        expect(winterBtn.className).not.toContain('btn-primary')

        expect(otherBtn.textContent).toContain('Autre session')

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

    it('opens modal on "Autre session" and allows navigating to a custom session', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="A26" basePath="/admin/allocations" />)
        })

        const otherBtn = container.querySelectorAll('button')[2] as HTMLButtonElement

        // Modal shouldn't be open initially
        expect(document.body.textContent).not.toContain('Sélectionner une autre session')

        // Open modal
        act(() => {
            otherBtn.click()
        })

        expect(document.body.textContent).toContain('Sélectionner une autre session')

        // Select year input inside modal
        const yearInput = document.querySelector('input[type="number"]') as HTMLInputElement
        expect(yearInput).not.toBeNull()

        // Change season using select dropdown
        const select = document.querySelector('select[name="saison"]') as HTMLSelectElement
        expect(select).not.toBeNull()
        act(() => {
            select.value = 'Hiver'
            select.dispatchEvent(new Event('change', { bubbles: true }))
        })

        // Click "Accéder" button
        const submitBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.trim() === 'Accéder'
        ) as HTMLButtonElement

        act(() => {
            submitBtn.click()
        })

        // Should navigate to /admin/allocations/H26
        expect(mockPush).toHaveBeenCalledWith('/admin/allocations/H26')

        // Modal should be closed
        expect(document.body.textContent).not.toContain('Sélectionner une autre session')
    })

    it('closes modal when clicking Annuler', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="A26" basePath="/admin/allocations" />)
        })

        const otherBtn = container.querySelectorAll('button')[2] as HTMLButtonElement

        act(() => {
            otherBtn.click()
        })
        expect(document.body.textContent).toContain('Sélectionner une autre session')

        const cancelBtn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent?.trim() === 'Annuler'
        ) as HTMLButtonElement

        act(() => {
            cancelBtn.click()
        })

        expect(document.body.textContent).not.toContain('Sélectionner une autre session')
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('renders link to corresponding task grid with session mode query parameter', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminSessionSwitcher currentSession="A26" basePath="/admin/allocations" />)
        })

        const link = container.querySelector('a[href="/taches/2026?mode=Automne"]') as HTMLAnchorElement
        expect(link).not.toBeNull()
        expect(link.textContent).toContain('Grille des tâches')

        // Test with winter session H27
        act(() => {
            root.render(<AdminSessionSwitcher currentSession="H27" basePath="/admin/allocations" />)
        })
        const winterLink = container.querySelector('a[href="/taches/2026?mode=Hiver"]') as HTMLAnchorElement
        expect(winterLink).not.toBeNull()
    })
})
