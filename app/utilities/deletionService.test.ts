import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeletionService } from './deletionService';

const mockBatch = {
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(true)
};

vi.mock('./firebase', () => ({
    auth: {
        currentUser: { uid: 'test-user-id' }
    },
    firestore: {}
}));

vi.mock('firebase/firestore', () => {
    return {
        collection: vi.fn((db, name) => name),
        query: vi.fn(),
        where: vi.fn(),
        getDocs: vi.fn().mockResolvedValue({
            docs: [{ id: 'doc1', ref: 'ref1' }],
            forEach: (cb: any) => cb({ id: 'doc1', ref: 'ref1' })
        }),
        deleteDoc: vi.fn(),
        doc: vi.fn((db, coll, id) => ({ id, path: `${coll}/${id}` })),
        writeBatch: vi.fn(() => mockBatch)
    };
});

describe('DeletionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delete enseignant and related data in a batch', async () => {
        await DeletionService.deleteEnseignant('e1');

        // 1 for charges, 1 for liberations, 1 for supervisions, 1 for enseignant itself = 4 calls to batch.delete
        expect(mockBatch.delete).toHaveBeenCalledTimes(4);
        expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should delete cours, its groupes and charges in a batch', async () => {
        await DeletionService.deleteCours('c1');

        // 1 groupe, 1 charge for that groupe, 1 for the cours itself = 3 calls
        expect(mockBatch.delete).toHaveBeenCalledTimes(3);
        expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should delete allocation and related liberations', async () => {
        await DeletionService.deleteAllocation('a1');

        // 1 liberation, 1 allocation = 2 calls
        expect(mockBatch.delete).toHaveBeenCalledTimes(2);
        expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should delete stage and related supervisions', async () => {
        await DeletionService.deleteStage('s1');

        // 1 supervision, 1 stage = 2 calls
        expect(mockBatch.delete).toHaveBeenCalledTimes(2);
        expect(mockBatch.commit).toHaveBeenCalled();
    });
});
