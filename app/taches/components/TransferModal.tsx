'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Enseignant } from "@/app/db/db"

interface TransferModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (targetEnseignantId: string) => void
    title: string
    currentEnseignantId: string
}

export default function TransferModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    currentEnseignantId
}: TransferModalProps) {
    const [search, setSearch] = useState("")
    const [mounted, setMounted] = useState(false)
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    useEffect(() => {
        setMounted(true)
        if (isOpen) setSearch("")
    }, [isOpen])

    if (!isOpen || !mounted) return null

    const filteredEnseignants = (enseignants ?? [])
        .filter(e => e.id !== currentEnseignantId)
        .filter(e => {
            if (!search) return true
            const searchLower = search.toLowerCase()
            return (
                (e.nom ?? "").toLowerCase().includes(searchLower) || 
                (e.prenom ?? "").toLowerCase().includes(searchLower)
            )
        })
        .toSorted((a, b) => (a.nom ?? "").localeCompare(b.nom ?? ""))

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
                backdropFilter: "blur(2px)"
            }}
            onClick={onClose}
        >
            <div 
                className="card shadow-lg" 
                style={{ width: "100%", maxWidth: "500px", maxHeight: "80vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{title}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="card-body d-flex flex-column p-0 overflow-hidden">
                    <div className="p-3 border-bottom bg-light">
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Rechercher un enseignant..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-auto flex-grow-1" style={{minHeight: "200px"}}>
                        <div className="list-group list-group-flush">
                            {filteredEnseignants.map(e => (
                                <button 
                                    key={e.id}
                                    type="button"
                                    className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center"
                                    onClick={() => {
                                        onConfirm(e.id)
                                        onClose()
                                    }}
                                >
                                    <div>
                                        <div className="fw-bold">{e.prenom} {e.nom}</div>
                                        <div className="small text-muted">{e.numeroEmploye}</div>
                                    </div>
                                    <span className="btn btn-sm btn-outline-primary rounded-pill">Transférer →</span>
                                </button>
                            ))}
                            {filteredEnseignants.length === 0 && (
                                <div className="p-4 text-center text-muted">
                                    Aucun enseignant trouvé
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="card-footer bg-light d-flex justify-content-end">
                    <button className="btn btn-secondary px-4 rounded-pill" onClick={onClose}>Annuler</button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
