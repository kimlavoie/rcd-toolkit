import { db } from "@/app/db/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function({value, onChange}: any){
    const sessions = useLiveQuery(() => db.sessions.toArray())

    return <>
        <label>Session: <select name="session" value={value} onChange={(ev:any) => onChange(ev.target.value, ev.target.options[ev.target.selectedIndex].dataset.saison)}>
            <option value="0" hidden disabled>Choisissez une session</option>
            {sessions?.map((session) => (
                <option key={session.id} value={session.id} data-saison={session.saison}>{session.saison} {session.annee}</option>
            ))}
        </select></label>
    </>
}