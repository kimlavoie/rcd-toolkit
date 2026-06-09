import React from 'react';
import { createPortal } from 'react-dom';
import { CI_THRESHOLDS } from '@/app/constants/ciConfig';
import { useDepartmentHealth } from '@/app/hooks/useCICalculation';

interface DashboardProps {
    isOpen: boolean;
    onClose: () => void;
    sessionsAnnuelle: string[];
    visibleEnseignants: any[];
    selectedScenarioId: string;
    saison: "Automne" | "Hiver";
}

export default function DashboardModal({ isOpen, onClose, sessionsAnnuelle, visibleEnseignants, selectedScenarioId, saison }: DashboardProps) {
    const healthData = useDepartmentHealth(isOpen, visibleEnseignants, sessionsAnnuelle, saison, selectedScenarioId);

    if (!isOpen) return null;

    const underloaded = healthData.filter(d => d.status === 'under');
    const overloaded = healthData.filter(d => d.status === 'over');
    const okloaded = healthData.filter(d => d.status === 'ok');

    const modalContent = (
        <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060}} onClick={onClose}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-primary text-white border-0 py-3">
                        <h5 className="modal-title">📈 Tableau de bord (Santé du département)</h5>
                        <button type="button" className="btn btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4 bg-light">
                        
                        <div className="row text-center mb-4">
                            <div className="col-4">
                                <div className="p-3 bg-white border rounded shadow-sm border-danger border-2 border-top-0 border-end-0 border-bottom-0">
                                    <h3 className="text-danger fw-bold">{overloaded.length}</h3>
                                    <div className="small text-muted text-uppercase fw-bold">Surchargés (&gt;{CI_THRESHOLDS.ANNUAL.GREEN})</div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-3 bg-white border rounded shadow-sm border-success border-2 border-top-0 border-end-0 border-bottom-0">
                                    <h3 className="text-success fw-bold">{okloaded.length}</h3>
                                    <div className="small text-muted text-uppercase fw-bold">Équilibrés ({CI_THRESHOLDS.ANNUAL.YELLOW}-{CI_THRESHOLDS.ANNUAL.GREEN})</div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-3 bg-white border rounded shadow-sm border-warning border-2 border-top-0 border-end-0 border-bottom-0">
                                    <h3 className="text-warning fw-bold">{underloaded.length}</h3>
                                    <div className="small text-muted text-uppercase fw-bold">Sous-chargés (&lt;{CI_THRESHOLDS.ANNUAL.YELLOW})</div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <h6 className="text-danger fw-bold border-bottom pb-2">🔴 Enseignants Surchargés</h6>
                                {overloaded.length === 0 ? <p className="text-muted small">Aucun enseignant surchargé.</p> : (
                                    <ul className="list-group list-group-flush shadow-sm">
                                        {overloaded.map(d => (
                                            <li key={d.enseignant.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                <span className="small fw-bold">{d.enseignant.prenom} {d.enseignant.nom}</span>
                                                <span className="badge bg-danger rounded-pill">{d.totalCI.toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="col-md-6 mb-3">
                                <h6 className="text-warning fw-bold border-bottom pb-2 text-dark">🟡 Enseignants Sous-chargés</h6>
                                {underloaded.length === 0 ? <p className="text-muted small">Aucun enseignant sous-chargé.</p> : (
                                    <ul className="list-group list-group-flush shadow-sm">
                                        {underloaded.map(d => (
                                            <li key={d.enseignant.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                <span className="small fw-bold">{d.enseignant.prenom} {d.enseignant.nom}</span>
                                                <span className="badge bg-warning text-dark rounded-pill">{d.totalCI.toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
