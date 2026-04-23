import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectCours from "../inputs/SelectCours"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function({id, session, onSubmit}:any){
    const {saison:saisonDepart, annee:anneeDepart} = extractSessionInfos(session)

    const [cours, setCours] = useState(0)
    const [nbEtudiants, setNbEtudiants] = useState(0)
    const [saison, setSaison] = useState(saisonDepart)

    useEffect(() => {
        db.groupes.get(Number(id))
        .then((groupe) => {
            setCours(groupe?.cours ?? 0)
            setNbEtudiants(groupe?.nbEtudiants ?? 0)
        })  
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, session, cours, nbEtudiants}, resetForm)
    }

    function resetForm(){
        setCours(0)
        setNbEtudiants(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectCours value={cours} onChange={(id: any) => setCours(id)} saison={saison} /></p>
            <p><label>Nombre d'étudiants: <input type="number" name="nbEtudiants" value={nbEtudiants} onChange={(ev) => setNbEtudiants(Number(ev.target.value))} /></label></p>
                        
            <input type="submit" value="Envoyer" />
        </form>
    </>
}