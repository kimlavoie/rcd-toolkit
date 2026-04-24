'use client'
import { useParams } from "next/navigation"
import Tache from "./Tache"
import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import Summary from "./Summary"
import { useState } from "react"

export default function(){
    const [tri, setTri] = useState("numeroEmploye")

    const params = useParams()
    const session = params.session
    const {saison, annee} = extractSessionInfos(String(session))
    let sessions = []

    if(saison == "Automne"){
        sessions = [session, makeSessionCode("Hiver", String(Number(annee)+1))]
    } else{
        sessions = [makeSessionCode("Automne", String(Number(annee)-1)),session]
    }

    return <>
    <div style={{width: "100%"}}>
        Tri: <select name="tri" value={tri} onChange={(ev) => setTri(ev.target.value)}>
            <option value="numeroEmploye">N° employé</option>
            <option value="prenom">Prénom</option>
            <option value="nom">Nom</option>
        </select>
        <table className="table table-bordered">
            <tbody>
                <Tache session={sessions[0]} tri={tri}/>
                <Tache session={sessions[1]} tri={tri}/>
                <Summary sessions={sessions} tri={tri}/>
            </tbody>
        </table>
    </div>
    </>
}