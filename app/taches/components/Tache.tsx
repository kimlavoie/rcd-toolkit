'use client'
import { useState } from "react"
import { firebaseDb } from "@/app/utilities/firebaseDb"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useData } from "./DataContext"
import StickyHeader from "./ui/StickyHeader"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import { toast } from "react-hot-toast"

export default function Tache({visibleEnseignants, session, columnWidths, globalWidth, scenario = "production", ciBottom, ciTop, showCI = true}:any){
    const { groupes, charges: allCharges, allocations, liberations: allLiberations, stages, supervisions: allSupervisions, cours } = useData()

    const {saison, annee} = extractSessionInfos(session)
    
    // États de visibilité
    const [showSession, setShowSession] = useState(true)
    const [showCharges, setShowCharges] = useState(true)
    const [showLiberations, setShowLiberations] = useState(true)
    const [showStagesList, setShowStagesList] = useState(true)

    // Filter data by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario)

    // Stages specifically for this session
    const sessionStages = stages?.filter(s => s.session === session) || []

    function chargesManquantes(session:string){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)
        const missing = groupesSession?.filter(groupe => {
            const groupCharges = charges?.filter(charge => charge.groupe == groupe.id) || []
            const needsT = groupe.aTheorie ?? true
            const needsP = groupe.aPratique ?? true
            const weeksT = groupCharges.filter(c => c.type === "T" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            const weeksP = groupCharges.filter(c => c.type === "P" || c.type === "TP").reduce((sum, c) => sum + (c.nbSemaines ?? 0), 0)
            const missingT = needsT && (15 - weeksT > 0.001)
            const missingP = needsP && (15 - weeksP > 0.001)
            return missingT || missingP
        })
        return missing?.length
    }

    function liberationsManquantes(session:string){
        const allocationsSession = allocations?.filter(allocation => allocation.session == session)
        const missing = allocationsSession?.filter(allocation => {
            const liberation = liberations?.filter(liberation => liberation.allocation == allocation.id)
            const sommeLiberations = liberation?.reduce((somme, liberation) => somme + (liberation.quantite ?? 0), 0)
            return (allocation.quantite ?? 0) - (sommeLiberations ?? 0) > 0.001
        })
        return missing?.length
    }

    function stagiairesRestants(stage: any){
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.nbStagiaires ?? 0), 0)
        return (stage?.nbStagiaires ?? 0) - (sommeSupervisions ?? 0)
    }

    function coordinationRestante(stage: any){
        const totalCIStage = (stage.nbStagiaires ?? 0) * (stage.CIparStagiaire ?? 0)
        const budgetCoord = totalCIStage * ((stage.pourcentageCoordination ?? 0) / 100)
        
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeCoord = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.coordination ?? 0), 0)
        
        return budgetCoord - (sommeCoord ?? 0)
    }

    async function supervisionsHandler(ev:any, field: 'nbStagiaires' | 'coordination'){
        const enseignantId = ev.target.dataset.enseignantId
        const stageId = ev.target.dataset.stageId
        const nouvelleValeur = Number(ev.target.value)
        const stage = stages?.find(s => s.id == stageId)
        if(!stage) return

        const currentSupervision = supervisions?.find(s => s.enseignant == enseignantId && s.stage == stageId)

        if (field === 'nbStagiaires') {
            const supervisionsSimilaires = supervisions?.filter(s => s.stage == stageId && s.enseignant != enseignantId)
            const sommeSupervisions = supervisionsSimilaires?.reduce((somme, s) => somme + (s.nbStagiaires ?? 0), 0)
            if((sommeSupervisions ?? 0) + nouvelleValeur > (stage.nbStagiaires ?? 0)){
                toast.error("La quantité de stagiaires dépasse le total prévu pour ce stage.")
                return
            }
        }

        if(currentSupervision){
            await firebaseDb.supervisions.update(currentSupervision.id, { [field]: nouvelleValeur })
        } else {
            await firebaseDb.supervisions.add({
                enseignant: enseignantId, 
                stage: stageId, 
                nbStagiaires: field === 'nbStagiaires' ? nouvelleValeur : 0, 
                coordination: field === 'coordination' ? nouvelleValeur : 0,
                scenario
            })
        }
    }

    async function clearAllData(){
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} (Scénario: ${scenario}) ?`)) {
            // Clear supervisions for all session stages
            for (const stage of sessionStages) {
                const sups = supervisions?.filter(s => s.stage === stage.id)
                for (const s of (sups ?? [])) await firebaseDb.supervisions.delete(s.id)
            }
            // Clear liberations
            const sessionAllocations = allocations?.filter(a => a.session === session) || []
            for (const alloc of sessionAllocations) {
                const libs = liberations?.filter(l => l.allocation === alloc.id)
                for (const l of (libs ?? [])) await firebaseDb.liberations.delete(l.id)
            }
            // Clear charges
            const sessionGroupes = groupes?.filter(g => g.session === session) || []
            for (const grp of sessionGroupes) {
                const chgs = charges?.filter(c => c.groupe === grp.id)
                for (const c of (chgs ?? [])) await firebaseDb.charges.delete(c.id)
            }
        }
    }

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

    return <>
        <tr className="table-secondary border-top border-dark border-opacity-25" style={{borderTopWidth: "2px"}}>
            <StickyHeader isFirstCol style={{ backgroundColor: "#ced4da", zIndex: 102 }}>
                <div className="d-flex justify-content-between align-items-center gap-4 px-1">
                    <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowSession(!showSession)} title={showSession ? "Masquer le détail de la session" : "Afficher le détail de la session"} style={{cursor: "pointer"}}>
                        <span style={{fontSize: "0.6rem", color: "#495057", width: "12px", display: "inline-block"}}>{showSession ? "▼" : "▶"}</span>
                        <span className="fw-bold text-uppercase" style={{letterSpacing: "0.5px", fontSize: "0.85rem"}}>{saison} {annee}</span>
                    </div>
                    <button type="button" className="btn btn-link btn-sm text-danger p-0 m-0 opacity-75 hover-opacity-100" style={{lineHeight: 1, textDecoration: "none"}} onClick={clearAllData} title="Réinitialiser la session">⟲</button>
                </div>
            </StickyHeader>
            {visibleEnseignants.map((enseignant: any) => {
                const enseignantCharges = charges?.filter(c => {
                    if (c.enseignant !== enseignant.id) return false
                    const g = groupes?.find(gr => gr.id === c.groupe)
                    return g?.session === session
                }) || []
                const groupCount = enseignantCharges.length
                const studentsFromCourses = enseignantCharges.reduce((sum, c) => {
                    const g = groupes?.find(gr => gr.id === c.groupe)
                    return sum + (g?.nbEtudiants ?? 0)
                }, 0)
                
                // Supervisions de tous les stages de la session
                const enseignantSups = supervisions?.filter(s => {
                    const st = stages?.find(stage => stage.id === s.stage)
                    return s.enseignant === enseignant.id && st?.session === session
                }) || []
                
                const totalStagiaires = enseignantSups.reduce((sum, s) => sum + (s.nbStagiaires ?? 0), 0)
                const totalCoord = enseignantSups.reduce((sum, s) => sum + (s.coordination ?? 0), 0)
                const studentCount = studentsFromCourses + totalStagiaires

                const enseignantLiberations = liberations?.filter(l => {
                    if (l.enseignant !== enseignant.id) return false
                    const a = allocations?.find(al => al.id === l.allocation)
                    return a?.session === session
                }) || []
                const totalETC = enseignantLiberations.reduce((sum, l) => sum + (l.quantite ?? 0), 0)
                const uniqueCourseIds = new Set(enseignantCharges.map(c => {
                    const g = groupes?.find(gr => gr.id === c.groupe)
                    return g?.cours
                }).filter(Boolean))
                const courseCount = uniqueCourseIds.size

                return <td key={enseignant.id} style={{ ...getCellStyle(enseignant.id), backgroundColor: "#ced4da" }}>
                    { (groupCount > 0 || totalStagiaires > 0 || totalETC > 0 || totalCoord > 0) && (
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                            {courseCount > 0 && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Préparations">
                                    <span style={{marginRight: "2px"}}>📚</span>{courseCount}
                                </span>
                            )}
                            {groupCount > 0 && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Groupes">
                                    <span style={{marginRight: "2px"}}>👥</span>{groupCount}
                                </span>
                            )}
                            {(studentCount > 0) && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Étudiants + Stagiaires">
                                    <span style={{marginRight: "2px"}}>👤</span>{studentCount}
                                </span>
                            )}
                            {totalCoord > 0 && (
                                <span className="badge rounded-pill bg-warning text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Coordination Stages (CI)">
                                    <span style={{marginRight: "2px"}}>📢</span>{totalCoord} CI
                                </span>
                            )}
                            {totalETC > 0 && (
                                <span className="badge rounded-pill bg-primary shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Total ETC">
                                    {Number(totalETC.toFixed(3))} ETC
                                </span>
                            )}
                        </div>
                    )}
                </td>
            })}
        </tr>
        {showSession && (
            <>
                <tr style={{ display: showCharges ? "table-row" : "none" }}>
                    <StickyHeader isFirstCol>
                        <div className="d-flex justify-content-between align-items-center gap-3 ps-2">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowCharges(false)} title="Masquer les cours" style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                                <span className="fw-bold small text-muted text-uppercase" style={{fontSize: "0.7rem"}}>Cours attribués</span>
                            </div>
                            { (chargesManquantes(session) ?? 0) > 0 && <span className="badge bg-danger p-1" style={{fontSize: "0.65rem"}} title={`${chargesManquantes(session)} restants`}>{chargesManquantes(session)}</span> }
                        </div>
                    </StickyHeader>
                    { visibleEnseignants.map((enseignant: any) => {
                        const width = columnWidths?.[enseignant.id] || globalWidth || 200
                        return <ListeCharges key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} scenario={scenario} style={getCellStyle(enseignant.id)}/>
                    })}
                </tr>
                {!showCharges && (
                    <tr className="bg-light">
                        <StickyHeader isFirstCol style={{fontSize: "0.7rem", color: "#999"}}>
                            <div className="cursor-pointer ps-3 d-flex align-items-center gap-2" onClick={() => setShowCharges(true)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                                <span className="text-uppercase small" style={{fontSize: "0.65rem"}}>Afficher les cours</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length}></td>
                    </tr>
                )}

                <tr style={{ display: showLiberations ? "table-row" : "none" }}>
                    <StickyHeader isFirstCol>
                        <div className="d-flex justify-content-between align-items-center gap-3 ps-2">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowLiberations(false)} title="Masquer les libérations" style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                                <span className="fw-bold small text-muted text-uppercase" style={{fontSize: "0.7rem"}}>Libérations</span>
                            </div>
                            { (liberationsManquantes(session) ?? 0) > 0 && <span className="badge bg-warning text-dark p-1" style={{fontSize: "0.65rem"}} title={`${liberationsManquantes(session)} restantes`}>{liberationsManquantes(session)}</span> }
                        </div>
                    </StickyHeader>
                    { visibleEnseignants.map((enseignant: any) => {
                        const width = columnWidths?.[enseignant.id] || globalWidth || 200
                        return <ListeLiberations key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} scenario={scenario} style={getCellStyle(enseignant.id)}/>
                    })}
                </tr>
                {!showLiberations && (
                    <tr className="bg-light">
                        <StickyHeader isFirstCol style={{fontSize: "0.7rem", color: "#999"}}>
                            <div className="cursor-pointer ps-3 d-flex align-items-center gap-2" onClick={() => setShowLiberations(true)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                                <span className="text-uppercase small" style={{fontSize: "0.65rem"}}>Afficher les libérations</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length}></td>
                    </tr>
                )}

                {/* Plusieurs lignes de stages si présents */}
                {sessionStages.length > 0 && (
                    <tr className="bg-light border-top border-bottom border-secondary border-opacity-10">
                        <StickyHeader isFirstCol style={{backgroundColor: "#f8f9fa"}}>
                            <div className="d-flex align-items-center gap-2 cursor-pointer ps-2" onClick={() => setShowStagesList(!showStagesList)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>{showStagesList ? "▼" : "▶"}</span>
                                <span className="fw-bold small text-muted text-uppercase" style={{fontSize: "0.7rem"}}>Stages & Supervisions</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length} style={{backgroundColor: "#f8f9fa"}}></td>
                    </tr>
                )}

                {showStagesList && sessionStages.map(stage => (
                    <tr key={stage.id}>
                        <StickyHeader isFirstCol>
                            <div className="d-flex justify-content-between align-items-center gap-2 ps-4">
                                <div className="text-truncate" style={{maxWidth: "110px"}}>
                                    <span className="small text-primary" style={{fontSize: "0.75rem"}}>{stage.nom}</span>
                                </div>
                                <div className="d-flex gap-1 flex-shrink-0">
                                    { stagiairesRestants(stage) > 0 && (
                                        <span className="badge bg-info text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${stagiairesRestants(stage)} stagiaires à placer`}>
                                            👤 {stagiairesRestants(stage)}
                                        </span>
                                    )}
                                    { coordinationRestante(stage) > 0.001 && (
                                        <span className="badge bg-warning text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${coordinationRestante(stage).toFixed(2)} CI de coordination à placer`}>
                                            📢 {Number(coordinationRestante(stage).toFixed(2))}
                                        </span>
                                    )}
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
                                        <span className="input-group-text p-1 bg-light text-muted border-0" style={{fontSize: "0.6rem"}} title="Stagiaires">👤</span>
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
                ))}
            </>
        )}
        {showCI && (
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
                { visibleEnseignants.map((enseignant: any) => {
                    const width = columnWidths?.[enseignant.id] || globalWidth || 200
                    return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} trigger={{charges, liberations, groupes, supervisions}} scenario={scenario} style={getCellStyle(enseignant.id)} bottom={ciBottom} top={ciTop}/>
                })}
            </tr>
        )}
    </>
}
