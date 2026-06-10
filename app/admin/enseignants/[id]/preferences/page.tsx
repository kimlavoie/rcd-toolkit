'use client'

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/utilities/auth"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { Preference, Enseignant, Cours } from "@/app/db/db"
import { PreferenceService } from "@/app/services"
import { where } from "firebase/firestore"
import { toast } from "react-hot-toast"
import Link from "next/link"
import SelectCours from "@/app/admin/components/inputs/SelectCours"

export default function EnseignantPreferencesPage() {
    const params = useParams()
    const id = params.id as string
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const enseignant = enseignants?.find(e => e.id === id)

    // Using a memoized constraints array to avoid re-renders if necessary, 
    // but here it's fine as id is stable
    const preferences = useFirestoreCollection<Preference>("preferences", [where("enseignant", "==", id)])
    const courses = useFirestoreCollection<Cours>("cours")

    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedType, setSelectedType] = useState<'ABSOLUE' | 'ORDINAIRE' | 'INTERET'>('INTERET')
    const [anneeObtention, setAnneeObtention] = useState<number>(new Date().getFullYear())

    if (authLoading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    if (!user) { router.push("/login"); return null }
    if (enseignants && !enseignant) return <div className="container mt-5 text-center"><div className="alert alert-danger">Enseignant non trouvé</div><Link href="/admin/enseignants" className="btn btn-primary">Retour</Link></div>

    const handleAddPreference = async () => {
        if (!selectedCourse) {
            toast.error("Veuillez sélectionner un cours")
            return
        }

        // Check limits
        if (selectedType === 'ABSOLUE') {
            const hasAbsolue = preferences?.some(p => p.type === 'ABSOLUE')
            if (hasAbsolue) {
                toast.error("L'enseignant a déjà une priorité absolue")
                return
            }
        }

        if (selectedType === 'ORDINAIRE') {
            const ordinaires = preferences?.filter(p => p.type === 'ORDINAIRE') || []
            if (ordinaires.length >= 2) {
                toast.error("L'enseignant a déjà deux priorités ordinaires")
                return
            }
            if (!anneeObtention) {
                toast.error("L'année d'obtention est requise pour une priorité ordinaire")
                return
            }
        }

        // Check if already exists for this course
        if (preferences?.some(p => p.cours === selectedCourse)) {
            toast.error("Une préférence existe déjà pour ce cours")
            return
        }

        const prefData: any = {
            enseignant: id,
            cours: selectedCourse,
            type: selectedType
        }
        
        if (selectedType === 'ORDINAIRE') {
            prefData.anneeObtention = anneeObtention
        }

        try {
            await PreferenceService.add(prefData)
            toast.success("Préférence ajoutée")
            setSelectedCourse("")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de l'ajout")
        }
    }

    const handleDelete = async (prefId: string) => {
        if (confirm("Supprimer cette préférence ?")) {
            try {
                await PreferenceService.delete(prefId)
                toast.success("Préférence supprimée")
            } catch (error) {
                console.error(error)
                toast.error("Erreur lors de la suppression")
            }
        }
    }

    const handleUpdateYear = async (prefId: string, newYear: number) => {
        try {
            await PreferenceService.update(prefId, { anneeObtention: newYear })
            toast.success("Année mise à jour")
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la mise à jour")
        }
    }

    return (
        <div className="container py-4">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/admin">Administration</Link></li>
                    <li className="breadcrumb-item"><Link href="/admin/enseignants">Enseignants</Link></li>
                    <li className="breadcrumb-item active">Préférences de {enseignant?.prenom} {enseignant?.nom}</li>
                </ol>
            </nav>

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3">
                    <h2 className="h5 mb-0 fw-bold">Ajouter une préférence</h2>
                </div>
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Cours</label>
                            <SelectCours value={selectedCourse} onChange={setSelectedCourse} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-uppercase text-muted">Type</label>
                            <select className="form-select" value={selectedType} onChange={e => setSelectedType(e.target.value as any)}>
                                <option value="ABSOLUE">Priorité Absolue 🌟</option>
                                <option value="ORDINAIRE">Priorité Ordinaire ⭐</option>
                                <option value="INTERET">Intérêt ❤️</option>
                            </select>
                        </div>
                        {selectedType === 'ORDINAIRE' && (
                            <div className="col-md-2">
                                <label className="form-label fw-bold small text-uppercase text-muted">Année d'obtention</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={anneeObtention} 
                                    onChange={e => setAnneeObtention(parseInt(e.target.value) || 0)} 
                                />
                            </div>
                        )}
                        <div className="col-md-2">
                            <button className="btn btn-primary w-100" onClick={handleAddPreference}>Ajouter</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                    <h2 className="h5 mb-0 fw-bold">Préférences actuelles</h2>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light text-uppercase small">
                            <tr>
                                <th>Cours</th>
                                <th>Type</th>
                                <th>Année d'obtention</th>
                                <th style={{ width: "100px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preferences?.map(pref => {
                                const course = courses?.find(c => c.id === pref.cours)
                                return (
                                    <tr key={pref.id} className="align-middle">
                                        <td>
                                            <div className="fw-bold">{course?.sigle}</div>
                                            <div className="small text-muted">{course?.nom}</div>
                                        </td>
                                        <td>
                                            {pref.type === 'ABSOLUE' && <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">🌟 Absolue</span>}
                                            {pref.type === 'ORDINAIRE' && <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">⭐ Ordinaire</span>}
                                            {pref.type === 'INTERET' && <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">❤️ Intérêt</span>}
                                        </td>
                                        <td>
                                            {pref.type === 'ORDINAIRE' ? (
                                                <input 
                                                    type="number" 
                                                    className="form-control form-control-sm" 
                                                    style={{ width: "100px" }}
                                                    defaultValue={pref.anneeObtention}
                                                    onBlur={(e) => {
                                                        const newVal = parseInt(e.target.value)
                                                        if (newVal && newVal !== pref.anneeObtention) {
                                                            handleUpdateYear(pref.id, newVal)
                                                        }
                                                    }}
                                                />
                                            ) : "-"}
                                        </td>
                                        <td className="text-end">
                                            <button className="btn btn-outline-danger btn-sm border-0" onClick={() => handleDelete(pref.id)} title="Supprimer">🗑️</button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {(!preferences || preferences.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted py-5">
                                        <div className="mb-2" style={{fontSize: "2rem"}}>📋</div>
                                        Aucune préférence définie pour cet enseignant
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
