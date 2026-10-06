import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseService } from './BaseService';
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
}));

vi.mock('@/app/utilities/firebase', () => ({
    firestore: {},
    auth: {
        currentUser: {
            uid: 'user123',
            getIdTokenResult: () => Promise.resolve({ claims: { departements: { dept1: 'COORDONNATEUR' } } })
        }
    }
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

describe('BaseService', () => {
    let service: BaseService<any>;

    beforeEach(() => {
        // Clear mocks
        vi.clearAllMocks();
        
        // Force isMock to return false so we test real validation/isolation paths
        const mockIsMock = vi.spyOn(BaseService.prototype as any, 'isMock');
        mockIsMock.mockReturnValue(false);

        // We use "charges" to test validation since it has min(0) max(15) constraints on nbSemaines
        service = new BaseService('charges');
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Validation Zod', () => {
        it('devrait bloquer l\'ajout d\'une charge avec un nombre de semaines négatif', async () => {
            const invalidData = {
                enseignant: 'e1',
                groupe: 'g1',
                nbSemaines: -5, // Invalide
                type: 'TP'
            };

            await expect(service.add(invalidData)).rejects.toThrow();
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur'));
            expect(addDoc).not.toHaveBeenCalled();
        });

        it('devrait bloquer l\'ajout d\'une charge avec plus de 15 semaines', async () => {
            const invalidData = {
                enseignant: 'e1',
                groupe: 'g1',
                nbSemaines: 20, // Invalide
                type: 'TP'
            };

            await expect(service.add(invalidData)).rejects.toThrow();
            expect(addDoc).not.toHaveBeenCalled();
        });

        it('devrait permettre l\'ajout d\'une charge valide', async () => {
            const validData = {
                enseignant: 'e1',
                groupe: 'g1',
                nbSemaines: 10,
                type: 'TP'
            };

            (addDoc as any).mockResolvedValueOnce({ id: 'new-id' });

            const result = await service.add(validData);
            expect(result.id).toBe('new-id');
            expect(addDoc).toHaveBeenCalled();
        });
    });

    describe('Isolation par département', () => {
        it('devrait ajouter le departementId du département actif au document créé', async () => {
            (addDoc as any).mockResolvedValueOnce({ id: 'new-id' });

            await service.add({ enseignant: 'e1', groupe: 'g1', nbSemaines: 10, type: 'TP' });

            expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ departementId: 'dept1' }));
        });

        it('devrait retirer les champs structurels (id, userId, departementId) lors de la modification', async () => {
            await service.update('doc-id', { nbSemaines: 10, departementId: 'autre', userId: 'x', id: 'y' });

            expect(updateDoc).toHaveBeenCalledWith(undefined, { nbSemaines: 10 });
        });

        it('devrait déléguer la suppression à Firestore (les règles gèrent les permissions)', async () => {
            await service.delete('doc-id');

            expect(deleteDoc).toHaveBeenCalled();
        });

        it('devrait propager le refus de Firestore si la suppression est refusée', async () => {
            (deleteDoc as any).mockRejectedValueOnce(new Error('permission-denied'));

            await expect(service.delete('doc-id')).rejects.toThrow('permission-denied');
        });
    });
});
