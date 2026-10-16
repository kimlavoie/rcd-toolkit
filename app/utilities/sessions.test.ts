import { describe, it, expect } from 'vitest'
import { extractSessionInfos, makeSessionCode, getCorrespondingSessions } from './sessions'

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

  describe('getCorrespondingSessions', () => {
    it('calcule la session d hiver correspondante pour une session d automne (ex: A26 -> H27)', () => {
      const res = getCorrespondingSessions('A26')
      expect(res.currentSaison).toBe('Automne')
      expect(res.autumnSession).toBe('A26')
      expect(res.winterSession).toBe('H27')
      expect(res.autumnYear).toBe('2026')
      expect(res.winterYear).toBe('2027')
      expect(res.academicYear).toBe('2026-2027')
      expect(res.oppositeSession).toBe('H27')
    })

    it('calcule la session d automne correspondante pour une session d hiver (ex: H27 -> A26)', () => {
      const res = getCorrespondingSessions('H27')
      expect(res.currentSaison).toBe('Hiver')
      expect(res.autumnSession).toBe('A26')
      expect(res.winterSession).toBe('H27')
      expect(res.autumnYear).toBe('2026')
      expect(res.winterYear).toBe('2027')
      expect(res.academicYear).toBe('2026-2027')
      expect(res.oppositeSession).toBe('A26')
    })

    it('fonctionne pour A25 et H26', () => {
      const fromA = getCorrespondingSessions('A25')
      expect(fromA.winterSession).toBe('H26')

      const fromH = getCorrespondingSessions('H26')
      expect(fromH.autumnSession).toBe('A25')
    })
  })
})
