import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectGroupe from "../inputs/SelectGroupe"
import SelectEnseignant from "../inputs/SelectEnseignant"
import { useParams } from "next/navigation"

export default function({id, session, onSubmit}:any){
    const [groupe, setGroupe] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    const [nbSemaines, setNbSemaines] = useState(0)

    useEffect(() => {
        db.charges.get(Number(id))
        .then((charge) => {
            setGroupe(charge?.groupe ?? 0)
            setEnseignant(charge?.enseignant ?? 0)
            setNbSemaines(charge?.nbSemaines ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, groupe, enseignant, nbSemaines}, resetForm)
    }

    function resetForm(){
        setGroupe(0)
        setEnseignant(0)
        setNbSemaines(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectGroupe value={groupe} onChange={(id: any) => setGroupe(id)} session={session} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><label>Nombre de semaines: <input type="number" name="nbSemaines" value={nbSemaines} onChange={(ev) => setNbSemaines(Number(ev.target.value))} /></label></p>
                        
            <input type="submit" value="Envoyer" />
        </form>
    </>
}