import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectStage from "../inputs/SelectStage"
import SelectEnseignant from "../inputs/SelectEnseignant"

export default function({id, onSubmit}:any){
    const [enseignant, setEnseignant] = useState(0)
    const [stage, setStage] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    useEffect(() => {
        db.supervisions.get(Number(id)).then((supervision) => {
            setEnseignant(supervision?.enseignant ?? 0)
            setStage(supervision?.stage ?? 0)
            setNbStagiaires(supervision?.nbStagiaires ?? 0)
        })
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, enseignant, stage, nbStagiaires}, resetForm)
    }

    function resetForm(){
        setEnseignant(0)
        setStage(0)
        setNbStagiaires(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectStage value={stage} onChange={(id: any) => setStage(id)} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de stagiaires: <input type="number" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>
                        
            <input type="submit" value="Envoyer" />
        </form>
    </>
}