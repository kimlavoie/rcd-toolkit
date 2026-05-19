import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Allocation } from "@/app/db/db"

export default function({value, onChange, session}: any){
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const filteredAllocations = (allocations ?? [])?.filter(a => !session || a.session === session)

    return <select name="allocation" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez une allocation</option>
        {filteredAllocations?.map((allocation: any) => {
            return <option key={allocation.id} value={allocation.id}>{allocation?.code} - {allocation?.description} ({allocation?.quantite})</option>
        })}
    </select>
}