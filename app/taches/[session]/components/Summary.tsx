import calculateur from "@/app/calculateur/calculateur"
import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({cache, sessions, tri, saison}:any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const liberations = useLiveQuery(() => db.liberations.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const charges = useLiveQuery(() => db.charges.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const CIReelles = useLiveQuery(() => db.CIReelles.toArray())
    return <>
                <tr>
                    <th style={{backgroundColor: "#eeeeee"}}>CI Annuelle</th>
                    {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
                    .filter(enseignant => !cache.includes(enseignant.id))
                    .map(enseignant => {
                        let CIA;
                        console.log(saison)
                        if(saison == "Automne"){
                            const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                            const groupesSession = groupes?.filter(groupe => groupe.session == sessions[0])
                            const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
                            const chargesInfos = chargesSession?.map(charge => {
                                const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                                const cour = cours?.find(cour => groupe?.cours == cour.id)
                                return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!, semaines: charge.nbSemaines}
                            })
                            const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                            const allocationsSession = allocations?.filter(allocation => allocation.session == sessions[0])
                            const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
                            const liberationsInfos = liberationsSession?.map(liberation => {
                                return {qte: liberation.quantite}
                            })
                            const supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
                            const stagesSession = stages?.filter(stage => stage.session == sessions[0])
                            const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
                            const stagiaires = supervisionsSession?.nbStagiaires ?? 0
                            const ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0
                            CIA = calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total
                        } else{
                            const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignant.id && CIReelle.session == sessions[0])
                            CIA = CIReelle?.CI ?? 0
                        }
                        


                        const chargesEnseignant = charges?.filter(charge => charge.enseignant == enseignant.id)
                        const groupesSession = groupes?.filter(groupe => groupe.session == sessions[1])
                        const chargesSession = chargesEnseignant?.filter(charge => groupesSession?.find(groupe => groupe.id == charge.groupe))
                        const chargesInfos = chargesSession?.map(charge => {
                            const groupe = groupes?.find(groupe => groupe.id == charge.groupe)
                            const cour = cours?.find(cour => groupe?.cours == cour.id)
                            return {sigle: cour?.sigle!, etudiants: groupe?.nbEtudiants!, heures: cour?.heuresTheorie! + cour?.heuresPratique!, semaines: charge.nbSemaines}
                        })
                        const liberationsEnseignant = liberations?.filter(liberation => liberation.enseignant == enseignant.id)
                        const allocationsSession = allocations?.filter(allocation => allocation.session == sessions[1])
                        const liberationsSession = liberationsEnseignant?.filter(liberation => allocationsSession?.find(allocation => allocation.id == liberation.allocation))
                        const liberationsInfos = liberationsSession?.map(liberation => {
                            return {qte: liberation.quantite}
                        })
                        const supervisionsEnseignant = supervisions?.filter(supervision => supervision.enseignant == enseignant.id)
                        const stagesSession = stages?.filter(stage => stage.session == sessions[1])
                        const supervisionsSession = supervisionsEnseignant?.find(supervision => stagesSession?.find(stage => stage.id == supervision.stage))
                        const stagiaires = supervisionsSession?.nbStagiaires ?? 0
                        const ETCparStagiaire = stagesSession?.[0]?.ETCparStagiaire ?? 0
                        const CIH = calculateur(chargesInfos!, liberationsInfos!, stagiaires, ETCparStagiaire).total

                        const CI = CIA + CIH
                        const couleur = CI < 70 ? "black" : CI < 80 ? "darkkhaki" : CI < 85 ? "green" : "red"
                        
                        
                        return <td key={enseignant.id} style={{color: couleur, backgroundColor: "#eeeeee"}}>
                            {CI.toFixed(2)}
                        </td>
                    })}
                </tr>
    </>
}