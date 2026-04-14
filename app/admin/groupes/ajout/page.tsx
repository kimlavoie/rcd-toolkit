'use client'

import { Cours, db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SelectCours from "../../components/SelectCours"

export default function(){
    const [session, setSession] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [cours, setCours] = useState(0)
    const [nbEtudiants, setNbEtudiants] = useState(0)

    const sessions = useLiveQuery(() => db.sessions.toArray())

    useEffect(() => {
        setSession(sessions?.[0]?.id ?? 0)
    }, [sessions])

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        if(session === 0 || cours === 0 || nbEtudiants === 0){
            return
        }
        db.groupes.add({
            session: session, cours, nbEtudiants
        })
        setSession(sessions?.[0]?.id ?? 0)
        //@ts-ignore
        setCours(0)
        setNbEtudiants(0)
    }

    async function sessionChanged(ev: any){
        setSession(ev.target.value)
        setSaison(ev.target.options[ev.target.selectedIndex].dataset.saison)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Session: <select name="session" value={session} onChange={sessionChanged}>
                {sessions?.map((session) => (
                    <option key={session.id} value={session.id} data-saison={session.saison}>{session.saison} {session.annee}</option>
                ))}
            </select></label></p>

            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>

            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../groupes")}>Retour</button>
    </>
    
}