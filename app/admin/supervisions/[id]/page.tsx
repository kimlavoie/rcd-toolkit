'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectEnseignant from "../../components/inputs/SelectEnseignant";
import SelectStage from "../../components/inputs/SelectStage";

export default function(){
    const [id, setId] = useState(-1)
    const [enseignant, setEnseignant] = useState(0)
    const [stage, setStage] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)


    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.supervisions.get(Number(params.id))
        .then((supervision) => {
            setId(supervision?.id ?? -1)
            setEnseignant(supervision?.enseignant ?? 0)
            setStage(supervision?.stage ?? 0)
            setNbStagiaires(supervision?.nbStagiaires ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.supervisions.update(id, {enseignant, stage, nbStagiaires})
        router.push("../supervisions")
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectStage value={stage} onChange={(id: any) => setStage(id)} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de stagiaires: <input type="number" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>

            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../supervisions")}>Retour</button>
    </>
    
}