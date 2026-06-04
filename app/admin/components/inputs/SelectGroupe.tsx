import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Groupe, Cours } from "@/app/db/db"

export default function({value, onChange, session}: any){
    const groupes = useFirestoreCollection<Groupe>("groupes")
    const coursListe = useFirestoreCollection<Cours>("cours")
    const filteredGroupes = (groupes ?? [])?.filter(g => !session || g.session === session)
    const sortedGroupes = [...filteredGroupes].sort((a, b) => {
        const coursA = coursListe?.find((el) => el.id == a?.cours)
        const coursB = coursListe?.find((el) => el.id == b?.cours)
        return (coursA?.sigle || "").localeCompare(coursB?.sigle || "")
    })

    return <select name="groupe" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un groupe</option>
        {sortedGroupes?.map((groupe: any) => {
            const cours = coursListe?.find((el) => el.id == groupe?.cours)
            return <option key={groupe.id} value={groupe.id}>{cours?.sigle} - {cours?.nom} ({groupe.nbEtudiants})</option>
        })}
    </select>
}