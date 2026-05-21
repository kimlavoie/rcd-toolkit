import { firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { getCIColor } from "@/app/constants/ciConfig"
import { useData } from "./DataContext"
import StickyHeader from "./ui/StickyHeader"
import StickyCell from "./ui/StickyCell"

export default function({visibleEnseignants, session, enseignantWidth, ciBottom, ciTop}:any){
    const { CIReelles } = useData()

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

    return <>
            <tr className="table-light">
                <StickyHeader 
                    isFirstCol 
                    zIndex={103} 
                    bottom={ciBottom} 
                    top={ciTop}
                    style={{ backgroundColor: "#f8f9fa" }}
                >
                    <div className="d-flex justify-content-between align-items-center gap-2">
                        <span className="fw-bold">CI Réelle {saison}</span>
                        <button type="button" className="btn btn-link btn-sm text-danger p-0 m-0" style={{lineHeight: 1, textDecoration: "none"}} onClick={clearAll} title="Réinitialiser">⟲</button>
                    </div>
                </StickyHeader>
                { visibleEnseignants.map((enseignant: any) => {
                    const CIReelle = CIReelles?.find(CIReelle => CIReelle.enseignant == enseignant.id && CIReelle.session == session)
                    const value = CIReelle ? CIReelle.CI : 0
                    const color = getCIColor(value, 'session')
                    return <StickyCell 
                        key={enseignant.id} 
                        className="bg-light text-center" 
                        bottom={ciBottom} 
                        top={ciTop} 
                        zIndex={ciTop ? 104 : 102}
                        style={{
                            minWidth: `${enseignantWidth}px`, 
                            width: `${enseignantWidth}px`, 
                            backgroundColor: "#f8f9fa", 
                            borderBottom: ciTop ? "2px solid #dee2e6" : "none"
                        }}
                    >
                        <input className="form-control form-control-sm text-center mx-auto fw-bold" type="number" min="0" step="0.01" value={value} data-enseignant-id={enseignant.id} onChange={CIHandler} style={{maxWidth: "60px", fontSize: "0.8rem", padding: "2px", color}}/>
                    </StickyCell>
                })}
            </tr>
        </>
}
