import { db } from "@/app/db/db"
import { useEffect, useState } from "react"

export default function({id, onSubmit}:any){
    const [sigle, setSigle] = useState("")
    const [nom, setNom] = useState("")
    const [saison, setSaison] = useState("automne")
    const [heuresTheorie, setHeuresTheorie] = useState(0)
    const [heuresPratique, setHeuresPratique] = useState(0)
    const [heuresMaison, setHeuresMaison] = useState(0)

    useEffect(() => {
        db.cours.get(Number(id)).then((cour) => {
            setSigle(cour?.sigle ?? "")
            setNom(cour?.nom ?? "")
            setSaison(cour?.saison ?? "")
            setHeuresTheorie(cour?.heuresTheorie ?? -1)
            setHeuresPratique(cour?.heuresPratique ?? -1)
            setHeuresMaison(cour?.heuresMaison ?? -1)
        })
    }, [])

    function submit(event: React.SubmitEvent){
        event.preventDefault()
        onSubmit({id, sigle, nom, saison, heuresTheorie, heuresPratique, heuresMaison}, resetForm)
    }

    function resetForm(){
        setSigle("")
        setNom("")
        setSaison("automne")
        setHeuresTheorie(0)
        setHeuresPratique(0)
        setHeuresMaison(0)
    }

    return <>
        <form onSubmit={submit}>
            <p><label>Sigle: <input type="text" name="sigle" value={sigle} onChange={(ev) => setSigle(ev.target.value)} /></label></p>
            <p><label>Nom: <input type="text" name="nom" value={nom} onChange={(ev) => setNom(ev.target.value)} /></label></p>
            <p><label>Saison: <select name="saison" value={saison} onChange={(ev) => setSaison(ev.target.value)}>
                <option value="automne">Automne</option>
                <option value="hiver">Hiver</option>
            </select></label></p>
            <p><label>Heures de théorie: <input type="number" min="0" name="heuresTheorie" value={heuresTheorie} onChange={(ev) => setHeuresTheorie(Number(ev.target.value))} /></label></p>
            <p><label>Heures de pratique: <input type="number" min="0" name="heuresPratique" value={heuresPratique} onChange={(ev) => setHeuresPratique(Number(ev.target.value))} /></label></p>
            <p><label>Heures à la maison: <input type="number" min="0" name="heuresMaison" value={heuresMaison} onChange={(ev) => setHeuresMaison(Number(ev.target.value))} /></label></p>
            
            <input type="submit" value="Envoyer" />
        </form>
    </>
}