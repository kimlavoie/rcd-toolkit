import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectEnseignant from "../inputs/SelectEnseignant"
import SelectAllocation from "../inputs/SelectAllocation"

export default function({id, session, onSubmit}:any){
    const [allocation, setAllocation] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    const [quantite, setQuantite] = useState(0)

    useEffect(() => {
        db.liberations.get(Number(id))
        .then((liberation) => {
            setAllocation(liberation?.allocation ?? 0)
            setEnseignant(liberation?.enseignant ?? 0)
            setQuantite(liberation?.quantite ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, allocation, enseignant, quantite, session}, resetForm)
    }

    function resetForm(){
        setAllocation(0)
        setEnseignant(0)
        setQuantite(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><SelectAllocation value={allocation} onChange={(id: any) => setAllocation(id)} session={session} /></p>
            <p><label>Quantité: <input type="number" min="0" max="1" step="0.01"name="nom" value={quantite} onChange={(ev) => setQuantite(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}