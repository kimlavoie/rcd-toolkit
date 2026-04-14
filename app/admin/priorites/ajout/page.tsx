'use client'

import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Priorite{
    id: number
    enseignant: number
    cours: number
    sessionDebut: number
}

export default function(){
    const [enseignant, setEnseignant] = useState(0)
    const [cours, setCours] = useState(0)
    const [sessionDebut, setSessionDebut] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [coursListe, setCoursListe] = useState([])

    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    useEffect(() => {
        setSessionDebut(sessions?.[0]?.id ?? 0)
    }, [sessions])

    useEffect(() => {
        setEnseignant(enseignants?.[0]?.id ?? 0)
    }, [enseignants])

    useEffect(() => {
        db.cours.where('saison').equals(saison).toArray().then((cours:any) => {
            setCoursListe(cours)
            setCours(cours[0]?.id ?? 0)
        })
    }, [saison])

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.priorites.add({
            enseignant, cours, sessionDebut
        })
        setEnseignant(enseignants?.[0]?.id ?? 0)
        //@ts-ignore
        setCours(coursListe?.[0]?.id ?? 0)
        setSessionDebut(sessions?.[0]?.id ?? 0)

    }

    async function sessionChanged(ev: any){
        setSessionDebut(ev.target.value)
        setSaison(ev.target.options[ev.target.selectedIndex].dataset.saison)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Enseignant: <select name="enseignant" value={enseignant} onChange={(ev) => setEnseignant(Number(ev.target.value))}>
                {enseignants?.map((enseignant: any) => (
                    <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
                ))}
            </select></label></p>
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
            
            
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../priorites")}>Retour</button>
    </>
    
}