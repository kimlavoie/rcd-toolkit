'use client'

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "react-hot-toast"
import type { Enseignant } from "@/app/db/db"

interface CreateAccountModalProps {
    isOpen: boolean
    onClose: () => void
    enseignant: Enseignant | null
    currentUserToken: string
    departementId: string | null | undefined
}

export default function CreateAccountModal({ 
    isOpen, 
    onClose, 
    enseignant,
    currentUserToken,
    departementId
}: CreateAccountModalProps) {
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            setPassword(Math.random().toString(36).slice(-8)) // Generate a random initial password
        }
    }, [isOpen])

    if (!isOpen || !mounted || !enseignant) return null

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!enseignant.courriel) {
            toast.error("L'enseignant doit avoir une adresse courriel pour créer un compte.")
            return
        }

        if (!password || password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUserToken}`
                },
                body: JSON.stringify({ 
                    email: enseignant.courriel,
                    password: password,
                    displayName: `${enseignant.prenom} ${enseignant.nom}`,
                    role: 'ENSEIGNANT',
                    departementId: departementId
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            toast.success("Compte d'accès créé avec succès !")
            onClose()
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création du compte")
        } finally {
            setIsSubmitting(false)
        }
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
                backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <div 
                className="card shadow-lg border-0" 
                style={{ width: "100%", maxWidth: "450px", borderRadius: "12px", overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Créer un accès</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="card-body p-4">
                    <p className="text-muted mb-4 small">
                        Créer un compte de connexion pour <strong>{enseignant.prenom} {enseignant.nom}</strong>. Il aura un accès en lecture seule au tableau des tâches de votre département.
                    </p>

                    <form onSubmit={handleCreateAccount}>
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">COURRIEL DE CONNEXION</label>
                            <input 
                                type="email" 
                                className="form-control bg-light" 
                                value={enseignant.courriel || "Aucun courriel défini"}
                                disabled
                            />
                            {!enseignant.courriel && (
                                <div className="form-text text-danger">Veuillez d'abord ajouter un courriel au profil de l'enseignant.</div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">MOT DE PASSE INITIAL</label>
                            <input 
                                type="text" 
                                className="form-control font-monospace" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <div className="form-text">Communiquez ce mot de passe à l'enseignant de manière sécurisée.</div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button 
                                type="button"
                                className="btn btn-light px-4 rounded-pill border fw-bold text-muted" 
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit"
                                className="btn btn-primary px-4 rounded-pill shadow-sm fw-bold" 
                                disabled={isSubmitting || !enseignant.courriel}
                            >
                                {isSubmitting ? "Création..." : "Créer le compte"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
