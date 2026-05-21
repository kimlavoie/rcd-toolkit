'use client'
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../utilities/auth";

export default function(){
    const { user, loading } = useAuth()
    const [annee, setAnnee] = useState(new Date().getFullYear())
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) return null;

    return <div className="container mt-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm p-4">
                    <h2 className="mb-4 text-center">Sélection de l'année scolaire</h2>
                    <p className="text-muted text-center mb-4">Choisissez l'année scolaire pour consulter et gérer les <strong>tâches des enseignants</strong>.</p>
                    
                    <div className="mb-4 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <span className="fw-bold h4 mb-0">Année scolaire</span>
                            <div className="input-group" style={{maxWidth: "250px"}}>
                                <input 
                                    type="number" 
                                    className="form-control form-control-lg text-center fw-bold" 
                                    value={annee} 
                                    onChange={(e) => setAnnee(parseInt(e.target.value))}
                                />
                                <span className="input-group-text bg-light fw-bold text-muted"> - {annee + 1}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button className="btn btn-primary btn-lg w-100 shadow-sm" onClick={() => router.push(`taches/${annee}`)}>
                        Accéder aux tâches
                    </button>
                    
                    <div className="mt-4 pt-3 border-top text-center">
                        <p className="small text-muted mb-0">L'année scolaire comprend la session d'<strong>Automne {annee}</strong> et d'<strong>Hiver {annee + 1}</strong>.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
