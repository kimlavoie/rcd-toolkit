import type { 
    Enseignant, Charge, Liberation, Groupe, Supervision, 
    Stage, Allocation, Cours, Preference, Parametres 
} from "@/app/db/db";
import calculateur from "@/app/calculateur/calculateur";
import { writeBatch, collection, doc } from "firebase/firestore";
import { firestore, auth } from "@/app/utilities/firebase";
import { DeletionService } from "./deletionService";

interface DraftGenerationParams {
    sessions: string[]
    includeCharges: boolean
    includeLiberations: boolean
    includeSupervisions: boolean
    respectAbsolue: boolean
    respectOrdinaire: boolean
    respectInteret: boolean
    balanceCI: boolean
    overwriteExisting: boolean
}

export const DraftGenerationService = {
    generate: async (
        params: DraftGenerationParams,
        data: {
            enseignants: Enseignant[],
            groupes: Groupe[],
            allocations: Allocation[],
            stages: Stage[],
            cours: Cours[],
            preferences: Preference[],
            parametres: Parametres[],
            existingCharges: Charge[],
            existingLiberations: Liberation[],
            existingSupervisions: Supervision[]
        },
        scenarioId: string,
        currentYear: number
    ) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Non authentifié");

        // 1. Nettoyage si demandé
        if (params.overwriteExisting) {
            await DeletionService.clearAllSessionData(params.sessions, scenarioId);
        }

        const batch = writeBatch(firestore);

        // État de travail pour l'algorithme
        let teachersState = data.enseignants.map(e => ({
            id: e.id,
            currentCI: 0,
            assignments: {
                groupes: [] as any[],
                liberations: [] as any[],
                supervisions: [] as any[]
            }
        }));

        // Si on ne remplace pas, on calcule la CI actuelle
        if (!params.overwriteExisting) {
            // ... logique pour initialiser avec l'existant ...
            // (Simplification : on suppose ici qu'on part de zéro pour le prototype, ou on implémentera le calcul si nécessaire)
        }

        // --- ATTRIBUTION DES COURS ---
        if (params.includeCharges) {
            const availableGroups = data.groupes.filter(g => 
                params.sessions.includes(g.session) && 
                (params.overwriteExisting || !data.existingCharges.some(c => c.groupe === g.id && c.scenario === scenarioId))
            );

            // Trier les groupes : d'abord ceux qui ont des priorités absolues
            // On va itérer sur les groupes et chercher si un enseignant a une priorité
            
            for (const groupe of availableGroups) {
                const cour = data.cours.find(c => c.id === groupe.cours);
                if (!cour) continue;

                let targetTeacher: string | undefined = undefined;

                // 1. Priorités Absolues
                if (params.respectAbsolue) {
                    targetTeacher = data.preferences.find(p => p.cours === cour.id && p.type === 'ABSOLUE')?.enseignant;
                }
                
                // 2. Priorités Ordinaires (non expirées)
                if (!targetTeacher && params.respectOrdinaire) {
                    const ords = data.preferences.filter(p => p.cours === cour.id && p.type === 'ORDINAIRE');
                    const duree = data.parametres?.[0]?.dureePrioriteOrdinaire ?? 4;
                    const validOrds = ords.filter(p => p.anneeObtention && (currentYear - p.anneeObtention) <= duree);
                    if (validOrds.length > 0) {
                        // Si plusieurs, on prend celui qui a la CI la plus basse
                        const ids = validOrds.map(o => o.enseignant);
                        targetTeacher = teachersState
                            .filter(t => ids.includes(t.id))
                            .sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                    }
                }

                // 3. Intérêts
                if (!targetTeacher && params.respectInteret) {
                    const interests = data.preferences.filter(p => p.cours === cour.id && p.type === 'INTERET');
                    if (interests.length > 0) {
                        const ids = interests.map(i => i.enseignant);
                        targetTeacher = teachersState
                            .filter(t => ids.includes(t.id))
                            .sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                    }
                }

                // 4. Greedy (CI balancing)
                if (!targetTeacher && params.balanceCI) {
                    targetTeacher = [...teachersState].sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                }

                if (targetTeacher) {
                    const teacher = teachersState.find(t => t.id === targetTeacher)!;
                    const chargeId = doc(collection(firestore, "charges")).id;
                    const chargeData = {
                        id: chargeId,
                        enseignant: targetTeacher,
                        groupe: groupe.id,
                        nbSemaines: 15,
                        type: "TP",
                        session: groupe.session,
                        scenario: scenarioId,
                        userId
                    };
                    batch.set(doc(firestore, "charges", chargeId), chargeData);
                    
                    // Update state (simplified CI estimation for sorting)
                    teacher.currentCI += 3; // Approx 3 CI per group
                }
            }
        }

        // --- ATTRIBUTION DES LIBÉRATIONS ---
        if (params.includeLiberations) {
            const availableAllocations = data.allocations.filter(a => 
                params.sessions.includes(a.session) &&
                (params.overwriteExisting || !data.existingLiberations.some(l => l.allocation === a.id && l.scenario === scenarioId))
            );

            for (const alloc of availableAllocations) {
                let targetTeacher: string | undefined = undefined;

                if (params.respectInteret) {
                    const interests = data.preferences.filter(p => p.allocation === alloc.id && p.type === 'INTERET');
                    if (interests.length > 0) {
                        const ids = interests.map(i => i.enseignant);
                        targetTeacher = teachersState
                            .filter(t => ids.includes(t.id))
                            .sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                    }
                }

                if (!targetTeacher && params.balanceCI) {
                    targetTeacher = [...teachersState].sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                }

                if (targetTeacher) {
                    const teacher = teachersState.find(t => t.id === targetTeacher)!;
                    const libId = doc(collection(firestore, "liberations")).id;
                    const libData = {
                        id: libId,
                        enseignant: targetTeacher,
                        allocation: alloc.id,
                        quantite: alloc.quantite,
                        session: alloc.session,
                        scenario: scenarioId,
                        userId
                    };
                    batch.set(doc(firestore, "liberations", libId), libData);
                    teacher.currentCI += (alloc.quantite * 40);
                }
            }
        }

        // --- ATTRIBUTION DES SUPERVISIONS ---
        if (params.includeSupervisions) {
            const availableStages = data.stages.filter(s => 
                params.sessions.includes(s.session) &&
                (params.overwriteExisting || !data.existingSupervisions.some(sup => sup.stage === s.id && sup.scenario === scenarioId))
            );

            for (const stage of availableStages) {
                let targetTeacher: string | undefined = undefined;

                if (params.respectInteret) {
                    const interests = data.preferences.filter(p => p.stage === stage.id && p.type === 'INTERET');
                    if (interests.length > 0) {
                        const ids = interests.map(i => i.enseignant);
                        targetTeacher = teachersState
                            .filter(t => ids.includes(t.id))
                            .sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                    }
                }

                if (!targetTeacher && params.balanceCI) {
                    targetTeacher = [...teachersState].sort((a, b) => a.currentCI - b.currentCI)[0]?.id;
                }

                if (targetTeacher) {
                    const teacher = teachersState.find(t => t.id === targetTeacher)!;
                    const supId = doc(collection(firestore, "supervisions")).id;
                    const supData = {
                        id: supId,
                        enseignant: targetTeacher,
                        stage: stage.id,
                        nbStagiaires: stage.nbStagiaires,
                        coordination: stage.pourcentageCoordination || 0,
                        session: stage.session,
                        scenario: scenarioId,
                        userId
                    };
                    batch.set(doc(firestore, "supervisions", supId), supData);
                    teacher.currentCI += ((stage.pourcentageCoordination || 0) * 40) + (stage.nbStagiaires * 1);
                }
            }
        }

        await batch.commit();
    }
};
