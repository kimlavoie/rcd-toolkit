import { db } from "@/app/db/db"
import { useEffect, useState } from "react"

export default function({id, session, onSubmit}:any){
    const [code, setCode] = useState("")
    const [description, setDescription] = useState("")
    const [quantite, setQuantite] = useState(0)

    useEffect(() => {
        db.allocations.get(Number(id))
        .then((allocation) => {
            setCode(allocation?.code ?? "")
            setDescription(allocation?.description ?? "")
            setQuantite(allocation?.quantite ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, code, description, quantite, session}, resetForm)
    }

    function resetForm(){
        setCode("")
        setDescription("")
        setQuantite(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Code: <input type="text" name="numeroEmploye" value={code} onChange={(ev) => setCode(ev.target.value)} /></label></p>
            <p><label>Description: <input type="text" name="prenom" value={description} onChange={(ev) => setDescription(ev.target.value)} /></label></p>
            <p><label>Quantité: <input type="number" min="0" max="1" step="0.01"name="nom" value={quantite} onChange={(ev) => setQuantite(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}