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
    const hiddenIds = new Set(cache);
    const filteredBase = enseignants.filter(e => !hiddenIds.has(e.id));
    
    if (!search) {
        return [...filteredBase].sort((a: any, b: any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""));
    }

    const searchLower = search.toLowerCase();

    // 1. Indexation pour accès O(1)
    const groupesMap = new Map(groupes.map(g => [g.id, g]));
    const coursMap = new Map(cours.map(c => [c.id, c]));
    const allocationsMap = new Map(allocations.map(a => [a.id, a]));

    // 2. Pré-filtrage des charges et libérations par scénario
    const currentScenario = scenario || "production";
    const relevantCharges = charges.filter(c => (c.scenario || "production") === currentScenario);
    const relevantLiberations = liberations.filter(l => (l.scenario || "production") === currentScenario);

    // 3. Regroupement par enseignant pour éviter les boucles imbriquées
    const chargesByTeacher = new Map<string, Charge[]>();
    relevantCharges.forEach(c => {
        const list = chargesByTeacher.get(c.enseignant) || [];
        list.push(c);
        chargesByTeacher.set(c.enseignant, list);
    });

    const liberationsByTeacher = new Map<string, Liberation[]>();
    relevantLiberations.forEach(l => {
        const list = liberationsByTeacher.get(l.enseignant) || [];
        list.push(l);
        liberationsByTeacher.set(l.enseignant, list);
    });

    return filteredBase
        .filter(e => {
            // A. Infos enseignant
            if ((e.nom ?? "").toLowerCase().includes(searchLower) || 
                (e.prenom ?? "").toLowerCase().includes(searchLower) ||
                (e.numeroEmploye ?? "").toLowerCase().includes(searchLower)) return true;

            // B. Cours (Charges)
            const teacherCharges = chargesByTeacher.get(e.id) || [];
            const matchCourse = teacherCharges.some(charge => {
                const groupe = groupesMap.get(charge.groupe);
                const cour = coursMap.get(groupe?.cours ?? "");
                return (cour?.sigle ?? "").toLowerCase().includes(searchLower) || 
                       (cour?.nom ?? "").toLowerCase().includes(searchLower);
            });
            if (matchCourse) return true;

            // C. Libérations (Allocations)
            const teacherLiberations = liberationsByTeacher.get(e.id) || [];
            const matchLiberation = teacherLiberations.some(lib => {
                const allocation = allocationsMap.get(lib.allocation);
                return (allocation?.code ?? "").toLowerCase().includes(searchLower) || 
                       (allocation?.description ?? "").toLowerCase().includes(searchLower);
            });
            if (matchLiberation) return true;

            return false;
        })
        .sort((a: any, b: any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""));
}
