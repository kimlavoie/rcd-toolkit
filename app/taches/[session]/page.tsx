'use client'
import { useParams } from "next/navigation"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import Enseignant from "./components/Enseignant"
import Tache from "./components/Tache"
import Summary from "./components/Summary"
import CIReelle from "./components/CIReelle"

export default function(){
    const [tri, setTri] = useState("numeroEmploye")
    const [cache, setCache] = useState<Array<number>>([])
    const [hideMenu, setHideMenu] = useState(true)

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

    function afficherTaches(){
        if(saison == "Automne"){
            return <>
                <Tache cache={cache} session={sessions[0]} tri={tri}/>
                <Tache cache={cache} session={sessions[1]} tri={tri}/>
                <Summary cache={cache} sessions={sessions} tri={tri} saison={saison}/>
            </>
        } else{
            return <>
                <CIReelle cache={cache} session={sessions[0]} tri={tri}/>
                <Tache cache={cache} session={sessions[1]} tri={tri}/>
                <Summary cache={cache} sessions={sessions} tri={tri} saison={saison}/>
            </>
        }
    }

    function openMenu(ev: any){
        ev.preventDefault()
        setHideMenu(false)
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
                    <th onContextMenu={openMenu} onMouseLeave={ev => {setHideMenu(true)}} style={{position: "sticky", top: "0", color: "black", backgroundColor: "lightgray"}}>
                        Enseignants <select name="tri" value={tri} onChange={(ev) => setTri(ev.target.value)}>
                            <option value="numeroEmploye">N° employé</option>
                            <option value="prenom">Prénom</option>
                            <option value="nom">Nom</option>
                        </select>
                        <div style={{position: "absolute", backgroundColor: "darkgrey", display: "block", padding: "5px"}} hidden={hideMenu}>
                            {cache.length != 0 && <p><button className="btn btn-primary" onClick={() => setCache([])}>Tout afficher</button></p>}
                            {enseignants && enseignants.length != cache.length && <p><button className="btn btn-primary" onClick={() => setCache(enseignants.map(enseignant => enseignant.id))}>Tout cacher</button></p>}
                            {cache.map(enseignantCache => {
                                const findEnseignant = enseignants?.find(enseignant => enseignant.id == enseignantCache)
                                return <p key={enseignantCache}><button onClick={() => setCache(cache.filter(enseignant => enseignant != enseignantCache))}>{findEnseignant?.prenom} {findEnseignant?.nom}</button></p>
                            })}
                        </div>
                    </th>
                    { (enseignants ?? [])
                    .toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
                    .filter(enseignant => !cache.includes(enseignant.id))
                    .map(enseignant => (
                        <Enseignant key={enseignant.id} enseignant={enseignant} onCache={() => setCache([...cache, enseignant.id])}/>
                    ))}
                </tr>
                {afficherTaches()}
                
            </tbody>
        </table>
        <p>
            <button onClick={ev => window.open("/db/export/", "_blank")}>Sauvegarder les données</button>
            <button onClick={ev => window.open("/db/import/", "_blank")}>Restaurer des données</button>
            <button onClick={valider}>Valider les tâches</button>
        </p>
    </div>
    </>
}