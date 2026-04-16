import { db } from "@/app/db/db"
import { useEffect, useState } from "react"
import SelectSession from "../inputs/SelectSession"

export default function({id, onSubmit}:any){
    const [session, setSession] = useState(0)
    const [ETCparStagiaire, setETCparStagiaire] = useState(0)
    const [nbStagiaires, setNbStagiaires] = useState(0)

    useEffect(() => {
        db.stages.get(Number(id)).then((stage) => {
            setSession(stage?.session ?? 0)
            setETCparStagiaire(stage?.ETCparStagiaire ?? 0)
            setNbStagiaires(stage?.nbStagiaires ?? 0)
        })
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, session, ETCparStagiaire, nbStagiaires}, resetForm)
    }

    function resetForm(){
        setSession(0)
        setETCparStagiaire(0)
        setNbStagiaires(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><SelectSession value={session} onChange={(id: any) => setSession(id)} /></p>
            <p><label>ETC par stagiaire: <input type="number" min="0" max="1" step="0.01" name="ETCparStagiaire" value={ETCparStagiaire} onChange={(ev) => setETCparStagiaire(Number(ev.target.value))} /></label></p>
            <p><label>Nombre de stagiaires: <input type="number" min="0" name="nbStagiaires" value={nbStagiaires} onChange={(ev) => setNbStagiaires(Number(ev.target.value))} /></label></p>
            
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}