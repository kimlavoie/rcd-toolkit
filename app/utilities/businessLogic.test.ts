import { describe, it, expect } from 'vitest'
import { getChargesManquantesCount, getCoordinationRestante } from './businessLogic'
import type { Groupe, Charge, Stage, Supervision } from '@/app/db/db'

describe('Business Logic - Data Integrity', () => {
  describe('getChargesManquantesCount', () => {
    it('identifie un groupe non assigné', () => {
      const groupes: Partial<Groupe>[] = [{ id: 'g1', session: 'A26' }]
      const charges: Charge[] = []
      const result = getChargesManquantesCount('A26', groupes as Groupe[], charges)
      expect(result).toBe(1)
    })

    it('identifie un groupe partiellement assigné (semaines < 15)', () => {
      const groupes: Partial<Groupe>[] = [{ id: 'g1', session: 'A26' }]
      const charges: Partial<Charge>[] = [{ groupe: 'g1', nbSemaines: 10, type: 'TP' }]
      const result = getChargesManquantesCount('A26', groupes as Groupe[], charges as Charge[])
      expect(result).toBe(1)
    })

    it('considère un groupe comme complet avec 15 semaines TP', () => {
      const groupes: Partial<Groupe>[] = [{ id: 'g1', session: 'A26' }]
      const charges: Partial<Charge>[] = [{ groupe: 'g1', nbSemaines: 15, type: 'TP' }]
      const result = getChargesManquantesCount('A26', groupes as Groupe[], charges as Charge[])
      expect(result).toBe(0)
    })
  })

  describe('getCoordinationRestante', () => {
    it('calcule correctement le reliquat de coordination', () => {
      // totalCIStage = 10 * 0.5 = 5.0
      // budgetCoord = 5.0 * (20/100) = 1.0
      const stage: Partial<Stage> = { id: 's1', coordination: 0, nbStagiaires: 10, CIparStagiaire: 0.5, pourcentageCoordination: 20 }
      const supervisions: Partial<Supervision>[] = [
        { stage: 's1', coordination: 0.6 },
        { stage: 's1', coordination: 0.2 }
      ]
      const result = getCoordinationRestante(stage as Stage, supervisions as Supervision[])
      expect(result).toBeCloseTo(0.2, 5)
    })

    it('gère le cas où aucune supervision n existe', () => {
      const stage: Partial<Stage> = { id: 's1', nbStagiaires: 10, CIparStagiaire: 0.5, pourcentageCoordination: 30 }
      // budgetCoord = (10 * 0.5) * 0.3 = 1.5
      const result = getCoordinationRestante(stage as Stage, [])
      expect(result).toBe(1.5)
    })
  })
})
