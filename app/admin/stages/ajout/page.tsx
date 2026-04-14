'use client'

import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"




export default function(){
    const [session, setSession] = useState(0)
    const [ETCparStagiaire, setETCparStagiaire] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const router = useRouter()
    const sessions = useLiveQuery(() => db.sessions.toArray())
    
    useEffect(() => {
        setSession(sessions?.[0]?.id ?? 0)
    }, [sessions])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.stages.add({
            session, ETCparStagiaire, nbStagiaires
        })
        setSession(sessions?.[0]?.id ?? 0)
        setETCparStagiaire(0)
        setNbStagiaires(0)
    }

    async function sessionChanged(ev: any){
        setSession(ev.target.value)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Session: <select name="session" value={session} onChange={sessionChanged}>
                {sessions?.map((session) => (
                    <option key={session.id} value={session.id}>{session.saison} {session.annee}</option>
                ))}
            </select></label></p>
            <p><label>ETC par stagiaire: <input type="number" min="0" max="1" step="0.01" name="ETCparStagiaire" value={ETCparStagiaire} onChange={(ev) => setETCparStagiaire(Number(ev.target.value))} /></label></p>
            <p><label>Nombre de stagiaires: <input type="number" min="0" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>

            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../stages")}>Retour</button>
    </>
    
}