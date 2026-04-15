'use client'

import SelectEnseignant from "@/app/admin/components/SelectEnseignant"
import SelectGroupe from "@/app/admin/components/SelectGroupe"
import SelectSession from "@/app/admin/components/SelectSession"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function(){
    const [groupe, setGroupe] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    const [nbSemaines, setNbSemaines] = useState(0)
    const [session, setSession] = useState(0)

    const router = useRouter()
    const params = useParams()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.charges.add({
            groupe, enseignant, nbSemaines
        })
        setGroupe(0)
        setEnseignant(0)
        setNbSemaines(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectGroupe value={groupe} onChange={(id: any) => setGroupe(id)} session={params.session} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de semaines: <input type="number" name="nbSemaines" value={nbSemaines} onChange={(ev) => setNbSemaines(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}