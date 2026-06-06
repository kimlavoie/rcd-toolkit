
import calculateur from "@/app/calculateur/calculateur"
import type { Charge, Liberation, Groupe, Cours, Supervision, Stage, Allocation } from "@/app/db/db"

export interface CIEntries {
    charges: Charge[] | undefined
    liberations: Liberation[] | undefined
    supervisions: Supervision[] | undefined
    groupes: Groupe[] | undefined
    cours: Cours[] | undefined
    stages: Stage[] | undefined
    allocations: Allocation[] | undefined
}

export function calculateSessionCI(enseignantId: string, session: string, data: CIEntries, scenario: string = "production") {
    const { charges, liberations, supervisions, groupes, cours, stages, allocations } = data

    const chargesSession = charges?.filter(c => {
        const groupe = groupes?.find(g => String(g.id) === String(c.groupe))
        return String(c.enseignant) === enseignantId && groupe?.session === session && (c.scenario || "production") === scenario
    })

    const chargesInfos = chargesSession?.map(charge => {
        const groupe = groupes?.find(g => String(g.id) === String(charge.groupe))
        const cour = cours?.find(cour => String(groupe?.cours) === String(cour.id))
        return {
            sigle: cour?.sigle ?? "", 
            etudiants: Number(groupe?.nbEtudiants ?? 0), 
            heures: Number(cour?.heuresTheorie ?? 0) + Number(cour?.heuresPratique ?? 0), 
            heuresTheorie: Number(cour?.heuresTheorie ?? 0),
            heuresPratique: Number(cour?.heuresPratique ?? 0),
            semaines: Number(charge.nbSemaines ?? 0),
            type: charge.type ?? "TP"
        }
    }) || []

    const liberationsSession = liberations?.filter(l => {
        const allocation = allocations?.find(a => String(a.id) === String(l.allocation))
        return String(l.enseignant) === enseignantId && allocation?.session === session && (l.scenario || "production") === scenario
    })

    const liberationsInfos = liberationsSession?.map(l => ({ qte: Number(l.quantite ?? 0) })) || []

    // Supervisions multi-stages
    const supervisionsSession = supervisions?.filter(s => {
        const stage = stages?.find(st => String(st.id) === String(s.stage))
        return String(s.enseignant) === enseignantId && stage?.session === session && (s.scenario || "production") === scenario
    }) || []

    const supervisionsInfos = supervisionsSession.map(s => {
        const stage = stages?.find(st => String(st.id) === String(s.stage))
        return {
            nbStagiaires: Number(s.nbStagiaires ?? 0),
            CIparStagiaire: Number(stage?.CIparStagiaire ?? 0),
            coordination: Number(s.coordination ?? 0),
            pourcentageCoordination: Number(stage?.pourcentageCoordination ?? 0)
        }
    })
    
    return calculateur(chargesInfos, liberationsInfos, supervisionsInfos).total
}
