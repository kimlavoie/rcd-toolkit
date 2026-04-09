'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function(){
    const [id, setId] = useState(-1)
    const [numeroEmploye, setNumeroEmploye] = useState("")
    const [prenom, setPrenom] = useState("")
    const [nom, setNom] = useState("")
    const [courriel, setCourriel] = useState("")

    const params = useParams()
    const router = useRouter()
    const enseignant = useLiveQuery(() => db.enseignants.get(Number(params.id)))

    useEffect(() => {
        db.enseignants.get(Number(params.id))
        .then((enseignant) => {
            setId(enseignant?.id ?? -1)
            setNumeroEmploye(enseignant?.numeroEmploye ?? "")
            setPrenom(enseignant?.prenom ?? "")
            setNom(enseignant?.nom ?? "")
            setCourriel(enseignant?.courriel ?? "")
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.enseignants.update(id, {numeroEmploye, prenom, nom , courriel})
        router.push("/enseignants")
    }

    return <>
        <form onSubmit={submit}>
            <p><label>No d'employé: <input type="text" name="numeroEmploye" value={numeroEmploye} onChange={(ev) => setNumeroEmploye(ev.target.value)} /> </label></p>
            <p><label>Prenom: <input type="text" name="prenom" value={prenom} onChange={(ev) => setPrenom(ev.target.value)} /></label></p>
            <p><label>Nom: <input type="text" name="nom" value={nom} onChange={(ev) => setNom(ev.target.value)} /></label></p>
            <p><label>Courriel: <input type="email" name="courriel" value={courriel} onChange={(ev) => setCourriel(ev.target.value)} /></label></p>
            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("/enseignants")}>Retour</button>
    </>
    
}