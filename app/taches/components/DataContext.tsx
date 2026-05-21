
import React, { createContext, useContext, ReactNode } from 'react';
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

    const isLoading = !enseignants || !charges || !liberations || !groupes || 
                      !cours || !supervisions || !stages || !allocations || 
                      !CIReelles || !scenarios;

    const value = {
        enseignants, charges, liberations, groupes, cours, 
        supervisions, stages, allocations, CIReelles, scenarios,
        isLoading
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
