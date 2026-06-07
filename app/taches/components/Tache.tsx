'use client'

import { firebaseDb } from "@/app/utilities/firebaseDb"
import StickyHeader from "./ui/StickyHeader"
import CollapsibleSectionRow from "./ui/CollapsibleSectionRow"
import ListeCharges from "./ListeCharges"
import ListeLiberations from "./ListeLiberations"
import CI from "./CI"
import { toast } from "react-hot-toast"
import { 
    getStagiairesRestantsCount, 
    getCoordinationRestante 
} from "@/app/utilities/businessLogic"
import { useTacheData } from "./useTacheData"
import TacheSummaryBadges from "./TacheSummaryBadges"
import SupervisionInputs from "./SupervisionInputs"

interface TacheProps {
    visibleEnseignants: any[]
    session: string
    columnWidths?: Record<string, number>
    globalWidth: number
    scenario?: string
    ciBottom?: string
    ciTop?: string
    showCI?: boolean
    isPrinting?: boolean
}

export default function Tache({
    visibleEnseignants, 
    session, 
    columnWidths, 
    globalWidth, 
    scenario = "production", 
    ciBottom, 
    ciTop, 
    showCI = true, 
    isPrinting
}: TacheProps) {
    const {
        saison, annee, charges, liberations, supervisions, sessionStages,
        nbChargesManquantes, nbLiberationsManquantes, getVisible, toggle,
        groupes, allocations, stages
    } = useTacheData(session, scenario)

    const showSession = getVisible(`${session}_session`, true)
    const showCharges = getVisible(`${session}_charges`, true)
    const showLiberations = getVisible(`${session}_liberations`, true)
    const showStagesList = getVisible(`${session}_stages`, true)

    async function supervisionsHandler(enseignantId: string, stageId: string, field: 'nbStagiaires' | 'coordination', value: number) {
        const stage = stages?.find(s => s.id === stageId)
        if (!stage) return
        
        const currentSupervision = supervisions?.find(s => s.enseignant === enseignantId && s.stage === stageId)
        
        if (field === 'nbStagiaires') {
            const rem = getStagiairesRestantsCount(stage, supervisions.filter(s => s.enseignant !== enseignantId))
            if (value > rem) {
                toast.error("La quantité de stagiaires dépasse le total prévu pour ce stage.")
                return
            }
        }
        
        if (currentSupervision) {
            await firebaseDb.supervisions.update(currentSupervision.id, { [field]: value })
        } else {
            await firebaseDb.supervisions.add({ 
                enseignant: enseignantId, 
                stage: stageId, 
                nbStagiaires: field === 'nbStagiaires' ? value : 0, 
                coordination: field === 'coordination' ? value : 0, 
                scenario,
                session
            })
        }
    }

    async function clearAllData() {
        if (confirm(`Voulez-vous vraiment réinitialiser toutes les données pour la session ${saison} ${annee} (Scénario: ${scenario}) ?`)) {
            const deletePromises: Promise<any>[] = []
            
            for (const stage of sessionStages) {
                const sups = supervisions?.filter(s => s.stage === stage.id)
                sups?.forEach(s => deletePromises.push(firebaseDb.supervisions.delete(s.id)))
            }
            
            const sessionAllocations = allocations?.filter(a => a.session === session) || []
            sessionAllocations.forEach(alloc => {
                const libs = liberations?.filter(l => l.allocation === alloc.id)
                libs?.forEach(l => deletePromises.push(firebaseDb.liberations.delete(l.id)))
            })
            
            const sessionGroupes = groupes?.filter(g => g.session === session) || []
            sessionGroupes.forEach(grp => {
                const chgs = charges?.filter(c => c.groupe === grp.id)
                chgs?.forEach(c => deletePromises.push(firebaseDb.charges.delete(c.id)))
            })

            await Promise.all(deletePromises)
            toast.success("Session réinitialisée")
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

    return (
        <>
            <tr className="table-secondary border-top border-dark border-opacity-25" style={{borderTopWidth: "2px"}}>
                <StickyHeader isFirstCol style={{ backgroundColor: "#ced4da", zIndex: 102 }}>
                    <div className="d-flex justify-content-between align-items-center gap-4 px-1">
                        <div 
                            className="d-flex align-items-center gap-2 cursor-pointer" 
                            onClick={() => toggle(`${session}_session`)} 
                            title={showSession ? "Masquer le détail de la session" : "Afficher le détail de la session"}
                        >
                            <span style={{fontSize: "0.6rem", color: "#495057", width: "12px", display: "inline-block"}}>
                                {showSession ? "▼" : "▶"}
                            </span>
                            <span className="fw-bold text-uppercase" style={{letterSpacing: "0.5px", fontSize: "0.85rem"}}>
                                {saison} {annee}
                            </span>
                        </div>
                        <button 
                            type="button" 
                            className="btn btn-link btn-sm text-danger p-0 m-0 opacity-75 hover-opacity-100 no-print" 
                            style={{lineHeight: 1, textDecoration: "none"}} 
                            onClick={clearAllData} 
                            title="Réinitialiser la session"
                        >
                            ⟲
                        </button>
                    </div>
                </StickyHeader>
                {visibleEnseignants.map((enseignant) => {
                    const enseignantCharges = charges?.filter(c => c.enseignant === enseignant.id && groupes?.find(gr => gr.id === c.groupe)?.session === session) || []
                    const groupCount = enseignantCharges.length
                    const studentsFromCourses = enseignantCharges.reduce((sum, c) => sum + (groupes?.find(gr => gr.id === c.groupe)?.nbEtudiants ?? 0), 0)
                    const enseignantSups = supervisions?.filter(s => stages?.find(st => st.id === s.stage)?.session === session && s.enseignant === enseignant.id) || []
                    const totalStagiaires = enseignantSups.reduce((sum, s) => sum + (s.nbStagiaires ?? 0), 0)
                    const totalCoord = enseignantSups.reduce((sum, s) => sum + (s.coordination ?? 0), 0)
                    const totalETC = liberations?.filter(l => l.enseignant === enseignant.id && allocations?.find(al => al.id === l.allocation)?.session === session).reduce((sum, l) => sum + (l.quantite ?? 0), 0) || 0
                    const courseCount = new Set(enseignantCharges.map(c => groupes?.find(gr => gr.id === c.groupe)?.cours).filter(Boolean)).size

                    return (
                        <td key={enseignant.id} style={{ ...getCellStyle(enseignant.id), backgroundColor: "#ced4da" }}>
                            <TacheSummaryBadges 
                                courseCount={courseCount}
                                groupCount={groupCount}
                                studentsFromCourses={studentsFromCourses}
                                totalStagiaires={totalStagiaires}
                                totalCoord={totalCoord}
                                totalETC={totalETC}
                            />
                        </td>
                    )
                })}
            </tr>
            {showSession && (
                <>
                    <CollapsibleSectionRow 
                        title="Cours attribués" 
                        isVisible={showCharges} 
                        onToggle={() => toggle(`${session}_charges`)} 
                        colSpan={visibleEnseignants.length} 
                        badge={nbChargesManquantes > 0 && <span className="badge bg-danger p-1 no-print" style={{fontSize: "0.65rem"}} title={`${nbChargesManquantes} restants`}>{nbChargesManquantes}</span>}
                    >
                        {visibleEnseignants.map((enseignant) => (
                            <ListeCharges 
                                key={enseignant.id} 
                                enseignant={enseignant} 
                                session={session} 
                                enseignantWidth={columnWidths?.[enseignant.id] || globalWidth || 200} 
                                scenario={scenario} 
                                style={getCellStyle(enseignant.id)} 
                                isPrinting={isPrinting}
                            />
                        ))}
                    </CollapsibleSectionRow>

                    <CollapsibleSectionRow 
                        title="Libérations" 
                        isVisible={showLiberations} 
                        onToggle={() => toggle(`${session}_liberations`)} 
                        colSpan={visibleEnseignants.length} 
                        badge={nbLiberationsManquantes > 0 && <span className="badge bg-warning text-dark p-1 no-print" style={{fontSize: "0.65rem"}} title={`${nbLiberationsManquantes} restantes`}>{nbLiberationsManquantes}</span>}
                    >
                        {visibleEnseignants.map((enseignant) => (
                            <ListeLiberations 
                                key={enseignant.id} 
                                enseignant={enseignant} 
                                session={session} 
                                enseignantWidth={columnWidths?.[enseignant.id] || globalWidth || 200} 
                                scenario={scenario} 
                                style={getCellStyle(enseignant.id)}
                            />
                        ))}
                    </CollapsibleSectionRow>

                    {sessionStages.length > 0 && (
                        <CollapsibleSectionRow 
                            title="Stages & Supervisions" 
                            isVisible={showStagesList} 
                            onToggle={() => toggle(`${session}_stages`)} 
                            colSpan={visibleEnseignants.length} 
                            headerStyle={{backgroundColor: "#f8f9fa"}}
                        >
                            <td colSpan={visibleEnseignants.length} style={{backgroundColor: "#f8f9fa"}}></td>
                        </CollapsibleSectionRow>
                    )}

                    {showStagesList && sessionStages.map(stage => {
                        const stRem = getStagiairesRestantsCount(stage, supervisions)
                        const coRem = getCoordinationRestante(stage, supervisions)
                        
                        return (
                            <tr key={stage.id}>
                                <StickyHeader isFirstCol>
                                    <div className="d-flex justify-content-between align-items-center gap-2 ps-4">
                                        <div className="text-truncate" style={{maxWidth: "110px"}}>
                                            <span className="small text-primary" style={{fontSize: "0.75rem"}}>{stage.nom}</span>
                                        </div>
                                        <div className="d-flex gap-1 flex-shrink-0">
                                            {stRem > 0 && <span className="badge bg-info text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${stRem} stagiaires à placer`}>🎓 {stRem}</span>}
                                            {coRem > 0.001 && <span className="badge bg-warning text-dark p-1" style={{fontSize: "0.55rem", fontWeight: "normal"}} title={`${coRem.toFixed(2)} CI de coordination à placer`}>📢 {Number(coRem.toFixed(2))}</span>}
                                        </div>
                                    </div>
                                </StickyHeader>
                                {visibleEnseignants.map((enseignant) => {
                                    const sup = supervisions?.find(s => s.enseignant === enseignant.id && s.stage === stage.id)
                                    return (
                                        <td key={enseignant.id} style={getCellStyle(enseignant.id)}>
                                            <SupervisionInputs 
                                                enseignantId={enseignant.id}
                                                stageId={stage.id}
                                                stValue={sup?.nbStagiaires ?? 0}
                                                coValue={sup?.coordination ?? 0}
                                                onUpdate={(field, val) => supervisionsHandler(enseignant.id, stage.id, field, val)}
                                            />
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
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
                    {visibleEnseignants.map((enseignant) => (
                        <CI 
                            key={enseignant.id} 
                            enseignant={enseignant} 
                            session={session} 
                            enseignantWidth={columnWidths?.[enseignant.id] || globalWidth || 200} 
                            trigger={{charges, liberations, groupes, supervisions}} 
                            scenario={scenario} 
                            style={getCellStyle(enseignant.id)} 
                            bottom={ciBottom} 
                            top={ciTop}
                        />
                    ))}
                </tr>
            )}
        </>
    )
}
