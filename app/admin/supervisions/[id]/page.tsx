'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectEnseignant from "../../components/SelectEnseignant";

export default function(){
    const [id, setId] = useState(-1)
    const [enseignant, setEnseignant] = useState(0)
    const [stage, setStage] = useState(0)
    const [session, setSession] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.supervisions.get(Number(params.id))
        .then((supervision) => {
            setId(supervision?.id ?? -1)
            setEnseignant(supervision?.enseignant ?? 0)
            setStage(supervision?.stage ?? 0)
            setNbStagiaires(supervision?.nbStagiaires ?? 0)
            console.log(supervision)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.supervisions.update(id, {enseignant, stage, nbStagiaires})
        router.push("../supervisions")
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Stage: <select name="stage" value={stage} onChange={(ev) => setStage(Number(ev.target.value))}>
                {stages?.map((stage) => {
                    const session = sessions?.find((el) => el.id == stage?.session)
                    return <option key={stage.id} value={stage.id}>{session?.saison} {session?.annee}</option>
                })}
            </select></label></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de stagiaires: <input type="number" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>

            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../supervisions")}>Retour</button>
    </>
    
}