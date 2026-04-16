import { extractSessionInfos, makeSessionCode } from "@/app/utilities/sessions"
import { useEffect, useState } from "react"

export default function({code, onChange}: any){
    const [saison, setSaison] = useState("Automne")
    const [annee, setAnnee] = useState(2026)

    useEffect(() => {
        const {saison:saisonDepart, annee:anneeDepart} = extractSessionInfos(code)
        setSaison(saisonDepart)
        setAnnee(Number(anneeDepart))
    }, [code])

    return <>
        <label>Session: 
            <select name="saison" value={saison} onChange={(ev) => {setSaison(ev.target.value); onChange(makeSessionCode(ev.target.value, String(annee)))}}>
                <option value="Automne">Automne</option>
                <option value="Hiver">Hiver</option>
            </select>
            <input type="number" min="2000" name="annee" value={annee} onChange={(ev) => {setAnnee(Number(ev.target.value)); onChange(makeSessionCode(String(saison),ev.target.value))}} />
        </label>
    </>
}