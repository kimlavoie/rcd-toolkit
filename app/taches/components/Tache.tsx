'use client'
import { useState, useEffect } from "react"
import { firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useData } from "./DataContext"
import StickyHeader from "./ui/StickyHeader"
import CollapsibleSectionRow from "./ui/CollapsibleSectionRow"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import { toast } from "react-hot-toast"
import { 
    getChargesManquantesCount, 
    getLiberationsManquantesCount, 
    getStagiairesRestantsCount, 
    getCoordinationRestante 
} from "@/app/utilities/businessLogic"

export default function Tache({visibleEnseignants, session, columnWidths, globalWidth, scenario = "production", ciBottom, ciTop, showCI = true, isPrinting}:any){
    const { groupes, charges: allCharges, allocations, liberations: allLiberations, stages, supervisions: allSupervisions, visibilityMap, setVisibility } = useData()

    const {saison, annee} = extractSessionInfos(session)
    
    const getVisible = (key: string, def = true) => {
        if (visibilityMap[key] !== undefined) return visibilityMap[key]
        if (visibilityMap["global_expansion"] !== undefined) return visibilityMap["global_expansion"]
        return def
    }

    const showSession = getVisible(`${session}_session`, true)
    const showCharges = getVisible(`${session}_charges`, true)
    const showLiberations = getVisible(`${session}_liberations`, true)
    const showStagesList = getVisible(`${session}_stages`, true)

    const toggle = (key: string) => {
        setVisibility(key, !getVisible(key, true))
    }

    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario) || []
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario) || []
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario) || []

    const sessionStages = stages?.filter(s => s.session === session) || []

    async function supervisionsHandler(ev:any, field: 'nbStagiaires' | 'coordination'){
        const enseignantId = ev.target.dataset.enseignantId
        const stageId = ev.target.dataset.stageId
        const nouvelleValeur = Number(ev.target.value)
        const stage = stages?.find(s => s.id == stageId)
        if(!stage) return
        const currentSupervision = supervisions?.find(s => s.enseignant == enseignantId && s.stage == stageId)
        if (field === 'nbStagiaires') {
            const rem = getStagiairesRestantsCount(stage, supervisions.filter(s => s.enseignant !== enseignantId))
            if(nouvelleValeur > rem){
                toast.error("La quantité de stagiaires dépasse le total prévu pour ce stage.")
                return
            }
        }
        if(currentSupervision){
            await firebaseDb.supervisions.update(currentSupervision.id, { [field]: nouvelleValeur })
        } else {
            await firebaseDb.supervisions.add({ enseignant: enseignantId, stage: stageId, nbStagiaires: field === 'nbStagiaires' ? nouvelleValeur : 0, coordination: field === 'coordination' ? nouvelleValeur : 0, scenario })
        }
    }

    async function clearAllData(){
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} (Scénario: ${scenario}) ?`)) {
            for (const stage of sessionStages) {
                const sups = supervisions?.filter(s => s.stage === stage.id)
                for (const s of (sups ?? [])) await firebaseDb.supervisions.delete(s.id)
            }
            const sessionAllocations = allocations?.filter(a => a.session === session) || []
            for (const alloc of sessionAllocations) {
                const libs = liberations?.filter(l => l.allocation === alloc.id)
                for (const l of (libs ?? [])) await firebaseDb.liberations.delete(l.id)
            }
            const sessionGroupes = groupes?.filter(g => g.session === session) || []
            for (const grp of sessionGroupes) {
                const chgs = charges?.filter(c => c.groupe === grp.id)
                for (const c of (chgs ?? [])) await firebaseDb.charges.delete(c.id)
            }
        }
    }

    const getCellStyle = (enseignantId: string) => {
        const width = columnWidths?.[enseignantId] || globalWidth || 200
        return { borderRight: "1px solid #dee2e6", borderBottom: "1px solid #dee2e6", minWidth: `${width}px`, width: `${width}px`, maxWidth: `${width}px`, overflow: "hidden" }
    }

    const nbChargesManquantes = getChargesManquantesCount(session, groupes || [], charges)
    const nbLiberationsManquantes = getLiberationsManquantesCount(session, allocations || [], liberations)

    return <>
        <tr className="table-secondary border-top border-dark border-opacity-25" style={{borderTopWidth: "2px"}}>
            <StickyHeader isFirstCol style={{ backgroundColor: "#ced4da", zIndex: 102 }}>
                <div className="d-flex justify-content-between align-items-center gap-4 px-1">
                    <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => toggle(`${session}_session`)} title={showSession ? "Masquer le détail de la session" : "Afficher le détail de la session"} style={{cursor: "pointer"}}>
                        <span style={{fontSize: "0.6rem", color: "#495057", width: "12px", display: "inline-block"}}>{showSession ? "▼" : "▶"}</span>
                        <span className="fw-bold text-uppercase" style={{letterSpacing: "0.5px", fontSize: "0.85rem"}}>{saison} {annee}</span>
                    </div>
                    <button type="button" className="btn btn-link btn-sm text-danger p-0 m-0 opacity-75 hover-opacity-100 no-print" style={{lineHeight: 1, textDecoration: "none"}} onClick={clearAllData} title="Réinitialiser la session">⟲</button>
                </div>
            </StickyHeader>
            {visibleEnseignants.map((enseignant: any) => {
                const enseignantCharges = charges?.filter(c => c.enseignant === enseignant.id && groupes?.find(gr => gr.id === c.groupe)?.session === session) || []
                const groupCount = enseignantCharges.length
                const studentsFromCourses = enseignantCharges.reduce((sum, c) => sum + (groupes?.find(gr => gr.id === c.groupe)?.nbEtudiants ?? 0), 0)
                const enseignantSups = supervisions?.filter(s => stages?.find(st => st.id === s.stage)?.session === session && s.enseignant === enseignant.id) || []
                const totalStagiaires = enseignantSups.reduce((sum, s) => sum + (s.nbStagiaires ?? 0), 0)
                const totalCoord = enseignantSups.reduce((sum, s) => sum + (s.coordination ?? 0), 0)
                const totalETC = liberations?.filter(l => l.enseignant === enseignant.id && allocations?.find(al => al.id === l.allocation)?.session === session).reduce((sum, l) => sum + (l.quantite ?? 0), 0) || 0
                const courseCount = new Set(enseignantCharges.map(c => groupes?.find(gr => gr.id === c.groupe)?.cours).filter(Boolean)).size

                return <td key={enseignant.id} style={{ ...getCellStyle(enseignant.id), backgroundColor: "#ced4da" }}>
                    { (groupCount > 0 || totalStagiaires > 0 || totalETC > 0 || totalCoord > 0) && (
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                            {courseCount > 0 && <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Préparations"><span style={{marginRight: "2px"}}>📚</span>{courseCount}</span>}
                            {groupCount > 0 && <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Groupes"><span style={{marginRight: "2px"}}>👥</span>{groupCount}</span>}
                            {studentsFromCourses > 0 && <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Étudiants (Cours)"><span style={{marginRight: "2px"}}>👤</span>{studentsFromCourses}</span>}
                            {totalStagiaires > 0 && <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Stagiaires"><span style={{marginRight: "2px"}}>🎓</span>{totalStagiaires}</span>}
                            {totalCoord > 0 && <span className="badge rounded-pill bg-warning text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Coordination Stages (CI)"><span style={{marginRight: "2px"}}>📢</span>{totalCoord} CI</span>}
                            {totalETC > 0 && <span className="badge rounded-pill bg-primary shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Total ETC">{Number(totalETC.toFixed(3))} ETC</span>}
                        </div>
                    )}
                </td>
            })}
        </tr>
        {showSession && (
            <>
                <CollapsibleSectionRow title="Cours attribués" isVisible={showCharges} onToggle={() => toggle(`${session}_charges`)} colSpan={visibleEnseignants.length} badge={nbChargesManquantes > 0 && <span className="badge bg-danger p-1 no-print" style={{fontSize: "0.65rem"}} title={`${nbChargesManquantes} restants`}>{nbChargesManquantes}</span>}>
                    { visibleEnseignants.map((enseignant: any) => <ListeCharges key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={columnWidths?.[enseignant.id] || globalWidth || 200} scenario={scenario} style={getCellStyle(enseignant.id)} isPrinting={isPrinting}/> )}
                </CollapsibleSectionRow>

                <CollapsibleSectionRow title="Libérations" isVisible={showLiberations} onToggle={() => toggle(`${session}_liberations`)} colSpan={visibleEnseignants.length} badge={nbLiberationsManquantes > 0 && <span className="badge bg-warning text-dark p-1 no-print" style={{fontSize: "0.65rem"}} title={`${nbLiberationsManquantes} restantes`}>{nbLiberationsManquantes}</span>}>
                    { visibleEnseignants.map((enseignant: any) => <ListeLiberations key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={columnWidths?.[enseignant.id] || globalWidth || 200} scenario={scenario} style={getCellStyle(enseignant.id)}/> )}
                </CollapsibleSectionRow>

                {sessionStages.length > 0 && (
                    <CollapsibleSectionRow title="Stages & Supervisions" isVisible={showStagesList} onToggle={() => toggle(`${session}_stages`)} colSpan={visibleEnseignants.length} headerStyle={{backgroundColor: "#f8f9fa"}}>
                        <td colSpan={visibleEnseignants.length} style={{backgroundColor: "#f8f9fa"}}></td>
                    </CollapsibleSectionRow>
                )}

                {showStagesList && sessionStages.map(stage => {
                    const stRem = getStagiairesRestantsCount(stage, supervisions)
                    const coRem = getCoordinationRestante(stage, supervisions)
                    
                    return <tr key={stage.id}>
                        <StickyHeader isFirstCol>
                            <div className="d-flex justify-content-between align-items-center gap-2 ps-4">
                                <div className="text-truncate" style={{maxWidth: "110px"}}><span className="small text-primary" style={{fontSize: "0.75rem"}}>{stage.nom}</span></div>
                                <div className="d-flex gap-1 flex-shrink-0">
                                    { stRem > 0 && <span className="badge bg-info text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${stRem} stagiaires à placer`}>🎓 {stRem}</span>}
                                    { coRem > 0.001 && <span className="badge bg-warning text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${coRem.toFixed(2)} CI de coordination à placer`}>📢 {Number(coRem.toFixed(2))}</span>}
                                </div>
                            </div>
                        </StickyHeader>
                        { visibleEnseignants.map((enseignant: any) => {
                            const sup = supervisions?.find(s => s.enseignant == enseignant.id && s.stage == stage.id)
                            const stValue = sup ? sup.nbStagiaires : 0
                            const coValue = sup ? sup.coordination : 0
                            return <td key={enseignant.id} style={getCellStyle(enseignant.id)}>
                                <div className="d-flex flex-column gap-1 align-items-center justify-content-center py-1">
                                    <div className="input-group input-group-sm" style={{maxWidth: "85px"}}>
                                        <span className="input-group-text p-1 bg-light text-muted border-0" style={{fontSize: "0.6rem"}} title="Stagiaires">🎓</span>
                                        <input className="form-control text-center p-0" type="number" min="0" step="1" value={stValue} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={e => supervisionsHandler(e, 'nbStagiaires')} style={{fontSize: "0.75rem"}} title="Nombre de stagiaires"/>
                                    </div>
                                    <div className="input-group input-group-sm" style={{maxWidth: "85px"}}>
                                        <span className="input-group-text p-1 bg-light text-muted border-0" style={{fontSize: "0.6rem"}} title="Coordination">📢</span>
                                        <input className="form-control text-center p-0" type="number" min="0" step="0.01" value={coValue} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={e => supervisionsHandler(e, 'coordination')} style={{fontSize: "0.75rem"}} title="Coordination (CI)"/>
                                    </div>
                                </div>
                            </td>
                        })}
                    </tr>
                })}
            </>
        )}
        {showCI && (
            <tr>
                <StickyHeader isFirstCol bottom={ciBottom} top={ciTop} zIndex={103} style={{ backgroundColor: "#f8f9fa", borderTop: (ciBottom && ciBottom !== "auto") ? "1px solid #dee2e6" : "none", borderBottom: ciTop ? "2px solid #dee2e6" : "1px solid #dee2e6", boxShadow: (ciBottom && ciBottom !== "auto") ? "0 -2px 10px rgba(0,0,0,0.1)" : "none" }}>
                    CI {saison}
                </StickyHeader>
                { visibleEnseignants.map((enseignant: any) => {
                    const width = columnWidths?.[enseignant.id] || globalWidth || 200
                    return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} trigger={{charges, liberations, groupes, supervisions}} scenario={scenario} style={getCellStyle(enseignant.id)} bottom={ciBottom} top={ciTop}/>
                })}
            </tr>
        )}
    </>
}
