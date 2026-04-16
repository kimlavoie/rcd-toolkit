import { db } from "@/app/db/db"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useLiveQuery } from "dexie-react-hooks"

export default function({value, onChange}: any){
    const stages = useLiveQuery(() => db.stages.toArray())

    return <>
        <label>Stage: <select name="stage" value={value} onChange={(ev) => onChange(Number(ev.target.value))}>
            <option value="0" hidden disabled>Choisissez un stage</option>
            {stages?.map((stage) => {
                const {saison, annee} = extractSessionInfos(stage.session)
                return <option key={stage.id} value={stage.id}>{saison} {annee}</option>
            })}
        </select></label>
    </>
}