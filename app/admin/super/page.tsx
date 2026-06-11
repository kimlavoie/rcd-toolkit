'use client'

import React, { useState } from "react"
import { useAuth } from "@/app/utilities/auth"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useFirestoreCollection, firebaseDb } from "@/app/utilities/firebaseDb"
import Link from "next/link"

export default function SuperAdminPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    
    // We get all departments. Rules must allow ADMIN to read everything.
    const departements = useFirestoreCollection<any>("departements")
    
    const [newDeptName, setNewDeptName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (authLoading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    
    // Redirect if not Super Admin
    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="container mt-5 text-center">
                <div className="alert alert-danger">Accès refusé. Cette page est réservée aux administrateurs système.</div>
                <Link href="/" className="btn btn-primary">Retour à l'accueil</Link>
            </div>
        )
    }

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDeptName.trim()) return

        setIsSubmitting(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch('/api/admin/departements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nom: newDeptName.trim() })
            })

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from server:", text);
                throw new Error("Le serveur a retourné une réponse invalide (HTML/Texte au lieu de JSON). Consultez la console pour plus de détails.");
            }

            if (!res.ok) throw new Error(data?.error || "Erreur inconnue du serveur")
            
            toast.success("Département créé avec succès")
            setNewDeptName("")
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container py-4">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/admin">Administration</Link></li>
                    <li className="breadcrumb-item active">Super Admin</li>
                </ol>
            </nav>

            <div className="d-flex align-items-center mb-4">
                <h1 className="h3 mb-0 fw-bold">🔧 Console Super Admin</h1>
            </div>

            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white py-3">
                            <h2 className="h5 mb-0 fw-bold">Gestion des Utilisateurs</h2>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small">Gérez les rôles et les départements de tous les utilisateurs du système.</p>
                            <Link href="/admin/super/enseignants" className="btn btn-outline-primary w-100 fw-bold">
                                👥 Voir tous les utilisateurs
                            </Link>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white py-3">
                            <h2 className="h5 mb-0 fw-bold">Nouveau Département</h2>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleCreateDepartment}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">NOM DU DÉPARTEMENT</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Ex: Informatique"
                                        value={newDeptName}
                                        onChange={e => setNewDeptName(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={isSubmitting}>
                                    {isSubmitting ? "Création..." : "Créer le département"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white py-3">
                            <h2 className="h5 mb-0 fw-bold">Départements enregistrés ({departements?.length || 0})</h2>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className="table-light text-uppercase small text-muted">
                                    <tr>
                                        <th>Nom</th>
                                        <th>ID Système</th>
                                        <th>Date création</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departements?.map(dept => (
                                        <tr key={dept.id}>
                                            <td className="fw-bold">{dept.nom}</td>
                                            <td className="font-monospace text-muted small">{dept.id}</td>
                                            <td className="small">{new Date(dept.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {departements?.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-muted">Aucun département trouvé.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
