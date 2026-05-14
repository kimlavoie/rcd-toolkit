import { db } from "@/app/db/db"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useLiveQuery } from "dexie-react-hooks"

export default function({cache, session, tri}:any){
    const CIReelles = useLiveQuery(() => db.CIReelles.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())

    const {saison, annee} = extractSessionInfos(session)

    async function clearAll(){
        await clearCI()
    }

    async function clearCI(){
        const CIReellesSession = CIReelles?.filter(CIReelle => CIReelle.session == session)
        CIReellesSession?.forEach(CIReelle => db.CIReelles.delete(Number(CIReelle.id)))
    }

    function CIHandler(ev:any){
        const enseignantId = Number(ev.target.dataset.enseignantId)
        const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignantId && CIReelle.session == session)
        const nouvelleValeur = Number(ev.target.value)

        if(CIReelle){
            db.CIReelles.update(Number(CIReelle.id), {CI: nouvelleValeur})
        } else {
            db.CIReelles.add({enseignant: enseignantId, CI: nouvelleValeur, session})
        }
    }

    return <>
            <tr><th colSpan={100} style={{fontSize: "1.5em", backgroundColor: "#eeeeee"}}>
                {saison} {annee}
                <button type="button" className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}} onClick={clearAll}>⟲</button>
                </th>
            </tr>
            <tr>
                <th>
                    <p>CI Réelles 
                        <button type="button" onClick={clearCI} className="btn btn-primary rounded-circle" style={{float: "right", padding: "0px 5px"}}>⟲</button>    
                    </p> 
                </th>
                {enseignants?.toSorted((a:any, b:any) => a[tri].localeCompare(b[tri]))
                .filter(enseignant => !cache.includes(enseignant.id))
                .map(enseignant => {
                    const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignant.id && CIReelle.session == session)
                    const value = CIReelle ? CIReelle.CI : 0
                    return <td key={enseignant.id}>
                            <p><input className="w-100" type="number" min="0" step="0.01" value={value} data-enseignant-id={enseignant.id} onChange={CIHandler}/></p>
                        </td>
                })}
            </tr>
        </>
}