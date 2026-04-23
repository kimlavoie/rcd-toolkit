import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useState } from "react"

export default function({value, onChange, session}: any){
    const [groupes, setGroupes] = useState([])
    const coursListe = useLiveQuery(() => db.cours.toArray())

    useEffect(() => {
        db.groupes.where('session').equals(session).toArray().then((groupes:any) => {
            setGroupes(groupes)
            if(value != 0 && groupes.find((cour: any) => cour.id == value) == undefined) onChange(0)
        })
    }, [session])

    return <>
        <label>Groupe: <select name="groupe" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez un groupe</option>
            {groupes?.map((groupe: any) => {
                const cours = coursListe?.find((el) => el.id == groupe?.cours)
                return <option key={groupe.id} value={groupe.id}>{cours?.sigle} - {cours?.nom} ({groupe.nbEtudiants})</option>
            })}
        </select></label>
    </>
}