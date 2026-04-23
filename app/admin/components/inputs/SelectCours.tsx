import { db } from "@/app/db/db"
import { useEffect, useState } from "react"

export default function({value, onChange, saison}: any){
    const [coursListe, setCoursListe] = useState([])

    useEffect(() => {
        db.cours.where('saison').equals(saison).toArray().then((cours:any) => {
            setCoursListe(cours)
            if(value != 0 && cours.find((cour: any) => cour.id == value) == undefined) onChange(0)
        })
    }, [saison])

    return <>
        <label>Cours: <select name="cours" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez un cours</option>
            {coursListe?.map((cour: any) => (
                <option key={cour.id} value={cour.id}>{cour.sigle} - {cour.nom}</option>
            ))}
        </select></label>
    </>
}