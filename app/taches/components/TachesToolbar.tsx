
'use client'
import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import type { Scenario } from "@/app/db/db"
import { useHistory } from "./HistoryContext"

interface TachesToolbarProps {
    mode: "Automne" | "Hiver"
    setMode: (mode: "Automne" | "Hiver") => void
    anneeScolaireLabel: string
    search: string
    setSearch: (search: string) => void
    tri: string
    setTri: (tri: string) => void
    enseignantWidth: number
    setEnseignantWidth: (width: number) => void
    teachersPerPage: number
    setTeachersPerPage: (count: number) => void
    selectedScenarioId: string
    setSelectedScenarioId: (id: string) => void
    currentSessionScenarios: Scenario[]
    onHideAll: () => void
    onShowAll: () => void
    onExpandAll: () => void
    onCollapseAll: () => void
    onValidate: () => void
    onFitToScreen: () => void
    onExportPDF: () => void
    onExportCSV?: () => void
    setShowHelp: (show: boolean) => void
    onShowDashboard: () => void
}

function Dropdown({ title, children, icon, btnClass = "btn-outline-secondary" }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="position-relative" ref={ref}>
            <button 
                className={`btn btn-sm ${btnClass} rounded shadow-sm d-flex align-items-center gap-1`} 
                style={{height: "31px", fontSize: "0.75rem"}} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {icon && <span>{icon}</span>}
                <span className="fw-bold">{title}</span>
            </button>
            {isOpen && (
                <div 
                    className="position-absolute bg-white border rounded shadow-lg p-2 mt-1" 
                    style={{zIndex: 1050, right: 0, minWidth: "200px"}}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export default function TachesToolbar({
    mode, setMode, anneeScolaireLabel,
    search, setSearch,
    tri, setTri,
    enseignantWidth, setEnseignantWidth,
    teachersPerPage, setTeachersPerPage,
    selectedScenarioId, setSelectedScenarioId,
    currentSessionScenarios,
    onHideAll, onShowAll, onExpandAll, onCollapseAll, onValidate, onFitToScreen, onExportPDF, onExportCSV,
    setShowHelp, onShowDashboard
}: TachesToolbarProps) {
    const { undo, redo, canUndo, canRedo } = useHistory()

    return (
        <div className="mb-2 px-2 no-print">
            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <div className="d-flex align-items-center gap-3">
                    <h1 className="mb-0 text-primary h5 fw-bold">
                        Année scolaire {anneeScolaireLabel}
                    </h1>
                    <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden border" style={{height: "28px"}}>
                        <button 
                            className={`btn ${mode === 'Automne' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`} 
                            style={{fontSize: "0.75rem", padding: "0 15px"}} 
                            onClick={() => setMode('Automne')}
                        >
                            🍂 Mode Automne
                        </button>
                        <button 
                            className={`btn ${mode === 'Hiver' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`} 
                            style={{fontSize: "0.75rem", padding: "0 15px"}} 
                            onClick={() => setMode('Hiver')}
                        >
                            ❄️ Mode Hiver
                        </button>
                    </div>

                    <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden border ms-2" style={{height: "28px"}}>
                        <button 
                            className="btn btn-white text-muted border-0 px-3" 
                            disabled={!canUndo}
                            onClick={undo}
                            title="Annuler (Ctrl+Z)"
                        >
                            ↩️
                        </button>
                        <button 
                            className="btn btn-white text-muted border-0 px-3 border-start" 
                            disabled={!canRedo}
                            onClick={redo}
                            title="Rétablir (Ctrl+Y)"
                        >
                            ↪️
                        </button>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {selectedScenarioId !== "production" && (
                        <span className="badge bg-warning text-dark animate-pulse me-2" style={{fontSize: "0.7rem"}}>
                            Scénario : {currentSessionScenarios.find(s => s.id === selectedScenarioId)?.nom}
                        </span>
                    )}

                    <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                        <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Scénario 🎭</span>
                        <select 
                            className="form-select form-select-sm border-0 fw-bold text-primary p-0 ps-1" 
                            style={{width: "auto", minWidth: "120px", outline: "none", boxShadow: "none", backgroundColor: "transparent", fontSize: "0.75rem", paddingRight: "25px"}}
                            value={selectedScenarioId}
                            onChange={e => setSelectedScenarioId(e.target.value)}
                        >
                            <option value="production">🚀 Production</option>
                            {currentSessionScenarios.map(s => (
                                <option key={s.id} value={s.id}>📁 {s.nom}</option>
                            ))}
                        </select>
                        <Link href="/admin/scenarios" className="btn btn-sm btn-link text-muted p-0 ms-1" title="Gérer les scénarios" style={{fontSize: "0.75rem", textDecoration: "none"}}>⚙️</Link>
                    </div>
                </div>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap justify-content-between">
                <div className="d-flex gap-3 align-items-center flex-wrap">
                    {/* Recherche */}
                    <div className="input-group input-group-sm shadow-sm" style={{maxWidth: "180px"}}>
                        <span className="input-group-text bg-white border-end-0 text-muted py-0">🔍</span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0 py-0" 
                            placeholder="Chercher..." 
                            value={search} 
                            style={{fontSize: "0.8rem", height: "31px"}}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="btn btn-outline-secondary border-start-0 py-0" onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>

                    {/* Tri */}
                    <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                        <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Tri ⇅</span>
                        <div className="btn-group btn-group-sm rounded overflow-hidden" style={{height: "24px"}}>
                            <button 
                                className={`btn btn-white py-0 border-0 ${tri === 'nom' ? 'bg-light fw-bold text-primary' : 'text-muted'}`} 
                                style={{fontSize: "0.7rem", transition: "all 0.2s"}} 
                                onClick={() => setTri('nom')}
                            >
                                Nom
                            </button>
                            <button 
                                className={`btn btn-white py-0 border-0 ${tri === 'numeroEmploye' ? 'bg-light fw-bold text-primary' : 'text-muted'}`} 
                                style={{fontSize: "0.7rem", transition: "all 0.2s"}} 
                                onClick={() => setTri('numeroEmploye')}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    <Dropdown title="Affichage" icon="👁️" btnClass="btn-white border">
                        <div className="d-flex flex-column gap-3">
                            <div>
                                <span className="text-muted extra-small fw-bold text-uppercase d-block mb-1" style={{fontSize: "0.65rem"}}>Taille des colonnes</span>
                                <div className="btn-group btn-group-sm w-100 border rounded overflow-hidden">
                                    <button className={`btn btn-white py-1 border-0 ${enseignantWidth === 100 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.7rem"}} onClick={() => setEnseignantWidth(100)}>Min</button>
                                    <button className={`btn btn-white py-1 border-0 ${enseignantWidth === 200 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.7rem"}} onClick={() => setEnseignantWidth(200)}>Std</button>
                                    <button className={`btn btn-white py-1 border-0 ${enseignantWidth === 300 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.7rem"}} onClick={() => setEnseignantWidth(300)}>Max</button>
                                    <button className="btn btn-outline-primary py-1 border-0 border-start" style={{fontSize: "0.7rem"}} onClick={onFitToScreen} title="Ajuster à l'écran">Ajuster</button>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-muted extra-small fw-bold text-uppercase d-block mb-1" style={{fontSize: "0.65rem"}}>Enseignants</span>
                                <div className="btn-group btn-group-sm w-100 border rounded overflow-hidden">
                                    <button className="btn btn-white py-1 border-0 text-secondary" style={{fontSize: "0.7rem"}} onClick={onHideAll}>Cacher tout</button>
                                    <button className="btn btn-white py-1 border-0 text-primary fw-bold border-start" style={{fontSize: "0.7rem"}} onClick={onShowAll}>Afficher tout</button>
                                </div>
                            </div>

                            <div>
                                <span className="text-muted extra-small fw-bold text-uppercase d-block mb-1" style={{fontSize: "0.65rem"}}>Sections</span>
                                <div className="btn-group btn-group-sm w-100 border rounded overflow-hidden">
                                    <button className="btn btn-white py-1 border-0 text-secondary" style={{fontSize: "0.7rem"}} onClick={onCollapseAll}>➖ Replier tout</button>
                                    <button className="btn btn-white py-1 border-0 text-primary fw-bold border-start" style={{fontSize: "0.7rem"}} onClick={onExpandAll}>➕ Déplier tout</button>
                                </div>
                            </div>
                        </div>
                    </Dropdown>
                </div>

                {/* Validation & PDF & CSV & Dashboard Unified */}
                <div className="d-flex gap-2 align-items-center">
                    <button 
                        className="btn btn-sm btn-outline-primary rounded shadow-sm px-3 fw-bold" 
                        style={{height: "31px", fontSize: "0.75rem"}} 
                        onClick={onShowDashboard}
                        title="Voir la santé du département"
                    >
                        📈 Santé
                    </button>

                    <button className="btn btn-sm btn-success rounded shadow-sm px-3 fw-bold" style={{height: "31px", fontSize: "0.75rem"}} onClick={onValidate}>
                        ✅ Valider
                    </button>
                    
                    <Dropdown title="Exporter" icon="📥" btnClass="btn-outline-secondary">
                        <div className="d-flex flex-column gap-2">
                            {onExportCSV && (
                                <button 
                                    className="btn btn-sm btn-light border text-start fw-bold" 
                                    style={{fontSize: "0.75rem"}} 
                                    onClick={onExportCSV}
                                >
                                    📊 Données (CSV)
                                </button>
                            )}
                            
                            <div className="border-top pt-2 mt-1">
                                <button 
                                    className="btn btn-sm btn-danger border text-start fw-bold w-100 mb-2" 
                                    style={{fontSize: "0.75rem"}} 
                                    onClick={onExportPDF}
                                >
                                    🖨️ Imprimer (PDF)
                                </button>
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted" style={{fontSize: "0.7rem"}}>Enseignants par page :</span>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="form-control form-control-sm border p-1 bg-light text-center" 
                                        style={{width: "50px", fontSize: "0.8rem"}}
                                        value={teachersPerPage}
                                        onChange={e => setTeachersPerPage(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Dropdown>

                    <button 
                        className="btn btn-sm btn-link text-muted p-0 ms-1" 
                        onClick={() => setShowHelp(true)}
                        title="Aide et astuces"
                        style={{textDecoration: "none", fontSize: "1.2rem"}}
                    >
                        ❔
                    </button>
                </div>
            </div>
        </div>
    )
}
