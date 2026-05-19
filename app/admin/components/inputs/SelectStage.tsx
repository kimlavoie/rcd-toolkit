import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import type { Stage } from "@/app/db/db"

export default function({value, onChange}: any){
    const stages = useFirestoreCollection<Stage>("stages")

    return <select name="stage" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un stage</option>
        {stages?.map((stage) => {
            const {saison, annee} = extractSessionInfos(stage.session)
            return <option key={stage.id} value={stage.id}>{saison} {annee}</option>
        })}
    </select>
}