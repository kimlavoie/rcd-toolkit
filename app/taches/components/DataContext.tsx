
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useFirestoreCollection } from "@/app/utilities/firebaseDb";
import type { 
    Enseignant, Charge, Liberation, Groupe, Cours, 
    Supervision, Stage, Allocation, CIReelle, Scenario 
} from "@/app/db/db";

interface DataContextType {
    enseignants: Enseignant[] | undefined
    charges: Charge[] | undefined
    liberations: Liberation[] | undefined
    groupes: Groupe[] | undefined
    cours: Cours[] | undefined
    supervisions: Supervision[] | undefined
    stages: Stage[] | undefined
    allocations: Allocation[] | undefined
    CIReelles: CIReelle[] | undefined
    scenarios: Scenario[] | undefined
    isLoading: boolean
    
    // État de visibilité partagé pour l'impression fidèle
    visibilityMap: Record<string, boolean>
    setVisibility: (key: string, value: boolean) => void
    triggerExpansion: (action: "expand" | "collapse") => void
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const charges = useFirestoreCollection<Charge>("charges")
    const liberations = useFirestoreCollection<Liberation>("liberations")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const cours = useFirestoreCollection<Cours>("cours")
    const supervisions = useFirestoreCollection<Supervision>("supervisions")
    const stages = useFirestoreCollection<Stage>("stages")
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const CIReelles = useFirestoreCollection<CIReelle>("CIReelles")
    const scenarios = useFirestoreCollection<Scenario>("scenarios")

    const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({})

    const setVisibility = (key: string, value: boolean) => {
        setVisibilityMap(prev => ({ ...prev, [key]: value }))
    }

    const triggerExpansion = (action: "expand" | "collapse") => {
        const isExpand = action === "expand"
        const newMap: Record<string, boolean> = { ...visibilityMap }
        
        // On ne peut pas facilement lister toutes les clés possibles ici sans les données,
        // mais on peut forcer un état global qui sera lu par les composants.
        // On va plutôt vider la map ou la remplir avec l'état souhaité.
        // Pour "expand", on met tout à true. Pour "collapse", on met tout à false.
        
        // On marque un flag global pour forcer le comportement
        setVisibility("global_expansion", isExpand)
        
        // On nettoie les clés spécifiques pour qu'elles reprennent la valeur globale au prochain rendu
        // Sauf si on veut garder un historique, mais ici on veut un reset global.
        setVisibilityMap(prev => {
            const reset: Record<string, boolean> = { global_expansion: isExpand }
            // Si collapse, on replie tout. Si expand, on déplie tout.
            return reset
        })
    }

    const isLoading = !enseignants || !charges || !liberations || !groupes || 
                      !cours || !supervisions || !stages || !allocations || 
                      !CIReelles || !scenarios;

    const value = {
        enseignants, charges, liberations, groupes, cours, 
        supervisions, stages, allocations, CIReelles, scenarios,
        isLoading, visibilityMap, setVisibility, triggerExpansion
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
