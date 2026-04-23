import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useState } from "react"

export default function({value, onChange, session}: any){
    const [allocations, setAllocations] = useState([])

    useEffect(() => {
        db.allocations.where('session').equals(session).toArray().then((allocations:any) => {
            setAllocations(allocations)
            //if(value != 0 && allocations.find((cour: any) => cour.id == value) == undefined) onChange(0)
        })
    }, [session])

    return <>
        <label>Allocation: <select name="allocation" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez une allocation</option>
            {allocations?.map((allocation: any) => {
                return <option key={allocation.id} value={allocation.id}>{allocation?.code} - {allocation?.description} ({allocation?.quantite})</option>
            })}
        </select></label>
    </>
}