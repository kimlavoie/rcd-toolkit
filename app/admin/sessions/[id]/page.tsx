'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function(){
    const [id, setId] = useState(-1)
    const [saison, setSaison] = useState("automne")
    const [annee, setAnnee] = useState(2026)

    const params = useParams()
    const router = useRouter()
    const session = useLiveQuery(() => db.sessions.get(Number(params.id)))

    useEffect(() => {
        db.sessions.get(Number(params.id))
        .then((session) => {
            setId(session?.id ?? -1)
            setSaison(session?.saison ?? "")
            setAnnee(session?.annee ?? -1)

        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.sessions.update(id, {saison, annee})
        router.push("../sessions")
    }

    return <>
        <form onSubmit={submit}>
        <p><label>Saison: <select name="saison" value={saison} onChange={(ev) => setSaison(ev.target.value)}>
                <option value="automne">Automne</option>
                <option value="hiver">Hiver</option>
            </select></label></p>
            <p><label>Année: <input type="number" min="2000" name="annee" value={annee} onChange={(ev) => setAnnee(Number(ev.target.value))} /></label></p>

            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../sessions")}>Retour</button>
    </>
    
}