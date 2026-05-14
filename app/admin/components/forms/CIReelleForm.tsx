import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectEnseignant from "../inputs/SelectEnseignant"

export default function({id, session, onSubmit}:any){
    const [enseignant, setEnseignant] = useState(0)
    const [CI, setCI] = useState(0)

    useEffect(() => {
        db.CIReelles.get(Number(id))
        .then((CIReelle) => {
            setEnseignant(CIReelle?.enseignant ?? 0)
            setCI(CIReelle?.CI ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, enseignant, CI, session}, resetForm)
    }

    function resetForm(){
        setEnseignant(0)
        setCI(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>CI: <input type="number" min="0" step="0.01"name="nom" value={CI} onChange={(ev) => setCI(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}