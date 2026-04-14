import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({value, onChange}: any){
    const stages = useLiveQuery(() => db.stages.toArray())
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <label>Stage: <select name="stage" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez un stage</option>
            {stages?.map((stage) => {
                const session = sessions?.find((el) => el.id == stage?.session)
                return <option key={stage.id} value={stage.id}>{session?.saison} {session?.annee}</option>
            })}
        </select></label>
    </>
}