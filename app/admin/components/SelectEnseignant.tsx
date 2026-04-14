import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({value, onChange}: any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    return <>
        <label>Enseignant: <select name="enseignant" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez un enseignant</option>
            {enseignants?.map((enseignant: any) => (
                <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
            ))}
        </select></label>
    </>
}