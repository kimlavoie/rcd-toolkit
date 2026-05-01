'use client'
import { useParams } from "next/navigation"
import Tache from "./Tache"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import Summary from "./Summary"
import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"

export default function(){
    const [tri, setTri] = useState("numeroEmploye")

    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    const params = useParams()
    const session = params.session
    const {saison, annee} = extractSessionInfos(String(session))
    let sessions: Array<string> = []

    if(saison == "Automne"){
        sessions = [String(session), makeSessionCode("Hiver", String(Number(annee)+1))]
    } else{
        sessions = [makeSessionCode("Automne", String(Number(annee)-1)), String(session)]
    }

    async function validerSession(session: string){
        const charges = await db.charges.toArray()
        const liberations = await db.liberations.toArray()
        const stages = await db.stages.toArray()
        const supervisions = await db.supervisions.toArray()
        const groupes = await db.groupes.toArray()
        const allocations = await db.allocations.toArray()

        const allocationsSession = allocations.filter(allocation => allocation.session == session)
        const groupesSession = groupes.filter(groupe => groupe.session == session)

        const liberationsManquantes = allocationsSession.filter(allocation => {
            const liberation = liberations.filter(liberation => liberation.allocation == allocation.id)
            const sommeLiberations = liberation.reduce((somme, liberation) => somme + liberation.quantite, 0)
            return allocation.quantite - sommeLiberations > 0.001
        })
        console.log(liberationsManquantes)

        const chargesManquantes = groupesSession.filter(groupe => {
            const charge = charges.filter(charge => charge.groupe == groupe.id)
            const sommeCharges = charge.reduce((somme, charge) => somme + charge.nbSemaines, 0)
            return 15 - sommeCharges > 0.001
        })

        const stage = stages?.find(stage => stage.session == session)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + supervision.nbStagiaires, 0)
        const stagiairesRestants = stage?.nbStagiaires! - sommeSupervisions!

        let rapport = ""

        if(liberationsManquantes.length > 0){
            rapport += `Libérations manquantes: ${liberationsManquantes.length}\n`
        }
        if(chargesManquantes.length > 0){
            rapport += `Charges manquantes: ${chargesManquantes.length}\n`
        }
        if(stagiairesRestants > 0){
            rapport += `Stagiaires manquants: ${stagiairesRestants}\n`
        }

        return rapport
    }

    async function valider(){
        const sessionAutomne = await validerSession(sessions[0])
        const sessionHiver = await validerSession(sessions[1])
        
        let rapportFinal = ""
        if(sessionAutomne.length > 0){
            rapportFinal += `Session ${sessions[0]}:\n${sessionAutomne}\n`
        }
        if(sessionHiver.length > 0){
            rapportFinal += `Session ${sessions[1]}:\n${sessionHiver}`
        }
        rapportFinal = rapportFinal == "" ? "Toutes les tâches sont validées" : rapportFinal

        alert(rapportFinal)
    }

    return <>
    <div style={{width: "100%"}}>
        <table className="table table-bordered">
            <tbody>
                <tr>
                    <th style={{position: "sticky", top: "0", color: "black", backgroundColor: "lightgray"}}>
                        Enseignants <select name="tri" value={tri} onChange={(ev) => setTri(ev.target.value)}>
                            <option value="numeroEmploye">N° employé</option>
                            <option value="prenom">Prénom</option>
                            <option value="nom">Nom</option>
                        </select>
                    </th>
                    {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
                    .map(enseignant => (
                        <th style={{position: "sticky", top: "0", color: "black", backgroundColor: "lightgray"}} key={enseignant.id}>{enseignant.prenom} {enseignant.nom}</th>
                    ))}
                </tr>
                <Tache session={sessions[0]} tri={tri}/>
                <Tache session={sessions[1]} tri={tri}/>
                <Summary sessions={sessions} tri={tri}/>
            </tbody>
        </table>
        <p>
            <button onClick={ev => window.open("/db/export/", "_blank")}>Sauvegarder les données</button>
            <button onClick={valider}>Valider les tâches</button>
        </p>
    </div>
    </>
}