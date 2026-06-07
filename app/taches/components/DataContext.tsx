
import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useFirestoreCollection } from "@/app/utilities/firebaseDb";
import { where } from "firebase/firestore";
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

export function DataProvider({ children, sessions }: { children: ReactNode, sessions?: string[] }) {
    // Basic collections (global to the user)
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const cours = useFirestoreCollection<Cours>("cours")
    
    // Session-scoped constraints
    const sessionConstraints = useMemo(() => 
        sessions && sessions.length > 0 ? [where("session", "in", sessions)] : [], 
    [sessions]);

    // Scoped collections
    const groupes = useFirestoreCollection<Groupe>("groupes", sessionConstraints)
    const allocations = useFirestoreCollection<Allocation>("allocations", sessionConstraints)
    const stages = useFirestoreCollection<Stage>("stages", sessionConstraints)
    const CIReelles = useFirestoreCollection<CIReelle>("CIReelles", sessionConstraints)
    const scenarios = useFirestoreCollection<Scenario>("scenarios", sessionConstraints)

    // Dependent collections (now filtered by session for better performance)
    const charges = useFirestoreCollection<Charge>("charges", sessionConstraints)
    const liberations = useFirestoreCollection<Liberation>("liberations", sessionConstraints)
    const supervisions = useFirestoreCollection<Supervision>("supervisions", sessionConstraints)

    const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({})

    const setVisibility = (key: string, value: boolean) => {
        setVisibilityMap(prev => ({ ...prev, [key]: value }))
    }

    const triggerExpansion = (action: "expand" | "collapse") => {
        const isExpand = action === "expand"
        setVisibilityMap({ global_expansion: isExpand })
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
