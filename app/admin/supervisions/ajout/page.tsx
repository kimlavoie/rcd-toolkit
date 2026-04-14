'use client'

import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SelectEnseignant from "../../components/SelectEnseignant"



export default function(){
    const [enseignant, setEnseignant] = useState(0)
    const [stage, setStage] = useState(0)
    const [session, setSession] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    useEffect(() => {
        const stage = stages?.[0]
        const session = sessions?.find((el) => el.id == stage?.session)
        setSession(session?.id ?? 0)
        setStage(stage?.id ?? 0)
    }, [stages])

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.supervisions.add({
            enseignant, stage, nbStagiaires
        })
        setEnseignant(0)
        setStage(stages?.[0]?.id ?? 0)
        setNbStagiaires(0)
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
            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../supervisions")}>Retour</button>
    </>
    
}