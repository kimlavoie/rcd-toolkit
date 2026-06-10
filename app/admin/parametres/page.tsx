'use client'

import React, { useState, useEffect } from "react"
import { useAuth } from "@/app/utilities/auth"
import { useRouter } from "next/navigation"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { ParametreService } from "@/app/services"
import { Parametres } from "@/app/db/db"
import { toast } from "react-hot-toast"
import Link from "next/link"

export default function ParametresPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const parametres = useFirestoreCollection<Parametres>("parametres")
    const [duree, setDuree] = useState<number>(4)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (parametres && parametres.length > 0) {
            setDuree(parametres[0].dureePrioriteOrdinaire)
        }
    }, [parametres])

    if (authLoading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    if (!user) { router.push("/login"); return null }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (parametres && parametres.length > 0) {
                await ParametreService.update(parametres[0].id, { dureePrioriteOrdinaire: duree })
            } else {
                await ParametreService.add({ dureePrioriteOrdinaire: duree })
            }
            toast.success("Paramètres enregistrés")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de l'enregistrement")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="container py-4">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/admin">Administration</Link></li>
                    <li className="breadcrumb-item active">Paramètres</li>
                </ol>
            </nav>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                    <h2 className="h5 mb-0 fw-bold">🛠️ Paramètres Globaux</h2>
                </div>
                <div className="card-body">
                    <div className="mb-4">
                        <label className="form-label fw-bold">Durée des priorités ordinaires (années)</label>
                        <div className="input-group" style={{ maxWidth: "200px" }}>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={duree} 
                                onChange={(e) => setDuree(parseInt(e.target.value) || 0)}
                                min="1"
                            />
                            <span className="input-group-text">ans</span>
                        </div>
                        <div className="form-text">
                            Définit après combien d'années une priorité ordinaire expire.
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary px-4" 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    )
}
