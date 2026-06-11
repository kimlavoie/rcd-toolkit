'use client'

import { useState, useEffect } from "react"
import { useAuth } from "../utilities/auth"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import Skeleton from "@/app/utilities/Skeleton"

export default function ProfilPage() {
    const { user, loading, changePassword, refreshUser } = useAuth()
    const router = useRouter()

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="200px" className="mb-2" />
        </div>
    )

    if (!user) {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères.")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.")
            return
        }

        setIsSubmitting(true)
        try {
            await changePassword(newPassword)
            
            // Signaler au serveur que le mot de passe a été changé pour mettre à jour les flags/claims
            const token = await user?.getIdToken()
            await fetch('/api/auth/password-changed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            toast.success("Mot de passe modifié avec succès !")
            setNewPassword("")
            setConfirmPassword("")
            
            // Rafraîchir les informations utilisateur locales (claims)
            await refreshUser();
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Pour changer votre mot de passe, vous devez vous être connecté récemment. Veuillez vous déconnecter et vous reconnecter.")
            } else {
                toast.error("Erreur lors du changement de mot de passe : " + (error.message || "Erreur inconnue"))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white py-3 border-bottom border-light">
                            <h2 className="h4 mb-0 fw-bold">Mon Profil</h2>
                        </div>
                        <div className="card-body p-4">
                            <div className="mb-4 pb-4 border-bottom border-light">
                                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Nom Complet</label>
                                <div className="h5 mb-3">{user.displayName || "Non défini"}</div>

                                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Courriel</label>
                                <div className="text-dark">{user.email}</div>
                                
                                <label className="form-label small fw-bold text-muted text-uppercase mt-3 mb-1">Rôle</label>
                                <div>
                                    <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'COORDONNATEUR' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {user.role || "ENSEIGNANT"}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <h3 className="h6 fw-bold mb-3">Changer le mot de passe</h3>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">NOUVEAU MOT DE PASSE</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 caractères"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted">CONFIRMER LE MOT DE PASSE</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100 fw-bold py-2 rounded-3"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Modification...
                                        </>
                                    ) : "Mettre à jour le mot de passe"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
