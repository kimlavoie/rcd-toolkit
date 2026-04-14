'use client'

import { db } from "@/app/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SelectEnseignant from "../../components/SelectEnseignant";
import SelectCours from "../../components/SelectCours";

export default function(){
    const [id, setId] = useState(-1)
    const [sessionDebut, setSessionDebut] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [cours, setCours] = useState(0)
    const [enseignant, setEnseignant] = useState(0)

    const sessions = useLiveQuery(() => db.sessions.toArray())    

    useEffect(() => {
        setSaison(sessions?.find((el) => el.id == sessionDebut)?.saison ?? "automne")
    }, [sessionDebut])

    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        db.priorites.get(Number(params.id))
        .then((priorite) => {
            console.log(priorite)
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

            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>
            
            <input type="submit" value="Modifier" />
        </form>
        <button onClick={() => router.push("../priorites")}>Retour</button>
    </>
    
}