'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { getCorrespondingSessions } from "@/app/utilities/sessions"
import SelectSession from "./inputs/SelectSession"

interface AdminSessionSwitcherProps {
    currentSession: string
    basePath: string
    className?: string
}

export default function AdminSessionSwitcher({
    currentSession,
    basePath,
    className = ""
}: AdminSessionSwitcherProps) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalSession, setModalSession] = useState(currentSession)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        setModalSession(currentSession)
    }, [currentSession, isModalOpen])

    const {
        currentSaison,
        autumnSession,
        winterSession,
        autumnYear,
        winterYear
    } = getCorrespondingSessions(currentSession)

    const handleSwitch = (newSession: string) => {
        if (newSession !== currentSession) {
            router.push(`${basePath}/${newSession}`)
        }
        setIsModalOpen(false)
    }

    const modalContent = isModalOpen && mounted ? (
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
                backdropFilter: "blur(2px)"
            }}
            onClick={() => setIsModalOpen(false)}
        >
            <div 
                className="card shadow-lg border-0" 
                style={{ width: "100%", maxWidth: "420px" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0 fs-6 fw-bold">📅 Sélectionner une autre session</h5>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={() => setIsModalOpen(false)}
                        aria-label="Fermer"
                    />
                </div>
                <div className="card-body p-4">
                    <p className="text-muted small mb-3">
                        Choisissez la session vers laquelle vous souhaitez basculer :
                    </p>
                    <div className="mb-4">
                        <SelectSession 
                            code={modalSession} 
                            onChange={(code: string) => setModalSession(code)} 
                        />
                    </div>
                </div>
                <div className="card-footer bg-light border-0 d-flex justify-content-end gap-2 p-3">
                    <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setIsModalOpen(false)}
                    >
                        Annuler
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleSwitch(modalSession)}
                    >
                        Accéder
                    </button>
                </div>
            </div>
        </div>
    ) : null

    return (
        <div className={`d-flex align-items-center gap-2 ${className}`}>
            <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden border bg-white" style={{ height: "30px" }}>
                <button
                    type="button"
                    className={`btn ${currentSaison === 'Automne' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`}
                    style={{ fontSize: "0.8rem", padding: "0 12px" }}
                    onClick={() => {
                        if (currentSession !== autumnSession) {
                            router.push(`${basePath}/${autumnSession}`)
                        }
                    }}
                    title={`Basculer vers Automne ${autumnYear}`}
                >
                    🍂 Automne {autumnYear}
                </button>
                <button
                    type="button"
                    className={`btn ${currentSaison === 'Hiver' ? 'btn-primary fw-bold' : 'btn-white text-muted border-0'}`}
                    style={{ fontSize: "0.8rem", padding: "0 12px" }}
                    onClick={() => {
                        if (currentSession !== winterSession) {
                            router.push(`${basePath}/${winterSession}`)
                        }
                    }}
                    title={`Basculer vers Hiver ${winterYear}`}
                >
                    ❄️ Hiver {winterYear}
                </button>
            </div>

            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 d-flex align-items-center gap-1 shadow-sm"
                style={{ height: "30px", fontSize: "0.75rem" }}
                title="Sélectionner une autre session"
            >
                <span>📅</span>
                <span className="d-none d-sm-inline">Autre session</span>
            </button>

            {mounted && modalContent && createPortal(modalContent, document.body)}
        </div>
    )
}
