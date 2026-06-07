import { useMemo } from "react";
import type { Enseignant, Charge, Groupe, Cours, Liberation, Allocation } from "@/app/db/db";
import { filterEnseignants } from "./businessLogic";

/**
 * Hook personnalisé pour filtrer et trier les enseignants selon les critères de recherche.
 */
export function useFilteredEnseignants(
    enseignants: Enseignant[] | undefined,
    cache: string[],
    search: string,
    tri: string,
    charges: Charge[] | undefined,
    groupes: Groupe[] | undefined,
    cours: Cours[] | undefined,
    liberations: Liberation[] | undefined,
    allocations: Allocation[] | undefined,
    scenario: string
) {
    return useMemo(() => {
        if (!enseignants) return [];
        return filterEnseignants(
            enseignants,
            cache,
            search,
            tri,
            charges || [],
            groupes || [],
            cours || [],
            liberations || [],
            allocations || [],
            scenario
        );
    }, [enseignants, cache, search, tri, charges, groupes, cours, liberations, allocations, scenario]);
}
