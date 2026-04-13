'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function(){
    const [id, setId] = useState(-1)
    const [sigle, setSigle] = useState("")
    const [nom, setNom] = useState("")
    const [heuresTheorie, setHeuresTheorie] = useState(0)
    const [heuresPratique, setHeuresPratique] = useState(0)
    const [heuresMaison, setHeuresMaison] = useState(0)

    const params = useParams()
    const router = useRouter()
    const enseignant = useLiveQuery(() => db.cours.get(Number(params.id)))

    useEffect(() => {
        db.cours.get(Number(params.id))
        .then((cour) => {
            setId(cour?.id ?? -1)
            setSigle(cour?.sigle ?? "")
            setNom(cour?.nom ?? "")
            setHeuresTheorie(cour?.heuresTheorie ?? -1)
            setHeuresPratique(cour?.heuresPratique ?? -1)
            setHeuresMaison(cour?.heuresMaison ?? -1)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.cours.update(id, {sigle, nom, heuresTheorie, heuresPratique, heuresMaison})
        router.push("../cours")
    }

    return <>
        <form onSubmit={submit}>
        <p><label>Sigle: <input type="text" name="sigle" value={sigle} onChange={(ev) => setSigle(ev.target.value)} /></label></p>
            <p><label>Nom: <input type="text" name="nom" value={nom} onChange={(ev) => setNom(ev.target.value)} /></label></p>
            <p><label>Heures de théorie: <input type="number" min="0" name="heuresTheorie" value={heuresTheorie} onChange={(ev) => setHeuresTheorie(Number(ev.target.value))} /></label></p>
            <p><label>Heures de pratique: <input type="number" min="0" name="heuresPratique" value={heuresPratique} onChange={(ev) => setHeuresPratique(Number(ev.target.value))} /></label></p>
            <p><label>Heures à la maison: <input type="number" min="0" name="heuresMaison" value={heuresMaison} onChange={(ev) => setHeuresMaison(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../cours")}>Retour</button>
    </>
    
}