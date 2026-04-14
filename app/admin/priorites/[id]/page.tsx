'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectEnseignant from "../../components/SelectEnseignant";

export default function(){
    const [id, setId] = useState(-1)
    const [sessionDebut, setSessionDebut] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [cours, setCours] = useState(0)
    const [enseignant, setEnseignant] = useState(0)
    const [coursListe, setCoursListe] = useState([])

    const sessions = useLiveQuery(() => db.sessions.toArray())    

    useEffect(() => {
        db.cours.where('saison').equals(saison).toArray().then((cours:any) => {
            setCoursListe(cours)
            setCours(cours[0]?.id ?? 0)
        })
    }, [saison])

    useEffect(() => {
        setSaison(sessions?.find((el) => el.id == sessionDebut)?.saison ?? "automne")
    }, [sessionDebut])

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.priorites.get(Number(params.id))
        .then((priorite) => {
            setId(priorite?.id ?? -1)
            setEnseignant(priorite?.enseignant ?? 0)
            setCours(priorite?.cours ?? 0)
            setSessionDebut(priorite?.sessionDebut ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.priorites.update(id, {enseignant, cours, sessionDebut})
        router.push("../priorites")
    }

    async function sessionChanged(ev: any){
        setSessionDebut(ev.target.value)
        setSaison(ev.target.options[ev.target.selectedIndex].dataset.saison)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            
            <p><label>Session: <select name="session" value={sessionDebut} onChange={sessionChanged}>
                {sessions?.map((session) => (
                    <option key={session.id} value={session.id} data-saison={session.saison}>{session.saison} {session.annee}</option>
                ))}
            </select></label></p>

            <p><label>Cours: <select name="cours" value={cours} onChange={(ev) => setCours(Number(ev.target.value))}>
                {coursListe?.map((cour: any) => (
                    <option key={cour.id} value={cour.id}>{cour.sigle} - {cour.nom}</option>
                ))}
            </select></label></p>
            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../priorites")}>Retour</button>
    </>
    
}