'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import SelectSession from "../../components/SelectSession"
import SelectEnseignant from "../../components/SelectEnseignant"

interface Liberation{
    id: number
    code: string
    description: string
    quantite: number
    session: number
    enseignant: number
}

export default function(){
    const [code, setCode] = useState("")
    const [description, setDescription] = useState("")
    const [quantite, setQuantite] = useState(0)
    const [session, setSession] = useState(0)
    const [enseignant, setEnseignant] = useState(0)

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.liberations.add({
            code, description, quantite, session, enseignant
        })
        setCode("")
        setDescription("")
        setQuantite(0)
        setSession(0)
        setEnseignant(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Code: <input type="text" name="numeroEmploye" value={code} onChange={(ev) => setCode(ev.target.value)} /></label></p>
            <p><label>Description: <input type="text" name="prenom" value={description} onChange={(ev) => setDescription(ev.target.value)} /></label></p>
            <p><label>Quantité: <input type="number" min="0" max="1" step="0.05"name="nom" value={quantite} onChange={(ev) => setQuantite(Number(ev.target.value))} /></label></p>
            <p><SelectSession value={session} onChange={(id: any) => setSession(id)} /></p>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>

            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../liberations")}>Retour</button>
    </>
    
}