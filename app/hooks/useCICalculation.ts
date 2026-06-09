import { useMemo } from "react";
import { useData } from "@/app/taches/components/DataContext";
import { calculateSessionCI } from "@/app/utilities/ciHelpers";
import { CI_THRESHOLDS } from "@/app/constants/ciConfig";

export function useCICalculation(enseignantId: string, session: string, scenario: string = "production") {
    const data = useData();
    
    const CI = useMemo(() => {
        return calculateSessionCI(enseignantId, session, data as any, scenario);
    }, [enseignantId, session, data, scenario]);

    return CI;
}

export function useAnnualCICalculation(enseignantId: string, sessions: string[], scenario: string = "production") {
    const data = useData();

    const annualCI = useMemo(() => {
        return sessions.reduce((total, session) => {
            return total + calculateSessionCI(enseignantId, session, data as any, scenario);
        }, 0);
    }, [enseignantId, sessions, data, scenario]);

    return annualCI;
}

export function useTotalAnnualCI(enseignantId: string, sessions: string[], saison: "Automne" | "Hiver", scenario: string = "production") {
    const data = useData() as any;
    const { CIReelles } = data;

    const CI = useMemo(() => {
        if (!sessions || sessions.length < 2) return 0;

        const CIReelleExistante = (CIReelles ?? []).find((ci: any) => String(ci.enseignant) === enseignantId && ci.session === sessions[0]);

        const CIA = saison === "Hiver" ? Number(CIReelleExistante?.CI ?? 0) : calculateSessionCI(enseignantId, sessions[0], data, scenario);
        const CIH = calculateSessionCI(enseignantId, sessions[1], data, scenario);
        return CIA + CIH;
    }, [enseignantId, sessions, saison, data, scenario, CIReelles]);

    return CI;
}

export function useDepartmentHealth(isOpen: boolean, visibleEnseignants: any[], sessions: string[], saison: "Automne" | "Hiver", scenario: string = "production") {
    const data = useData() as any;
    const { CIReelles } = data;

    const healthData = useMemo(() => {
        if (!isOpen) return [];

        return visibleEnseignants.map(enseignant => {
            const enseignantId = String(enseignant.id);
            const CIReelleExistante = (CIReelles ?? []).find((ci: any) => String(ci.enseignant) === enseignantId && ci.session === sessions[0]);

            const CIA = saison === "Hiver" ? Number(CIReelleExistante?.CI ?? 0) : calculateSessionCI(enseignantId, sessions[0], data, scenario);
            const CIH = calculateSessionCI(enseignantId, sessions[1], data, scenario);
            const totalCI = CIA + CIH;

            return {
                enseignant,
                totalCI,
                status: totalCI < CI_THRESHOLDS.ANNUAL.YELLOW ? 'under' : (totalCI > CI_THRESHOLDS.ANNUAL.GREEN ? 'over' : 'ok')
            };
        }).sort((a, b) => b.totalCI - a.totalCI);
    }, [isOpen, visibleEnseignants, sessions, saison, data, scenario, CIReelles]);

    return healthData;
}
