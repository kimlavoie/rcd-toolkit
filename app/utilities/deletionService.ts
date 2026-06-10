import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { firestore, auth } from "./firebase";

export const DeletionService = {
    /**
     * Supprime un enseignant et toutes ses données associées (charges, libérations, supervisions).
     */
    deleteEnseignant: async (enseignantId: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const batch = writeBatch(firestore);

        // 1. Trouver et supprimer les charges
        const chargesSnap = await getDocs(query(collection(firestore, "charges"), where("enseignant", "==", enseignantId), where("userId", "==", userId)));
        chargesSnap.forEach(d => batch.delete(d.ref));

        // 2. Trouver et supprimer les libérations
        const liberationsSnap = await getDocs(query(collection(firestore, "liberations"), where("enseignant", "==", enseignantId), where("userId", "==", userId)));
        liberationsSnap.forEach(d => batch.delete(d.ref));

        // 3. Trouver et supprimer les supervisions
        const supervisionsSnap = await getDocs(query(collection(firestore, "supervisions"), where("enseignant", "==", enseignantId), where("userId", "==", userId)));
        supervisionsSnap.forEach(d => batch.delete(d.ref));

        // 4. Supprimer l'enseignant lui-même
        batch.delete(doc(firestore, "enseignants", enseignantId));

        await batch.commit();
    },

    /**
     * Supprime un cours et toutes ses données associées (groupes et leurs charges).
     */
    deleteCours: async (coursId: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const batch = writeBatch(firestore);

        // 1. Trouver les groupes du cours
        const groupesSnap = await getDocs(query(collection(firestore, "groupes"), where("cours", "==", coursId), where("userId", "==", userId)));
        
        for (const groupeDoc of groupesSnap.docs) {
            // 2. Pour chaque groupe, supprimer ses charges
            const chargesSnap = await getDocs(query(collection(firestore, "charges"), where("groupe", "==", groupeDoc.id), where("userId", "==", userId)));
            chargesSnap.forEach(d => batch.delete(d.ref));
            
            // 3. Supprimer le groupe
            batch.delete(groupeDoc.ref);
        }

        // 4. Supprimer le cours
        batch.delete(doc(firestore, "cours", coursId));

        await batch.commit();
    },

    /**
     * Supprime une allocation et les libérations associées.
     */
    deleteAllocation: async (allocationId: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const batch = writeBatch(firestore);
        const liberationsSnap = await getDocs(query(collection(firestore, "liberations"), where("allocation", "==", allocationId), where("userId", "==", userId)));
        liberationsSnap.forEach(d => batch.delete(d.ref));
        batch.delete(doc(firestore, "allocations", allocationId));

        await batch.commit();
    },

    /**
     * Supprime un stage et les supervisions associées.
     */
    deleteStage: async (stageId: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const batch = writeBatch(firestore);
        const supervisionsSnap = await getDocs(query(collection(firestore, "supervisions"), where("stage", "==", stageId), where("userId", "==", userId)));
        supervisionsSnap.forEach(d => batch.delete(d.ref));
        batch.delete(doc(firestore, "stages", stageId));

        await batch.commit();
    },

    /**
     * Supprime toutes les données d'une session et d'un scénario donnés.
     */
    clearAllSessionData: async (sessions: string[], scenarioId: string) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const batch = writeBatch(firestore);
        
        // 1. Charges
        const chargesSnap = await getDocs(query(
            collection(firestore, "charges"), 
            where("session", "in", sessions),
            where("scenario", "==", scenarioId),
            where("userId", "==", userId)
        ));
        chargesSnap.forEach(d => batch.delete(d.ref));

        // 2. Libérations
        const liberationsSnap = await getDocs(query(
            collection(firestore, "liberations"), 
            where("session", "in", sessions),
            where("scenario", "==", scenarioId),
            where("userId", "==", userId)
        ));
        liberationsSnap.forEach(d => batch.delete(d.ref));

        // 3. Supervisions
        const supervisionsSnap = await getDocs(query(
            collection(firestore, "supervisions"), 
            where("session", "in", sessions),
            where("scenario", "==", scenarioId),
            where("userId", "==", userId)
        ));
        supervisionsSnap.forEach(d => batch.delete(d.ref));

        // 4. CI Réelles (Session-wide, no scenario)
        const ciSnap = await getDocs(query(
            collection(firestore, "CIReelles"), 
            where("session", "in", sessions),
            where("userId", "==", userId)
        ));
        ciSnap.forEach(d => batch.delete(d.ref));

        await batch.commit();
    }
};
