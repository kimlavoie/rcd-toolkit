
'use client'
import React from "react"
import Link from "next/link"
import type { Scenario } from "@/app/db/db"

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
    setShowHelp: (show: boolean) => void
}

export default function TachesToolbar({
    mode, setMode, anneeScolaireLabel,
    search, setSearch,
    tri, setTri,
    enseignantWidth, setEnseignantWidth,
    teachersPerPage, setTeachersPerPage,
    selectedScenarioId, setSelectedScenarioId,
    currentSessionScenarios,
    onHideAll, onShowAll, onExpandAll, onCollapseAll, onValidate, onFitToScreen, onExportPDF,
    setShowHelp
}: TachesToolbarProps) {
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
                </div>
                {selectedScenarioId !== "production" && (
                    <span className="badge bg-warning text-dark animate-pulse" style={{fontSize: "0.7rem"}}>
                        Mode Scénario : {currentSessionScenarios.find(s => s.id === selectedScenarioId)?.nom}
                    </span>
                )}
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
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

                {/* Scénario */}
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

                {/* Largeur */}
                <div className="btn-group btn-group-sm shadow-sm border rounded overflow-hidden" style={{height: "31px"}}>
                    <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 100 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(100)}>Min</button>
                    <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 200 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(200)}>Std</button>
                    <button className={`btn btn-white py-0 border-0 ${enseignantWidth === 300 ? 'bg-light fw-bold' : ''}`} style={{fontSize: "0.65rem"}} onClick={() => setEnseignantWidth(300)}>Max</button>
                    <button className="btn btn-outline-primary py-0 border-0 border-start" style={{fontSize: "0.65rem"}} onClick={onFitToScreen} title="Ajuster à l'écran">Ajuster</button>
                </div>

                {/* Enseignants */}
                <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                    <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Enseignants</span>
                    <div className="btn-group btn-group-sm rounded overflow-hidden" style={{height: "24px"}}>
                        <button className="btn btn-white py-0 border-0 text-secondary" style={{fontSize: "0.65rem"}} onClick={onHideAll}>Cacher tout</button>
                        <button className="btn btn-white py-0 border-0 text-primary fw-bold border-start" style={{fontSize: "0.65rem"}} onClick={onShowAll}>Afficher tout</button>
                    </div>
                </div>

                {/* Détails */}
                <div className="d-flex align-items-center gap-1 bg-white px-2 rounded shadow-sm border" style={{height: "31px"}}>
                    <span className="text-muted extra-small fw-bold text-uppercase px-1" style={{fontSize: "0.6rem"}}>Détails</span>
                    <div className="btn-group btn-group-sm rounded overflow-hidden" style={{height: "24px"}}>
                        <button className="btn btn-white py-0 border-0 text-secondary" style={{fontSize: "0.65rem"}} onClick={onCollapseAll} title="Tout replier (cours, sessions)">
                            <span style={{fontSize: "0.8rem", marginRight: "3px"}}>➖</span>Replier tout
                        </button>
                        <button className="btn btn-white py-0 border-0 text-primary fw-bold border-start" style={{fontSize: "0.65rem"}} onClick={onExpandAll} title="Tout déplier (cours, sessions, sections)">
                            <span style={{fontSize: "0.8rem", marginRight: "3px"}}>➕</span>Déplier tout
                        </button>
                    </div>
                </div>

                {/* Validation & PDF Unified */}
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-sm btn-success rounded-pill shadow-sm px-3 fw-bold" style={{height: "31px", fontSize: "0.75rem"}} onClick={onValidate}>
                        ✅ Valider
                    </button>

                    <div className="d-flex align-items-center bg-white rounded-pill shadow-sm border border-danger overflow-hidden" style={{height: "31px"}}>
                        <button 
                            className="btn btn-sm btn-danger border-0 px-3 fw-bold rounded-0 text-white" 
                            style={{fontSize: "0.75rem", height: "100%"}} 
                            onClick={onExportPDF}
                            title="Lancer l'impression PDF"
                        >
                            🖨️ PDF
                        </button>
                        <div className="border-start border-danger-subtle h-100 d-flex align-items-center px-2 bg-light">
                            <span className="text-muted extra-small me-2" style={{fontSize: "0.6rem"}}>PAR PAGE:</span>
                            <select 
                                className="form-select form-select-sm border-0 fw-bold text-danger p-0 bg-transparent text-center" 
                                style={{
                                    width: "40px", 
                                    outline: "none", 
                                    boxShadow: "none", 
                                    fontSize: "0.75rem", 
                                    cursor: "pointer",
                                    appearance: "none",
                                    backgroundImage: "none",
                                    paddingRight: "0"
                                }}
                                value={teachersPerPage}
                                onChange={e => setTeachersPerPage(Number(e.target.value))}
                            >
                                {[2,3,4,5,6,7,8,9,10].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Help */}
                <button 
                    className="btn btn-sm btn-link text-muted p-0 ms-1" 
                    onClick={() => setShowHelp(true)}
                    title="Aide et astuces"
                    style={{textDecoration: "none", fontSize: "1rem"}}
                >
                    ❔
                </button>
            </div>
        </div>
    )
}
