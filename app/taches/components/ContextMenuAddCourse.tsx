'use client'
import React, { useState } from "react"
import type { Groupe, Charge, Cours } from "@/app/db/db"
import { getGroupColor } from "@/app/utilities/groupColors"

interface ContextMenuAddCourseProps {
    position: { left: number, top: number }
    onClose: () => void
    onAdd: (groupe: Groupe, type: "T" | "P" | "TP") => void
    onAddAll: (groupes: Groupe[]) => void
    onOpenModal: (groupe: Groupe) => void
    sortedCourseIds: string[]
    groupsByCourse: Record<string, Groupe[]>
    coursData: Cours[] | undefined
    scenarioCharges: Charge[]
    enseignantId: string
    menuRef?: React.RefObject<HTMLDivElement | null>
}

export default function ContextMenuAddCourse({
    position,
    onClose,
    onAdd,
    onAddAll,
    onOpenModal,
    sortedCourseIds,
    groupsByCourse,
    coursData,
    scenarioCharges,
    enseignantId,
    menuRef
}: ContextMenuAddCourseProps) {
    const [search, setSearch] = useState("")
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({})

    const filteredCourseIds = sortedCourseIds.filter(id => {
        if (!search) return true
        const cour = coursData?.find(c => c.id === id)
        const searchLower = search.toLowerCase()
        return cour?.sigle?.toLowerCase().includes(searchLower) || cour?.nom?.toLowerCase().includes(searchLower)
    })

    return (
        <div 
            ref={menuRef}
            style={{ 
                position: "fixed", 
                left: position.left, 
                top: position.top, 
                backgroundColor: "#212529", 
                color: "white", 
                display: "block", 
                padding: "10px", 
                zIndex: 9999, 
                borderRadius: "8px", 
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)", 
                minWidth: "280px", 
                border: "1px solid #444", 
                maxHeight: "85vh", 
                overflowY: "auto",
                opacity: (position.left === 0 && position.top === 0) ? 0 : 1,
                transition: "opacity 0.1s"
            }}
            onClick={e => e.stopPropagation()}
        >
            <p className="mb-2 small text-white-50 text-uppercase fw-bold border-bottom pb-1 border-secondary">Ajouter un cours</p>
            <div className="mb-3">
                <input 
                    type="text" 
                    className="form-control form-control-sm bg-dark text-white border-secondary" 
                    placeholder="Rechercher sigle ou nom..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    autoFocus 
                />
            </div>
            {filteredCourseIds.length === 0 && <p className="text-muted small text-center my-3">Aucun cours disponible</p>}
            {filteredCourseIds.map(courseId => {
                const cour = coursData?.find(c => c.id === courseId)
                const courseGroups = groupsByCourse[courseId]
                const isExpanded = expandedCourses[courseId]
                return (
                    <div key={courseId} className="mb-1 border-bottom border-secondary last-child-no-border pb-1">
                        <div className="d-flex align-items-stretch gap-1">
                            <button 
                                className="btn btn-outline-light btn-sm flex-grow-1 text-start py-2 d-flex justify-content-between align-items-center transition-all" 
                                style={{fontSize: '0.8rem', border: 'none', transition: "background-color 0.2s"}} 
                                onClick={() => onAddAll(courseGroups)}
                                title={`Assigner toutes les parties disponibles de ce cours`}
                            >
                                <div style={{lineHeight: "1.2"}}>
                                    <span className="fw-bold text-info">{cour?.sigle}</span><br/>
                                    <span className="text-white-50 extra-small fw-normal">{cour?.nom}</span>
                                </div>
                                <span className="badge bg-info text-dark rounded-pill ms-2 shadow-sm" style={{fontSize: '0.65rem'}}>
                                    <span style={{marginRight: "2px"}}>👥</span>
                                    {courseGroups.length}
                                </span>
                            </button>
                            <button 
                                className="btn btn-link btn-sm text-secondary p-2" 
                                style={{textDecoration: 'none'}} 
                                onClick={(e) => { e.stopPropagation(); setExpandedCourses(prev => ({...prev, [courseId]: !prev[courseId]})); }}
                            >
                                {isExpanded ? "▲" : "▼"}
                            </button>
                        </div>
                        {isExpanded && (
                            <div className="bg-dark rounded p-2 mb-2 mx-1 mt-1 border border-secondary shadow-inner text-center">
                                {courseGroups.map((groupe) => {
                                    const groupCharges = scenarioCharges.filter(c => c.groupe === groupe.id)
                                    const hasT = groupCharges.some(c => c.type === "T" || c.type === "TP")
                                    const hasP = groupCharges.some(c => c.type === "P" || c.type === "TP")
                                    const canAddT = (groupe.aTheorie ?? true) && !hasT
                                    const canAddP = (groupe.aPratique ?? true) && !hasP
                                    
                                    return (
                                        <div 
                                            key={groupe.id} 
                                            className="mb-2 p-2 border border-secondary rounded text-center transition-all cursor-pointer shadow-sm"
                                            style={{ 
                                                transition: "all 0.2s",
                                                backgroundColor: "rgba(255,255,255,0.03)",
                                                display: "block",
                                                border: "1px solid rgba(255,255,255,0.1) !important"
                                            }}
                                            onClick={() => onAdd(groupe, "TP")}
                                        >
                                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                <div className="badge rounded-pill bg-info text-dark shadow-sm d-flex align-items-center py-1 px-2" style={{fontSize: "0.65rem"}}>
                                                    <span style={{fontSize: "0.75rem", marginRight: "4px"}}>👤</span>
                                                    <span className="fw-bold">{groupe.nbEtudiants}</span>
                                                </div>
                                                <div 
                                                    style={{ 
                                                        width: "10px", 
                                                        height: "10px", 
                                                        borderRadius: "50%", 
                                                        backgroundColor: getGroupColor(groupe.id),
                                                        boxShadow: "0 0 3px rgba(0,0,0,0.5)",
                                                        flexShrink: 0
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="d-flex gap-1 justify-content-center" onClick={e => e.stopPropagation()}>
                                                {canAddT && (
                                                    <button 
                                                        className="btn btn-xs btn-primary py-0 px-2 shadow-sm" 
                                                        style={{fontSize: '0.65rem'}} 
                                                        onClick={() => onAdd(groupe, "T")}
                                                    >
                                                        T
                                                    </button>
                                                )}
                                                {canAddP && (
                                                    <button 
                                                        className="btn btn-xs btn-success py-0 px-2 shadow-sm" 
                                                        style={{fontSize: '0.65rem'}} 
                                                        onClick={() => onAdd(groupe, "P")}
                                                    >
                                                        P
                                                    </button>
                                                )}
                                                <button className="btn btn-xs btn-outline-secondary py-0 px-1 shadow-sm" onClick={() => onOpenModal(groupe)}>⚙️</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
