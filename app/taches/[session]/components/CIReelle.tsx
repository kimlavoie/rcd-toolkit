import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import type { CIReelle, Enseignant } from "@/app/db/db"

export default function({cache, session, tri, firstColWidth}:any){
    const CIReelles = useFirestoreCollection<CIReelle>("CIReelles")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    const {saison, annee} = extractSessionInfos(session)

    async function clearAll(){
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les CI Réelles pour la session ${saison} ${annee} ?`)) {
            await clearCI()
        }
    }

    async function clearCI(){
        const CIReellesSession = CIReelles?.filter(CIReelle => CIReelle.session == session)
        for (const CIReelle of (CIReellesSession ?? [])) {
            await firebaseDb.CIReelles.delete(CIReelle.id)
        }
    }

    async function CIHandler(ev:any){
        const enseignantId = ev.target.dataset.enseignantId
        const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignantId && CIReelle.session == session)
        const nouvelleValeur = Number(ev.target.value)

        if(CIReelle){
            await firebaseDb.CIReelles.update(CIReelle.id, {CI: nouvelleValeur})
        } else {
            await firebaseDb.CIReelles.add({enseignant: enseignantId, CI: nouvelleValeur, session})
        }
    }

    const firstColStyle = {
        position: "sticky" as const, 
        left: 0, 
        zIndex: 101, 
        backgroundColor: "#f8f9fa",
        minWidth: `${firstColWidth}px`,
        width: `${firstColWidth}px`
    }

    return <>
            <tr className="table-light">
                <th style={firstColStyle}>
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="small">CI Réelle {saison}</span>
                        <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={clearAll} title="Réinitialiser">⟲</button>
                    </div>
                </th>
                { (enseignants ?? [])
                .toSorted((a:any, b:any) => (a[tri] ?? "").localeCompare(b[tri] ?? ""))
                .filter(enseignant => !cache.includes(enseignant.id))
                .map(enseignant => {
                    const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignant.id && CIReelle.session == session)
                    const value = CIReelle ? CIReelle.CI : 0
                    return <td key={enseignant.id} className="bg-light">
                            <input className="form-control form-control-sm text-center" type="number" min="0" step="0.01" value={value} data-enseignant-id={enseignant.id} onChange={CIHandler}/>
                        </td>
                })}
            </tr>
        </>
}