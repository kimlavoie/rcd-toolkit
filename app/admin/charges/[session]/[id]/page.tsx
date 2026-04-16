'use client'

import SelectEnseignant from "@/app/admin/components/inputs/SelectEnseignant";
import SelectGroupe from "@/app/admin/components/inputs/SelectGroupe";
import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function(){
    const [id, setId] = useState(-1)
    const [groupe, setGroupe] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    const [nbSemaines, setNbSemaines] = useState(0)

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.charges.get(Number(params.id))
        .then((charge) => {
            setId(charge?.id ?? -1)
            setGroupe(charge?.groupe ?? 0)
            setEnseignant(charge?.enseignant ?? 0)
            setNbSemaines(charge?.nbSemaines ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.charges.update(id, {groupe, enseignant, nbSemaines})
        router.push(`../${params.session}`)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectGroupe value={groupe} onChange={(id: any) => setGroupe(id)} session={params.session} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de semaines: <input type="number" name="nbSemaines" value={nbSemaines} onChange={(ev) => setNbSemaines(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push(`../${params.session}`)}>Retour</button>
    </>
    
}