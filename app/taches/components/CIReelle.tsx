'use client'
import { firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useData } from "./DataContext"
import StickyHeader from "./ui/StickyHeader"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import { toast } from "react-hot-toast"

export default function CIReelle({visibleEnseignants, session, columnWidths, globalWidth, ciBottom, ciTop}: any){
    const data = useData()
    const { CIReelles, charges, liberations, groupes } = data

    const {saison, annee} = extractSessionInfos(session)

    const getCellStyle = (enseignantId: string) => {
        const width = columnWidths?.[enseignantId] || globalWidth || 200
        return {
            borderRight: "1px solid #dee2e6",
            borderBottom: "1px solid #dee2e6",
            minWidth: `${width}px`,
            width: `${width}px`,
            maxWidth: `${width}px`,
            overflow: "hidden"
        }
    }

    async function handleCIChange(ev: any){
        const enseignantId = ev.target.dataset.enseignantId
        const value = Number(ev.target.value)

        const existing = (CIReelles ?? []).find(ci => ci.enseignant == enseignantId && ci.session == session)
        if(existing){
            await firebaseDb.CIReelles.update(existing.id, {CI: value})
        } else {
            await firebaseDb.CIReelles.add({enseignant: enseignantId, session: session, CI: value})
        }
    }

    return <>
        <tr className="table-secondary">
            <StickyHeader isFirstCol style={{backgroundColor: "#e9ecef", zIndex: 102}}>
                <span className="fw-bold">{saison} {annee} (Réelle)</span>
            </StickyHeader>
            <td colSpan={visibleEnseignants.length} style={{backgroundColor: "#e9ecef", borderBottom: "1px solid #dee2e6"}}></td>
        </tr>
        <tr>
            <StickyHeader isFirstCol>CI Réelle (Saisie)</StickyHeader>
            {visibleEnseignants.map((enseignant: any) => {
                const ci = (CIReelles ?? []).find(ci => ci.enseignant == enseignant.id && ci.session == session)
                return <td key={enseignant.id} style={getCellStyle(enseignant.id)}>
                    <input 
                        type="number" 
                        step="0.01" 
                        className="form-control form-control-sm text-center" 
                        value={ci ? ci.CI : 0} 
                        data-enseignant-id={enseignant.id}
                        onChange={handleCIChange}
                    />
                </td>
            })}
        </tr>
        <tr>
            <StickyHeader 
                isFirstCol 
                bottom={ciBottom} 
                top={ciTop} 
                zIndex={103} 
                style={{ 
                    backgroundColor: "#f8f9fa", 
                    borderTop: (ciBottom && ciBottom !== "auto") ? "1px solid #dee2e6" : "none",
                    borderBottom: ciTop ? "2px solid #dee2e6" : "1px solid #dee2e6",
                    boxShadow: (ciBottom && ciBottom !== "auto") ? "0 -2px 10px rgba(0,0,0,0.1)" : "none"
                }}
            >
                CI {saison}
            </StickyHeader>
            {visibleEnseignants.map((enseignant: any) => {
                const width = columnWidths?.[enseignant.id] || globalWidth || 200
                return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} trigger={{charges, liberations, groupes, CIReelles}} style={getCellStyle(enseignant.id)} bottom={ciBottom} top={ciTop}/>
            })}
        </tr>
    </>
}
