import { describe, it, expect } from 'vitest';
import { EnseignantSchema, CoursSchema, ChargeSchema, StageSchema } from './schemas';

describe('Zod Schemas Validation', () => {
    describe('EnseignantSchema', () => {
        it('should validate a correct enseignant', () => {
            const data = { prenom: 'Jean', nom: 'Tremblay', courriel: 'jean@test.com' };
            const result = EnseignantSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if nom is missing', () => {
            const data = { prenom: 'Jean' };
            const result = EnseignantSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
        
        it('should accept empty courriel', () => {
            const data = { prenom: 'Jean', nom: 'Tremblay', courriel: '' };
            const result = EnseignantSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail on invalid courriel format', () => {
            const data = { prenom: 'Jean', nom: 'Tremblay', courriel: 'invalid' };
            const result = EnseignantSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('CoursSchema', () => {
        it('should validate a correct cours', () => {
            const data = { sigle: 'INF101', nom: 'Intro', heuresTheorie: 3, heuresPratique: 2 };
            const result = CoursSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail with negative hours', () => {
            const data = { sigle: 'INF101', nom: 'Intro', heuresTheorie: -1, heuresPratique: 2 };
            const result = CoursSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should coerce string numbers to numbers', () => {
            const data = { sigle: 'INF101', nom: 'Intro', heuresTheorie: "3", heuresPratique: "2" };
            const result = CoursSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.heuresTheorie).toBe(3);
            }
        });
    });

    describe('ChargeSchema', () => {
        it('should validate a correct charge', () => {
            const data = { enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP' };
            const result = ChargeSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if nbSemaines > 15', () => {
            const data = { enseignant: 'e1', groupe: 'g1', nbSemaines: 16, type: 'TP' };
            const result = ChargeSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should default type to TP if omitted', () => {
            const data = { enseignant: 'e1', groupe: 'g1', nbSemaines: 10 };
            const result = ChargeSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('TP');
            }
        });
    });

    describe('StageSchema', () => {
        it('should fail if pourcentageCoordination > 100', () => {
            const data = { session: 'A26', nom: 'Stage 1', CIparStagiaire: 1, nbStagiaires: 5, pourcentageCoordination: 105 };
            const result = StageSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
