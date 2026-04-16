'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectSession from "../../components/inputs/SelectSession";

export default function(){
    const [id, setId] = useState(-1)
    const [session, setSession] = useState(0)
    const [ETCparStagiaire, setETCparStagiaire] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.stages.get(Number(params.id))
        .then((stage) => {
            setId(stage?.id ?? -1)
            setSession(stage?.session ?? 0)
            setETCparStagiaire(stage?.ETCparStagiaire ?? 0)
            setNbStagiaires(stage?.nbStagiaires ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.stages.update(id, {session, ETCparStagiaire, nbStagiaires})
        router.push("../stages")
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectSession value={session} onChange={(id: any) => setSession(id)} /></p>
            <p><label>ETC par stagiaire: <input type="number" min="0" max="1" step="0.01" name="ETCparStagiaire" value={ETCparStagiaire} onChange={(ev) => setETCparStagiaire(Number(ev.target.value))} /></label></p>
            <p><label>Nombre de stagiaires: <input type="number" min="0" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>

            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../stages")}>Retour</button>
    </>
    
}