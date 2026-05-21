
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
    selectedScenarioId: string
    setSelectedScenarioId: (id: string) => void
    currentSessionScenarios: Scenario[]
    onHideAll: () => void
    onShowAll: () => void
    onValidate: () => void
    setShowHelp: (show: boolean) => void
}

export default function TachesToolbar({
    mode, setMode, anneeScolaireLabel,
    search, setSearch,
    tri, setTri,
    enseignantWidth, setEnseignantWidth,
    selectedScenarioId, setSelectedScenarioId,
    currentSessionScenarios,
    onHideAll, onShowAll, onValidate,
    setShowHelp
}: TachesToolbarProps) {
    return (
        <div className="mb-2 px-2">
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
                </div>

                {/* Visibilité */}
                <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-secondary py-0 shadow-sm border-0" style={{fontSize: "0.65rem", height: "31px", opacity: 0.8}} onClick={onHideAll}>Tout cacher</button>
                    <button className="btn btn-sm btn-primary py-0 shadow-sm border-0" style={{fontSize: "0.65rem", height: "31px", opacity: 0.8}} onClick={onShowAll}>Tout afficher</button>
                </div>

                {/* Validation */}
                <button className="btn btn-sm btn-success rounded-pill shadow-sm px-3 fw-bold" style={{height: "31px", fontSize: "0.75rem"}} onClick={onValidate}>
                    ✅ Valider
                </button>

                {/* Help */}
                <button 
                    className="btn btn-sm btn-link text-muted p-0 ms-auto" 
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
