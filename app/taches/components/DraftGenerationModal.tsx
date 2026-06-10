'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface DraftGenerationParams {
    sessions: string[]
    includeCharges: boolean
    includeLiberations: boolean
    includeSupervisions: boolean
    respectAbsolue: boolean
    respectOrdinaire: boolean
    respectInteret: boolean
    balanceCI: boolean
    overwriteExisting: boolean
}

interface DraftGenerationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (params: DraftGenerationParams) => void
    sessionsAnnuelle: string[]
    anneeScolaireLabel: string
}

export default function DraftGenerationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    sessionsAnnuelle,
    anneeScolaireLabel
}: DraftGenerationModalProps) {
    const [params, setParams] = useState<DraftGenerationParams>({
        sessions: sessionsAnnuelle,
        includeCharges: true,
        includeLiberations: true,
        includeSupervisions: true,
        respectAbsolue: true,
        respectOrdinaire: true,
        respectInteret: true,
        balanceCI: true,
        overwriteExisting: false
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    const handleConfirm = () => {
        onConfirm(params)
        onClose()
    }

    const modalContent = (
        <div 
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                backdropFilter: "blur(4px)",
                padding: "20px"
            }}
            onClick={onClose}
        >
            <div 
                className="card shadow-lg border-0 d-flex flex-column" 
                style={{ width: "100%", maxWidth: "550px", borderRadius: "12px", overflow: "hidden", maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center flex-shrink-0">
                    <h5 className="mb-0 fw-bold">🤖 Générer une ébauche</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="card-body p-4 overflow-auto">
                    <p className="text-muted mb-4 small">
                        L'algorithme va attribuer automatiquement les tâches pour l'année scolaire <strong>{anneeScolaireLabel}</strong> en respectant vos critères de configuration.
                    </p>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-primary">Sessions à inclure</label>
                        <div className="d-flex gap-3">
                            {sessionsAnnuelle.map(s => (
                                <div key={s} className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id={`check-${s}`} 
                                        checked={params.sessions.includes(s)}
                                        onChange={(e) => {
                                            if (e.target.checked) setParams({...params, sessions: [...params.sessions, s]})
                                            else setParams({...params, sessions: params.sessions.filter(v => v !== s)})
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor={`check-${s}`}>{s}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-primary">Éléments à générer</label>
                        <div className="row g-2">
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.includeCharges} onChange={e => setParams({...params, includeCharges: e.target.checked})} id="switchCharges" />
                                    <label className="form-check-label small" htmlFor="switchCharges">📚 Cours</label>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.includeLiberations} onChange={e => setParams({...params, includeLiberations: e.target.checked})} id="switchLibs" />
                                    <label className="form-check-label small" htmlFor="switchLibs">🕊️ Libérations</label>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.includeSupervisions} onChange={e => setParams({...params, includeSupervisions: e.target.checked})} id="switchSups" />
                                    <label className="form-check-label small text-truncate" htmlFor="switchSups">🎓 Stages</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-primary">Préférences à respecter</label>
                        <div className="row g-2">
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.respectAbsolue} onChange={e => setParams({...params, respectAbsolue: e.target.checked})} id="switchAbsolue" />
                                    <label className="form-check-label small" htmlFor="switchAbsolue">🌟 Absolue</label>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.respectOrdinaire} onChange={e => setParams({...params, respectOrdinaire: e.target.checked})} id="switchOrdinaire" />
                                    <label className="form-check-label small" htmlFor="switchOrdinaire">⭐ Ordinaire</label>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-check form-switch p-2 border rounded bg-light">
                                    <input className="form-check-input ms-0 me-2" type="checkbox" checked={params.respectInteret} onChange={e => setParams({...params, respectInteret: e.target.checked})} id="switchInteret" />
                                    <label className="form-check-label small" htmlFor="switchInteret">❤️ Intérêt</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-primary">Paramètres</label>
                        <div className="row g-2">
                            <div className="col-12">
                                <div className="form-check form-switch p-2 border rounded bg-light d-flex align-items-center">
                                    <input className="form-check-input ms-0 me-2 mt-0" type="checkbox" checked={params.balanceCI} onChange={e => setParams({...params, balanceCI: e.target.checked})} id="switchBalance" />
                                    <div>
                                        <label className="form-check-label small fw-bold" htmlFor="switchBalance">⚖️ Équilibrage CI</label>
                                        <div className="extra-small text-muted" style={{fontSize: "0.7rem"}}>
                                            Tente de répartir les tâches non-prioritaires aux enseignants ayant la charge la plus basse.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-2 p-3 bg-warning-subtle border border-warning rounded">
                        <div className="form-check">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="overwriteCheck" 
                                checked={params.overwriteExisting} 
                                onChange={e => setParams({...params, overwriteExisting: e.target.checked})}
                            />
                            <label className="form-check-label small fw-bold text-warning-emphasis" htmlFor="overwriteCheck">
                                Remplacer les données existantes ⚠️
                            </label>
                            <div className="extra-small text-muted mt-1">
                                Si coché, l'année sera d'abord vidée avant la génération. Sinon, l'algorithme ne fera que compléter les trous.
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-footer bg-white border-top py-3 flex-shrink-0 d-flex gap-2 justify-content-end">
                    <button className="btn btn-light px-4 rounded-pill border fw-bold text-muted" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary px-4 rounded-pill shadow-sm fw-bold" onClick={handleConfirm} disabled={params.sessions.length === 0}>
                        Lancer la génération
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
