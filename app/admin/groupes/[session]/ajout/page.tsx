'use client'

import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SelectCours from "../../../components/SelectCours"

export default function(){
    const [cours, setCours] = useState(0)
    const [nbEtudiants, setNbEtudiants] = useState(0)
    const [saison, setSaison] = useState("automne")

    const router = useRouter()

    const params = useParams()

    useEffect(() => {
        db.sessions.get(Number(params.session)).then((session) => {
            setSaison(session?.saison ?? "")
        })
    })
    
    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.groupes.add({
            session: Number(params.session), cours, nbEtudiants
        })
        setCours(0)
        setNbEtudiants(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>
            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}