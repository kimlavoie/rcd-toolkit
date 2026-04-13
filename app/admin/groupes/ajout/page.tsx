'use client'

import { Cours, db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function(){
    const [session, setSession] = useState(0)
    const [saison, setSaison] = useState("automne")
    const [cours, setCours] = useState(-1)
    const [nbEtudiants, setNbEtudiants] = useState(0)
    const [coursListe, setCoursListe] = useState([])

    const sessions = useLiveQuery(() => db.sessions.toArray())

    useEffect(() => {
        db.cours.where('saison').equals(saison).toArray().then((cours:any) => setCoursListe(cours))
    }, [saison])

    const router = useRouter()

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        db.groupes.add({
            session: session, cours, nbEtudiants
        })
        setSession(0)
        setCours(0)
        setNbEtudiants(0)
    }

    async function sessionChanged(ev: any){
        setSession(ev.target.value)
        setSaison(ev.target.options[ev.target.selectedIndex].dataset.saison)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Session: <select name="session" value={session} onChange={sessionChanged}>
                {sessions?.map((session) => (
                    <option key={session.id} value={session.id} data-saison={session.saison}>{session.saison} {session.annee}</option>
                ))}
            </select></label></p>

            <p><label>Cours: <select name="cours" value="" onChange={(ev) => setCours(Number(ev.target.value))}>
                {coursListe?.map((cour: any) => (
                    <option key={cour.id} value={cour.id}>{cour.sigle} - {cour.nom}</option>
                ))}
            </select></label></p>

            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
            <input type="submit" value="Ajouter" />
        </form>
        <button onClick={() => router.push("../groupes")}>Retour</button>
    </>
    
}