'use client'

import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Liberation{
    id: number
    code: string
    description: string
    quantite: number
    session: number
    enseignant: number
}

export default function(){
    const [code, setCode] = useState("")
    const [description, setDescription] = useState("")
    const [quantite, setQuantite] = useState(0)
    const [session, setSession] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    
    const sessions = useLiveQuery(() => db.sessions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    useEffect(() => {
        setSession(sessions?.[0]?.id ?? 0)
    }, [sessions])

    useEffect(() => {
        setEnseignant(enseignants?.[0]?.id ?? 0)
    }, [enseignants])

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.liberations.add({
            code, description, quantite, session, enseignant
        })
        setCode("")
        setDescription("")
        setQuantite(0)
        setSession(sessions?.[0]?.id ?? 0)
        setEnseignant(enseignants?.[0]?.id ?? 0)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Code: <input type="text" name="numeroEmploye" value={code} onChange={(ev) => setCode(ev.target.value)} /></label></p>
            <p><label>Description: <input type="text" name="prenom" value={description} onChange={(ev) => setDescription(ev.target.value)} /></label></p>
            <p><label>Quantité: <input type="number" min="0" max="1" step="0.05"name="nom" value={quantite} onChange={(ev) => setQuantite(Number(ev.target.value))} /></label></p>
            <p><label>Session: <select name="session" value={session} onChange={(ev) => setSession(Number(ev.target.value))}>
                {sessions?.map((session) => (
                    <option key={session.id} value={session.id}>{session.saison} {session.annee}</option>
                ))}
            </select></label></p>
            <p><label>Enseignant: <select name="enseignant" value={enseignant} onChange={(ev) => setEnseignant(Number(ev.target.value))}>
                {enseignants?.map((enseignant) => (
                    <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
                ))}
            </select></label></p>

            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../liberations")}>Retour</button>
    </>
    
}