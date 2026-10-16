// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import AdminPage from './page'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../utilities/auth', () => ({
    useAuth: () => ({
        user: { role: 'ADMIN', departementId: 'dept1' },
        loading: false
    })
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}))

describe('AdminPage', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('renders distinct sections for manual input menus and task-grid menus', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminPage />)
        })

        // Check the guide banner
        expect(container.textContent).toContain('Menus de saisie directe requise')
        expect(container.textContent).toContain('Manipulable dans le tableau des tâches')

        // Verify Base data items
        const baseItems = ['Enseignants', 'Cours', 'Groupes', 'Allocations', 'Stages']
        baseItems.forEach(item => {
            expect(container.textContent).toContain(item)
        })

        // Verify Task-managed items
        const taskItems = ['Charges', 'Libérations', 'Supervisions', 'CI Réelles']
        taskItems.forEach(item => {
            expect(container.textContent).toContain(item)
        })

        // Check badges
        expect(container.textContent).toContain('✍️ Saisie directe')
        expect(container.textContent).toContain('⚡ Grille des tâches')
    })

    it('filters sections using category filter buttons', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        act(() => {
            root.render(<AdminPage />)
        })

        const filterBtns = Array.from(container.querySelectorAll('button'))
        const saisieFilterBtn = filterBtns.find(b => b.textContent?.includes('Données de base')) as HTMLButtonElement
        const tachesFilterBtn = filterBtns.find(b => b.textContent?.includes('Géré dans les tâches')) as HTMLButtonElement

        // Click Données de base filter
        act(() => {
            saisieFilterBtn.click()
        })

        let cardTitles = Array.from(container.querySelectorAll('.card h4')).map(h => h.textContent)
        expect(cardTitles).toContain('Enseignants')
        expect(cardTitles).toContain('Cours')
        expect(cardTitles).not.toContain('Charges')
        expect(cardTitles).not.toContain('Libérations')

        // Click Géré dans les tâches filter
        act(() => {
            tachesFilterBtn.click()
        })

        cardTitles = Array.from(container.querySelectorAll('.card h4')).map(h => h.textContent)
        expect(cardTitles).toContain('Charges')
        expect(cardTitles).toContain('Libérations')
        expect(cardTitles).not.toContain('Enseignants')
        expect(cardTitles).not.toContain('Cours')
    })
})
