'use client'

import { useMemo } from 'react'
import { useData } from './DataContext'
import { extractSessionInfos } from "@/app/utilities/sessions"
import { 
    getChargesManquantesCount, 
    getLiberationsManquantesCount,
    getStagiairesRestantsCount,
    getCoordinationRestante
} from "@/app/utilities/businessLogic"

export function useTacheData(session: string, scenario: string = "production") {
    const { 
        groupes, charges: allCharges, allocations, 
        liberations: allLiberations, stages, 
        supervisions: allSupervisions, visibilityMap, setVisibility 
    } = useData()

    const { saison, annee } = extractSessionInfos(session)

    const charges = useMemo(() => 
        allCharges?.filter(c => (c.scenario || "production") === scenario) || [], 
    [allCharges, scenario])

    const liberations = useMemo(() => 
        allLiberations?.filter(l => (l.scenario || "production") === scenario) || [], 
    [allLiberations, scenario])

    const supervisions = useMemo(() => 
        allSupervisions?.filter(s => (s.scenario || "production") === scenario) || [], 
    [allSupervisions, scenario])

    const sessionStages = useMemo(() => 
        stages?.filter(s => s.session === session) || [], 
    [stages, session])

    const nbChargesManquantes = useMemo(() => 
        getChargesManquantesCount(session, groupes || [], charges), 
    [session, groupes, charges])

    const nbLiberationsManquantes = useMemo(() => 
        getLiberationsManquantesCount(session, allocations || [], liberations), 
    [session, allocations, liberations])

    const getVisible = (key: string, def = true) => {
        if (visibilityMap[key] !== undefined) return visibilityMap[key]
        if (visibilityMap["global_expansion"] !== undefined) return visibilityMap["global_expansion"]
        return def
    }

    const toggle = (key: string) => {
        setVisibility(key, !getVisible(key, true))
    }

    return {
        saison,
        annee,
        charges,
        liberations,
        supervisions,
        sessionStages,
        nbChargesManquantes,
        nbLiberationsManquantes,
        getVisible,
        toggle,
        groupes,
        allocations,
        stages
    }
}
