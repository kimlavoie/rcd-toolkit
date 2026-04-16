import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectSession from "../inputs/SelectSession"
import SelectEnseignant from "../inputs/SelectEnseignant"
import SelectCours from "../inputs/SelectCours"

export default function({id, onSubmit}:any){
    const [enseignant, setEnseignant] = useState(0)
    const [cours, setCours] = useState(0)
    const [sessionDebut, setSessionDebut] = useState(0)
    const [saison, setSaison] = useState("automne")

    useEffect(() => {
        db.priorites.get(Number(id)).then((priorite) => {
            setEnseignant(priorite?.enseignant ?? 0)
            setSessionDebut(priorite?.sessionDebut ?? 0)
            setCours(priorite?.cours ?? 0)
        })
    }, [])

    useEffect(() => {
        db.sessions.get(Number(sessionDebut)).then((session) => {
            setSaison(session?.saison ?? "automne")
        })
    }, [sessionDebut])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, enseignant, cours, sessionDebut}, resetForm)
    }

    function resetForm(){
        setEnseignant(0)
        setCours(0)
        setSessionDebut(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectEnseignant value={enseignant} onChange={(id: any) => setEnseignant(id)} /></p>
            <p><SelectSession value={sessionDebut} onChange={(id: any) => setSessionDebut(id)} /></p>
            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>
            <input type="submit" value="Envoyer" />
        </form>
    </>
}