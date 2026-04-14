'use client'

import { db } from "@/app/db/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectSession from "../../components/SelectSession";
import SelectEnseignant from "../../components/SelectEnseignant";

export default function(){
    const [id, setId] = useState(0)
    const [code, setCode] = useState("")
    const [description, setDescription] = useState("")
    const [quantite, setQuantite] = useState(0)
    const [session, setSession] = useState(0)
    const [enseignant, setEnseignant] = useState(0)

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.liberations.get(Number(params.id))
        .then((liberation) => {
            setId(liberation?.id ?? -1)
            setCode(liberation?.code ?? "")
            setDescription(liberation?.description ?? "")
            setQuantite(liberation?.quantite ?? 0)
            setSession(liberation?.session ?? 0)
            setEnseignant(liberation?.enseignant ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.liberations.update(id, {code, description, quantite, session, enseignant})
        router.push("../liberations")
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Code: <input type="text" name="numeroEmploye" value={code} onChange={(ev) => setCode(ev.target.value)} /></label></p>
            <p><label>Description: <input type="text" name="prenom" value={description} onChange={(ev) => setDescription(ev.target.value)} /></label></p>
            <p><label>Quantité: <input type="number" min="0" max="1" step="0.05"name="nom" value={quantite} onChange={(ev) => setQuantite(Number(ev.target.value))} /></label></p>
            <p><SelectSession value={session} onChange={(id: any) => setSession(id)} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../liberations")}>Retour</button>
    </>
    
}