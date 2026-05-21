
import calculateur from "@/app/calculateur/calculateur"
import type { Charge, Liberation, Groupe, Cours, Supervision, Stage, Allocation } from "@/app/db/db"

export interface CIEntries {
    charges: Charge[]
    liberations: Liberation[]
    supervisions: Supervision[]
    groupes: Groupe[]
    cours: Cours[]
    stages: Stage[]
    allocations: Allocation[]
}

export function calculateSessionCI(
    enseignantId: string, 
    session: string, 
    data: CIEntries, 
    scenario: string = "production"
) {
    const { charges, liberations, supervisions, groupes, cours, stages, allocations } = data;

    // Filter by scenario
    const scenarioCharges = charges?.filter(c => (c.scenario || "production") === scenario)
    const scenarioLiberations = liberations?.filter(l => (l.scenario || "production") === scenario)
    const scenarioSupervisions = supervisions?.filter(s => (s.scenario || "production") === scenario)

    // Filter by teacher and session
    const chargesEnseignant = scenarioCharges?.filter(charge => String(charge.enseignant) === String(enseignantId))
    const groupesSession = groupes?.filter(groupe => groupe.session === session)
    const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id === charge.groupe))
    
    const chargesInfos = chargesSession?.map(charge => {
        const groupe = groupes?.find(groupe => groupe.id === charge.groupe)
        const cour = cours?.find(cour => String(groupe?.cours) === String(cour.id))
        return {
            sigle: cour?.sigle ?? "", 
            etudiants: Number(groupe?.nbEtudiants ?? 0), 
            heures: Number(cour?.heuresTheorie ?? 0) + Number(cour?.heuresPratique ?? 0), 
            semaines: Number(charge.nbSemaines ?? 0)
        }
    }) || []

    const liberationsEnseignant = scenarioLiberations?.filter(liberation => String(liberation.enseignant) === String(enseignantId))
    const allocationsSession = allocations?.filter(allocation => allocation.session === session)
    const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id === liberation.allocation))
    const liberationsInfos = liberationsSession?.map(liberation => ({ qte: Number(liberation.quantite ?? 0) })) || []

    const supervisionsEnseignant = scenarioSupervisions?.filter(supervision => String(supervision.enseignant) === String(enseignantId))
    const stagesSession = stages?.filter(stage => stage.session === session)
    const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id === supervision.stage))
    
    const stagiaires = Number(supervisionsSession?.nbStagiaires ?? 0)
    const ETCparStagiaire = Number(stagesSession?.[0]?.ETCparStagiaire ?? 0)
    
    return calculateur(chargesInfos, liberationsInfos, stagiaires, ETCparStagiaire).total
}
