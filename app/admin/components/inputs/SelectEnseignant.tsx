import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Enseignant } from "@/app/db/db"

export default function({value, onChange}: any){
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    return <select name="enseignant" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un enseignant</option>
        {enseignants?.map((enseignant: any) => (
            <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
        ))}
    </select>
}