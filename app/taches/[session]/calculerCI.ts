import calculateur from "@/app/calculateur/calculateur"
import { db } from "@/app/db/db"

export default async function calculerCI(session: string, enseignant: any){
    const charges = await db.charges.toArray()
    const liberations = await db.liberations.toArray()
    const stages = await db.stages.toArray()
    const supervisions = await db.supervisions.toArray()
    const groupes = await db.groupes.toArray()
    const allocations = await db.allocations.toArray()
    const cours = await db.cours.toArray()

    const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
    const groupesSession = groupes?.filter(groupe => groupe.session == session)
    const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
    const chargesInfos = chargesSession?.map(charge => {
        const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
        const cour = cours?.find(cour => groupe?.cours == cour.id)
        return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!, semaines: charge.nbSemaines}
    })
        const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
    const allocationsSession = allocations?.filter(allocation => allocation.session == session)
    const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
    const liberationsInfos = liberationsSession?.map(liberation => {
        return {qte: liberation.quantite}
    })
        const supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
    const stagesSession = stages?.filter(stage => stage.session == session)
    const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
    const stagiaires = supervisionsSession?.nbStagiaires ?? 0
    const ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0
    return calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total
}