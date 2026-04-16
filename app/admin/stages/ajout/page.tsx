'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import SelectSession from "../../components/inputs/SelectSession"

export default function(){
    const [session, setSession] = useState(0)
    const [ETCparStagiaire, setETCparStagiaire] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.stages.add({
            session, ETCparStagiaire, nbStagiaires
        })
        setSession(0)
        setETCparStagiaire(0)
        setNbStagiaires(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectSession value={session} onChange={(id: any) => setSession(id)} /></p>
            <p><label>ETC par stagiaire: <input type="number" min="0" max="1" step="0.01" name="ETCparStagiaire" value={ETCparStagiaire} onChange={(ev) => setETCparStagiaire(Number(ev.target.value))} /></label></p>
            <p><label>Nombre de stagiaires: <input type="number" min="0" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>

            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../stages")}>Retour</button>
    </>
    
}