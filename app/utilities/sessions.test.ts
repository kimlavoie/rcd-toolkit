import { describe, it, expect } from 'vitest'
import { extractSessionInfos, makeSessionCode } from './sessions'

describe('Utilities - Sessions', () => {
  describe('extractSessionInfos', () => {
    it('extrait correctement une session d Automne', () => {
      const result = extractSessionInfos('A25')
      expect(result.saison).toBe('Automne')
      // Note: currently returns string "2025"
      expect(result.annee).toBe('2025')
    })

    it('extrait correctement une session d Hiver', () => {
      const result = extractSessionInfos('H26')
      expect(result.saison).toBe('Hiver')
      expect(result.annee).toBe('2026')
    })

    it('comportement par défaut pour les codes inconnus', () => {
      const result = extractSessionInfos('Z99')
      // Current implementation defaults to Hiver if not 'A'
      expect(result.saison).toBe('Hiver')
      expect(result.annee).toBe('2099')
    })
  })

  describe('makeSessionCode', () => {
    it('génère le bon code pour Automne', () => {
      expect(makeSessionCode('Automne', '2025')).toBe('A25')
    })

    it('génère le bon code pour Hiver', () => {
      expect(makeSessionCode('Hiver', '2026')).toBe('H26')
    })
  })
})
