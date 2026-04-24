import calculateur from "@/app/calculateur/calculateur"
import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({sessions}:any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    return <>
                <tr>
                    <th style={{backgroundColor: "#eeeeee"}}>CI Annuelle</th>
                    {enseignants?.map(enseignant => {
                        let chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        let groupesSession = groupes?.filter(groupe => groupe.session == sessions[0])
                        let chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
                        let chargesInfos = chargesSession?.map(charge => {
                            const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                            const cour = cours?.find(cour => groupe?.cours == cour.id)
                            return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!}
                        })
                        let liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        let allocationsSession = allocations?.filter(allocation => allocation.session == sessions[0])
                        let liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
                        let liberationsInfos = liberationsSession?.map(liberation => {
                            return {qte: liberation.quantite}
                        })
                        let supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
                        let stagesSession = stages?.filter(stage => stage.session == sessions[0])
                        let supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
                        let stagiaires = supervisionsSession?.nbStagiaires ?? 0
                        let ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0
                        let CIA = calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total


                        chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        groupesSession = groupes?.filter(groupe => groupe.session == sessions[1])
                        chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
                        chargesInfos = chargesSession?.map(charge => {
                            const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                            const cour = cours?.find(cour => groupe?.cours == cour.id)
                            return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!}
                        })
                        liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        allocationsSession = allocations?.filter(allocation => allocation.session == sessions[1])
                        liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
                        liberationsInfos = liberationsSession?.map(liberation => {
                            return {qte: liberation.quantite}
                        })
                        supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
                        stagesSession = stages?.filter(stage => stage.session == sessions[1])
                        supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
                        stagiaires = supervisionsSession?.nbStagiaires ?? 0
                        ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0
                        const CIH = calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total

                        const CI = CIA + CIH
                        const couleur = CI < 30 ? "black" : CI < 40 ? "darkkhaki" : CI < 45 ? "green" : CI < 55 ? "orange" : "red"
                        
                        
                        return <td key={enseignant.id} style={{color: couleur, backgroundColor: "#eeeeee"}}>
                            {CI.toFixed(2)}
                        </td>
                    })}
                </tr>
    </>
}