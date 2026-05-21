'use client'
import calculateur from "@/app/calculateur/calculateur"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Enseignant, Charge, Liberation, Groupe, Cours, Supervision, Stage } from "@/app/db/db"

export default function CI({enseignant, session, enseignantWidth, trigger, scenario = "production", style}: any){
    const allCharges = useFirestoreCollection<Charge>("charges")
    const allLiberations = useFirestoreCollection<Liberation>("liberations")
    const allSupervisions = useFirestoreCollection<Supervision>("supervisions")
    const allocations = useFirestoreCollection<any>("allocations")
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const cours = useFirestoreCollection<Cours>("cours")
    const stages = useFirestoreCollection<Stage>("stages")

    // Filter by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario)

    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
    const groupesSession = groupes?.filter(groupe => groupe.session == session)
    const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
    
    const chargesInfos = chargesSession?.map(charge => {
        const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
        const cour = cours?.find(cour => String(groupe?.cours) === String(cour.id))
        return {
            sigle: cour?.sigle ?? "", 
            etudiants: Number(groupe?.nbEtudiants ?? 0), 
            heures: Number(cour?.heuresTheorie ?? 0) + Number(cour?.heuresPratique ?? 0), 
            semaines: Number(charge.nbSemaines ?? 0)
        }
    })

    const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
    const allocationsSession = allocations?.filter((allocation: any) => allocation.session == session)
    const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find((allocation: any) => allocation.id == liberation.allocation))
    const liberationsInfos = liberationsSession?.map(liberation => ({ qte: Number(liberation.quantite ?? 0) }))

    const supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
    const stagesSession = stages?.filter(stage => stage.session == session)
    const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
    
    const stagiaires = Number(supervisionsSession?.nbStagiaires ?? 0)
    const ETCparStagiaire = Number(stagesSession?.[0]?.ETCparStagiaire ?? 0)
    
    const CI = calculateur(chargesInfos ?? [], liberationsInfos ?? [], stagiaires, ETCparStagiaire).total

    return <td key={enseignant.id} className="text-center font-weight-bold" style={style}>
        {CI.toFixed(2)}
    </td>
}
