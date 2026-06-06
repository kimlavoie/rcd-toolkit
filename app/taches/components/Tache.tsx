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
    const [showStagiaires, setShowStagiaires] = useState(true)

    // Filter data by scenario
    const charges = allCharges?.filter(c => (c.scenario || "production") === scenario)
    const liberations = allLiberations?.filter(l => (l.scenario || "production") === scenario)
    const supervisions = allSupervisions?.filter(s => (s.scenario || "production") === scenario)

    function chargesManquantes(session:string){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)

        const missing = groupesSession?.filter(groupe => {
            const groupCharges = charges?.filter(charge => charge.groupe == groupe.id) || []
            
            // Un groupe est manquant si une composante requise n'a pas 15 semaines
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

    function stagiairesRestants(){
        const stage = stages?.find(stage => stage.session == session)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stage?.id)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.nbStagiaires ?? 0), 0)
        return (stage?.nbStagiaires ?? 0) - (sommeSupervisions ?? 0)
    }

    async function stagiairesHandler(ev:any){
        const enseignantId = ev.target.dataset.enseignantId
        const stageId = ev.target.dataset.stageId
        const nouvelleValeur = Number(ev.target.value)
        const supervision = supervisions?.find(supervision => supervision.enseignant == enseignantId && supervision.stage == stageId)
        const supervisionsSimilaires = supervisions?.filter(supervision => supervision.stage == stageId && supervision.enseignant != enseignantId)
        const sommeSupervisions = supervisionsSimilaires?.reduce((somme, supervision) => somme + (supervision.nbStagiaires ?? 0), 0)
        const stage = stages?.find(stage => stage.id == stageId)

        if((sommeSupervisions ?? 0) + nouvelleValeur > (stage?.nbStagiaires ?? 0)){
            toast.error("La quantité de stagiaires est trop grande pour ce stage. Veuillez choisir une autre quantité")
            return
        }

        if(supervision){
            await firebaseDb.supervisions.update(supervision.id, {nbStagiaires: nouvelleValeur})
        } else {
            await firebaseDb.supervisions.add({enseignant: enseignantId, stage: stageId, nbStagiaires: nouvelleValeur, scenario})
        }
    }

    async function clearStagiaires(){
        const stageSession = stages?.find(stage => stage.session == session)
        const supervisionStage = supervisions?.filter(supervision => supervision.stage == stageSession?.id)
        for (const supervision of (supervisionStage ?? [])) {
            await firebaseDb.supervisions.delete(supervision.id)
        }
    }

    async function clearLiberations(){
        const allocationsSession = allocations?.filter(allocation => allocation.session == session)
        const liberationsSession = liberations?.filter(liberation => {
            const allocation = allocationsSession?.find(allocation => allocation.id == liberation.allocation)
            return allocation
        })
        for (const liberation of (liberationsSession ?? [])) {
            await firebaseDb.liberations.delete(liberation.id)
        }
    }

    async function clearCharges(){
        const groupesSession = groupes?.filter(groupe => groupe.session == session)
        const chargesSession = charges?.filter(charge => {
            const groupe = groupesSession?.find(groupe => groupe.id == charge.groupe)
            return groupe
        })
        for (const charge of (chargesSession ?? [])) {
            await firebaseDb.charges.delete(charge.id)
        }
    }
    
    async function clearAll(){
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} (Scénario: ${scenario}) ?`)) {
            await clearStagiaires()
            await clearLiberations()
            await clearCharges()
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
        <tr className="table-secondary">
            <StickyHeader isFirstCol style={{ backgroundColor: "#e9ecef", zIndex: 102 }}>
                <div className="d-flex justify-content-between align-items-center gap-4">
                    <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowSession(!showSession)} title={showSession ? "Masquer le détail de la session" : "Afficher le détail de la session"} style={{cursor: "pointer"}}>
                        <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>{showSession ? "▼" : "▶"}</span>
                        <span className="fw-bold">{saison} {annee}</span>
                    </div>
                    <button type="button" className="btn btn-link btn-sm text-danger p-0 m-0" style={{lineHeight: 1, textDecoration: "none"}} onClick={clearAll} title="Réinitialiser la session">⟲</button>
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
                const stage = stages?.find(s => s.session === session)
                const supervision = supervisions?.find(sup => sup.enseignant === enseignant.id && sup.stage === stage?.id)
                const studentCount = studentsFromCourses + (supervision?.nbStagiaires ?? 0)
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

                return <td key={enseignant.id} style={{ ...getCellStyle(enseignant.id), backgroundColor: "#e9ecef" }}>
                    { (groupCount > 0 || (supervision?.nbStagiaires ?? 0) > 0 || totalETC > 0) && (
                        <div className="d-flex justify-content-center gap-1">
                            {courseCount > 0 && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.6rem" }} title="Nombre de cours différents (préparations)">
                                    <span style={{marginRight: "2px"}}>📚</span>{courseCount}
                                </span>
                            )}
                            {groupCount > 0 && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.6rem" }} title="Total groupes session">
                                    <span style={{marginRight: "2px"}}>👥</span>{groupCount}
                                </span>
                            )}
                            {(studentCount > 0) && (
                                <span className="badge rounded-pill bg-info text-dark shadow-sm" style={{ fontSize: "0.6rem" }} title="Total étudiants (Cours + Stagiaires) session">
                                    <span style={{marginRight: "2px"}}>👤</span>{studentCount}
                                </span>
                            )}
                            {totalETC > 0 && (
                                <span className="badge rounded-pill bg-primary shadow-sm" style={{ fontSize: "0.6rem" }} title="Total libérations (ETC) session">
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
                        <div className="d-flex justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowCharges(false)} title="Masquer les cours" style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                                <span className="fw-bold">Cours attribués</span>
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
                            <div className="cursor-pointer ps-1 d-flex align-items-center gap-2" onClick={() => setShowCharges(true)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                                <span>Afficher les cours</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length}></td>
                    </tr>
                )}

                <tr style={{ display: showLiberations ? "table-row" : "none" }}>
                    <StickyHeader isFirstCol>
                        <div className="d-flex justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowLiberations(false)} title="Masquer les libérations" style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                                <span className="fw-bold">Libérations</span>
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
                            <div className="cursor-pointer ps-1 d-flex align-items-center gap-2" onClick={() => setShowLiberations(true)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                                <span>Afficher les libérations</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length}></td>
                    </tr>
                )}

                <tr style={{ display: showStagiaires ? "table-row" : "none" }}>
                    <StickyHeader isFirstCol>
                        <div className="d-flex justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setShowStagiaires(false)} title="Masquer les stagiaires" style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                                <span className="fw-bold">Stagiaires</span>
                            </div>
                            { !isNaN(stagiairesRestants()) && stagiairesRestants() > 0 && <span className="badge bg-info text-dark p-1" style={{fontSize: "0.65rem"}} title={`${stagiairesRestants()} à placer`}>{stagiairesRestants()}</span> }
                        </div>
                    </StickyHeader>
                    { visibleEnseignants.map((enseignant: any) => {
                        const stage = stages?.find(stage => stage.session == session)
                        const supervision = supervisions?.find(supervision => supervision.enseignant == enseignant.id && supervision.stage == stage?.id)
                        const value = supervision ? supervision.nbStagiaires : 0
                        return stage 
                            ?<td key={enseignant.id} className="text-center" style={getCellStyle(enseignant.id)}>
                                <div className="input-group input-group-sm mx-auto" style={{maxWidth: "70px"}}>
                                    <input className="form-control text-center p-0" type="number" min="0" step="1" value={value} data-enseignant-id={enseignant.id} data-stage-id={stage.id} onChange={stagiairesHandler} style={{fontSize: "0.8rem"}}/>
                                    <span className="input-group-text p-1" style={{fontSize: "0.7rem"}}>/{stage.nbStagiaires}</span>
                                </div>
                            </td>
                            :<td key={enseignant.id} className="text-muted text-center extra-small" style={{...getCellStyle(enseignant.id), fontSize: "0.75rem"}}>--</td>
                    })}
                </tr>
                {!showStagiaires && (
                    <tr className="bg-light">
                        <StickyHeader isFirstCol style={{fontSize: "0.7rem", color: "#999"}}>
                            <div className="cursor-pointer ps-1 d-flex align-items-center gap-2" onClick={() => setShowStagiaires(true)} style={{cursor: "pointer"}}>
                                <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                                <span>Afficher les stagiaires</span>
                            </div>
                        </StickyHeader>
                        <td colSpan={visibleEnseignants.length}></td>
                    </tr>
                )}
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
                    return <CI key={enseignant.id} enseignant={enseignant} session={session} enseignantWidth={width} trigger={{charges, liberations, groupes}} scenario={scenario} style={getCellStyle(enseignant.id)} bottom={ciBottom} top={ciTop}/>
                })}
            </tr>
        )}
    </>
}
