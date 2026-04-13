'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function(){
    const [saison, setSaison] = useState("automne")
    const [annee, setAnnee] = useState(2026)


    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.sessions.add({
            saison, annee
        })
        setSaison("")
        setAnnee(2026)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Saison: <select name="saison" value={saison} onChange={(ev) => setSaison(ev.target.value)}>
                <option value="automne">Automne</option>
                <option value="hiver">Hiver</option>
            </select></label></p>
            <p><label>Année: <input type="number" min="2000" name="annee" value={annee} onChange={(ev) => setAnnee(Number(ev.target.value))} /></label></p>

            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../sessions")}>Retour</button>
    </>
    
}