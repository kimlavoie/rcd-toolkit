import { db } from "@/app/db/db"
import { useEffect, useState } from "react"

export default function({id, onSubmit}:any){
    const [saison, setSaison] = useState("automne")
    const [annee, setAnnee] = useState(0)

    useEffect(() => {
        db.sessions.get(Number(id)).then((session) => {
            setSaison(session?.saison ?? "")
            setAnnee(session?.annee ?? 0)
        })
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, saison, annee}, resetForm)
    }

    function resetForm(){
        setSaison("automne")
        setAnnee(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Saison: <select name="saison" value={saison} onChange={(ev) => setSaison(ev.target.value)}>
                <option value="automne">Automne</option>
                <option value="hiver">Hiver</option>
            </select></label></p>
            <p><label>Année: <input type="number" min="2000" name="annee" value={annee} onChange={(ev) => setAnnee(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}