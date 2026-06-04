import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Enseignant } from "@/app/db/db"

export default function({value, onChange}: any){
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    const sortedEnseignants = (enseignants ?? [])
        ?.sort((a, b) => {
            const nomComp = (a.nom || "").localeCompare(b.nom || "");
            if (nomComp !== 0) return nomComp;
            return (a.prenom || "").localeCompare(b.prenom || "");
        });

    return <select name="enseignant" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un enseignant</option>
        {sortedEnseignants?.map((enseignant: any) => (
            <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
        ))}
    </select>
}