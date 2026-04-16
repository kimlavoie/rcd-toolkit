'use client'

import SelectCours from "@/app/admin/components/inputs/SelectCours";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function(){
    const [id, setId] = useState(0)
    const [session, setSession] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [cours, setCours] = useState(0)
    const [nbEtudiants, setNbEtudiants] = useState(0)

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.sessions.get(Number(params.session)).then((session) => {
            setSaison(session?.saison ?? "")
        })
    })

    useEffect(() => {
        db.groupes.get(Number(params.id))
        .then((groupe) => {
            setId(groupe?.id ?? 0)
            setSession(groupe?.session ?? 0)
            setCours(groupe?.cours ?? 0)
            setNbEtudiants(groupe?.nbEtudiants ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.groupes.update(id, {session, cours, nbEtudiants})
        router.push(`../${params.session}`)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>

            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}