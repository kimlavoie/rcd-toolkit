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
})
