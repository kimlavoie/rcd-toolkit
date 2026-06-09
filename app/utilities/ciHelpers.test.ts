import { describe, it, expect } from 'vitest'
import { calculateSessionCI } from './ciHelpers'
import type { CIEntries } from './ciHelpers'

describe('calculateSessionCI', () => {
    it('calcule la CI et réagit aux changements de données (réactivité pure)', () => {
        const enseignantId = 'e1'
        const session = 'A26'
        const scenario = 'production'

        const baseData: CIEntries = {
            enseignants: [{ id: 'e1', prenom: 'John', nom: 'Doe' }],
            cours: [{ id: 'c1', sigle: 'INF101', nom: 'Intro', heuresTheorie: 2, heuresPratique: 1 }],
            groupes: [{ id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30 }],
            charges: [{ id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production' }],
            liberations: [],
            allocations: [],
            stages: [],
            supervisions: []
        } as any

        // Calcul initial
        const initialCI = calculateSessionCI(enseignantId, session, baseData, scenario)
        
        // Prep = 0.9 * 3 = 2.7
        // Prestation = 3 * 1.2 = 3.6
        // PES = 3 * 30 * 0.04 = 3.6
        // Total = 9.9
        expect(initialCI).toBeCloseTo(9.9, 1)

        // Simuler un changement dans le DataContext (mise à jour d'une charge à 10 semaines)
        const updatedData = {
            ...baseData,
            charges: [{ id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 10, type: 'TP', session: 'A26', scenario: 'production' }]
        } as any

        const updatedCI = calculateSessionCI(enseignantId, session, updatedData, scenario)
        
        // Total = 9.9 * (10/15) = 6.6
        expect(updatedCI).toBeCloseTo(6.6, 1)
        
        // Vérifier que la CI a bien changé
        expect(updatedCI).not.toBe(initialCI)
    })
})
