'use client'

import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function(){
    const [numeroEmploye, setNumeroEmploye] = useState("")
    const [prenom, setPrenom] = useState("")
    const [nom, setNom] = useState("")
    const [courriel, setCourriel] = useState("")

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.enseignants.add({
            numeroEmploye, prenom, nom, courriel
        })
        setNumeroEmploye("")
        setPrenom("")
        setNom("")
        setCourriel("")
    }

    return <>
        <form onSubmit={submit}>
            <p><label>No d'employé: <input type="text" name="numeroEmploye" value={numeroEmploye} onChange={(ev) => setNumeroEmploye(ev.target.value)} /></label></p>
            <p><label>Prenom: <input type="text" name="prenom" value={prenom} onChange={(ev) => setPrenom(ev.target.value)} /></label></p>
            <p><label>Nom: <input type="text" name="nom" value={nom} onChange={(ev) => setNom(ev.target.value)} /></label></p>
            <p><label>Courriel: <input type="email" name="courriel" value={courriel} onChange={(ev) => setCourriel(ev.target.value)} /></label></p>
            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../enseignants")}>Retour</button>
    </>
    
}