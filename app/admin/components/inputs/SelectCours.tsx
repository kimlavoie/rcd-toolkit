import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Cours } from "@/app/db/db"

export default function({value, onChange, saison}: any){
    const coursListe = useFirestoreCollection<Cours>("cours")
    const filteredCours = coursListe
        ?.filter(c => !saison || c.saison === saison)
        ?.sort((a, b) => (a.sigle || "").localeCompare(b.sigle || ""))

    return <select name="cours" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un cours</option>
        {filteredCours?.map((cour: any) => (
            <option key={cour.id} value={cour.id}>{cour.sigle} - {cour.nom}</option>
        ))}
    </select>
}