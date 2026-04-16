'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import SelectStage from "../../components/inputs/SelectStage"



export default function(){
    const [enseignant, setEnseignant] = useState(0)
    const [stage, setStage] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.supervisions.add({
            enseignant, stage, nbStagiaires
        })
        setEnseignant(0)
        setStage(0)
        setNbStagiaires(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectStage value={stage} onChange={(id: any) => setStage(id)} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de stagiaires: <input type="number" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../supervisions")}>Retour</button>
    </>
    
}