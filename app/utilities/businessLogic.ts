import type { Charge, Liberation, Groupe, Supervision, Stage, Allocation, Cours, Enseignant } from "@/app/db/db";

/**
 * Calcule le nombre de groupes de session qui ne sont pas encore totalement assignés
 * (15 semaines par composante T/P requise).
 */
export function getChargesManquantesCount(session: string, groupes: Groupe[], charges: Charge[]): number {
    const groupesSession = groupes.filter(groupe => groupe.session === session);
    const missing = groupesSession.filter(groupe => {
        const groupCharges = charges.filter(charge => charge.groupe === groupe.id);
        const needsT = groupe.aTheorie ?? true;
        const needsP = groupe.aPratique ?? true;
        const weeksT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0);
        const weeksP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0);
        const missingT = needsT && (15 - weeksT > 0.001);
        const missingP = needsP && (15 - weeksP > 0.001);
        return missingT || missingP;
    });
    return missing.length;
}

/**
 * Calcule le nombre d'allocations de libération qui ne sont pas encore totalement épuisées.
 */
export function getLiberationsManquantesCount(session: string, allocations: Allocation[], liberations: Liberation[]): number {
    const allocationsSession = allocations.filter(allocation => allocation.session === session);
    const missing = allocationsSession.filter(allocation => {
        const matchingLibs = liberations.filter(liberation => liberation.allocation === allocation.id);
        const sommeLiberations = matchingLibs.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0);
        return (allocation.quantite ?? 0) - sommeLiberations > 0.001;
    });
    return missing.length;
}

/**
 * Calcule le nombre de stagiaires restant à placer pour un stage donné.
 */
export function getStagiairesRestantsCount(stage: Stage, supervisions: Supervision[]): number {
    const supervisionsSimilaires = supervisions.filter(s => s.stage === stage.id);
    const sommeSupervisions = supervisionsSimilaires.reduce((somme, s) => somme + (s.nbStagiaires ?? 0), 0);
    return (stage.nbStagiaires ?? 0) - sommeSupervisions;
}

/**
 * Calcule le montant de coordination restant à placer pour un stage donné.
 */
export function getCoordinationRestante(stage: Stage, supervisions: Supervision[]): number {
    const totalCIStage = (stage.nbStagiaires ?? 0) * (stage.CIparStagiaire ?? 0);
    const budgetCoord = totalCIStage * ((stage.pourcentageCoordination ?? 0) / 100);
    
    const supervisionsSimilaires = supervisions.filter(s => s.stage === stage.id);
    const sommeCoord = supervisionsSimilaires.reduce((somme, s) => somme + (s.coordination ?? 0), 0);
    
    return budgetCoord - sommeCoord;
}

/**
 * Filtre les enseignants selon la recherche globale (nom, cours, libérations).
 */
export function filterEnseignants(
    enseignants: Enseignant[],
    cache: string[],
    search: string,
    tri: string,
    charges: Charge[],
    groupes: Groupe[],
    cours: Cours[],
    liberations: Liberation[],
    allocations: Allocation[],
    scenario: string
): Enseignant[] {
    return enseignants
        .filter(e => !cache.includes(e.id))
        .filter(e => {
            if (!search) return true;
            const searchLower = search.toLowerCase();
            
            // 1. Infos enseignant
            const matchTeacher = (e.nom ?? "").toLowerCase().includes(searchLower) || 
                                (e.prenom ?? "").toLowerCase().includes(searchLower) ||
                                (e.numeroEmploye ?? "").toLowerCase().includes(searchLower);
            if (matchTeacher) return true;

            // 2. Cours (Charges)
            const teacherCharges = charges.filter(c => c.enseignant === e.id && (c.scenario || "production") === scenario);
            const matchCourse = teacherCharges.some(charge => {
                const groupe = groupes.find(g => g.id === charge.groupe);
                const cour = cours.find(c => c.id === groupe?.cours);
                return (cour?.sigle ?? "").toLowerCase().includes(searchLower) || 
                       (cour?.nom ?? "").toLowerCase().includes(searchLower);
            });
            if (matchCourse) return true;

            // 3. Libérations (Allocations)
            const teacherLiberations = liberations.filter(l => l.enseignant === e.id && (l.scenario || "production") === scenario);
            const matchLiberation = teacherLiberations.some(lib => {
                const allocation = allocations.find(a => a.id === lib.allocation);
                return (allocation?.code ?? "").toLowerCase().includes(searchLower) || 
                       (allocation?.description ?? "").toLowerCase().includes(searchLower);
            });
            if (matchLiberation) return true;

            return false;
        })
        .toSorted((a: any, b: any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""));
}
