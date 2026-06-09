import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseService } from './BaseService';
import { addDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
        currentUser: { uid: 'user123' }
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

    describe('Isolation Utilisateur (Sécurité)', () => {
        it('devrait permettre la modification d\'un document appartenant à l\'utilisateur', async () => {
            // Simule que le document appartient à user123
            (getDoc as any).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ userId: 'user123' })
            });

            await expect(service.update('doc-id', { nbSemaines: 10 })).resolves.not.toThrow();
            expect(updateDoc).toHaveBeenCalled();
        });

        it('devrait bloquer la modification d\'un document n\'appartenant pas à l\'utilisateur', async () => {
            // Simule que le document appartient à un autre utilisateur
            (getDoc as any).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ userId: 'otherUser' })
            });

            await expect(service.update('doc-id', { nbSemaines: 10 })).rejects.toThrow('Unauthorized');
            expect(updateDoc).not.toHaveBeenCalled();
        });

        it('devrait bloquer la suppression d\'un document n\'appartenant pas à l\'utilisateur', async () => {
            (getDoc as any).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ userId: 'otherUser' })
            });

            await expect(service.delete('doc-id')).rejects.toThrow('Unauthorized');
            expect(deleteDoc).not.toHaveBeenCalled();
        });
    });
});
