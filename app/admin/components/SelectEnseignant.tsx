import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({enseignant, onChange}: any){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    return <>
        <label>Enseignant: <select name="enseignant" value={enseignant} onChange={onChange}>
            {enseignants?.map((enseignant: any) => (
                <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
            ))}
        </select></label>
    </>
}