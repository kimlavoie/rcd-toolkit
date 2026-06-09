import { describe, it, expect } from 'vitest'
import calculateur from './calculateur'

describe('Calculateur de CI', () => {
  it('calcule correctement une charge simple de 15 semaines', () => {
    const groupes = [
      { sigle: 'INF101', etudiants: 30, heures: 3, semaines: 15, type: 'TP' as const }
    ]
    const result = calculateur(groupes, [], [])
    
    // Prep facteur (1 unique course = 0.9)
    // Prestation (3h * 1.2) = 3.6
    // PES (3h * 30 * 0.04) = 3.6
    // Total per week = (0.9 * 3 + 3.6 + 3.6) = 2.7 + 7.2 = 9.9
    // Final CI = 9.9 * (15/15) = 9.9
    expect(result.total).toBeCloseTo(9.9, 1)
  })

  it('applique le facteur de préparation correct pour plusieurs cours uniques', () => {
    const groupes = [
      { sigle: 'INF101', etudiants: 20, heures: 3, semaines: 15, type: 'TP' as const },
      { sigle: 'INF102', etudiants: 20, heures: 3, semaines: 15, type: 'TP' as const }
    ]
    const result = calculateur(groupes, [], [])
    // 2 unique courses = 0.9 factor each
    expect(result.sommes.preparations).toBeCloseTo(5.4, 1) // (3*0.9) + (3*0.9)
  })

  it('calcule correctement les libérations (facteur 40)', () => {
    const liberations = [{ qte: 0.1 }] // 0.1 ETC
    const result = calculateur([], liberations, [])
    expect(result.exceptions.liberations).toBe(4) // 0.1 * 40
  })

  it('gère les cas limites (données vides)', () => {
    const result = calculateur([], [], [])
    expect(result.total).toBe(0)
    expect(result.sommes.total).toBe(0)
  })

  it('gère les valeurs NaN ou undefined défensivement', () => {
    // @ts-ignore
    const result = calculateur([{ sigle: 'ERR', etudiants: undefined, heures: 0, semaines: 15 }], [], [])
    expect(result.total).toBe(0)
  })

  describe('Cas Limites (TODO)', () => {
    it('calcule la CI de base pour un cours avec 0 étudiant', () => {
      const groupes = [
        { sigle: 'INF000', etudiants: 0, heures: 3, semaines: 15, type: 'TP' as const }
      ]
      const result = calculateur(groupes, [], [])
      
      // Facteur préparation: 0.9
      // Prestation: 3 * 1.2 = 3.6
      // PES: 0 (car 0 étudiant)
      // Total = (0.9 * 3) + 3.6 + 0 = 2.7 + 3.6 = 6.3
      expect(result.total).toBeCloseTo(6.3, 1)
      expect(result.sommes.PES).toBe(0)
    })

    it('calcule la coordination pour une supervision avec 0 stagiaire', () => {
      const supervisions = [
        { nbStagiaires: 0, CIparStagiaire: 0.5, coordination: 2.0, pourcentageCoordination: 0 }
      ]
      const result = calculateur([], [], supervisions)
      
      expect(result.exceptions.stages).toBe(2.0)
      expect(result.total).toBe(2.0)
    })

    it('calcule correctement une libération extrême (> 1.0 ETC)', () => {
      // Cas théorique extrême (ex: 1.5 ETC)
      const liberations = [{ qte: 1.5 }] 
      const result = calculateur([], liberations, [])
      
      // 1.5 * 40 = 60
      expect(result.exceptions.liberations).toBe(60)
      expect(result.total).toBe(60)
    })
  })
})
