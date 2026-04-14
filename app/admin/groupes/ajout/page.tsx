'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import SelectCours from "../../components/SelectCours"
import SelectSession from "../../components/SelectSession"

export default function(){
    const [session, setSession] = useState(0)
    const [saison, setSaison] = useState("")
    const [cours, setCours] = useState(0)
    const [nbEtudiants, setNbEtudiants] = useState(0)

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.groupes.add({
            session: session, cours, nbEtudiants
        })
        setSession(0)
        setCours(0)
        setNbEtudiants(0)
    }

    async function sessionChanged(sessionId:any, saison:any){
        console.log(sessionId, saison)
        setSession(sessionId)
        setSaison(saison)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectSession value={session} onChange={sessionChanged} /></p>
            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>
            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../groupes")}>Retour</button>
    </>
    
}