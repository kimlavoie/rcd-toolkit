import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import type { Stage } from "@/app/db/db"

export default function({value, onChange}: any){
    const stages = useFirestoreCollection<Stage>("stages")

    const sortedStages = (stages ?? [])?.sort((a, b) => (a.session || "").localeCompare(b.session || ""))

    return <select name="stage" className="form-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="" hidden disabled>Choisissez un stage</option>
        {sortedStages?.map((stage) => {
            const {saison, annee} = extractSessionInfos(stage.session)
            return <option key={stage.id} value={stage.id}>{saison} {annee}</option>
        })}
    </select>
}