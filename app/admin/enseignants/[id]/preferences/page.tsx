'use client'

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/utilities/auth"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { Preference, Enseignant, Cours } from "@/app/db/db"
import { PreferenceService } from "@/app/services"
import { where } from "firebase/firestore"
import { toast } from "react-hot-toast"
import Link from "next/link"
import SelectCours from "@/app/admin/components/inputs/SelectCours"
import SelectAllocation from "@/app/admin/components/inputs/SelectAllocation"
import SelectStage from "@/app/admin/components/inputs/SelectStage"
import SelectSession from "@/app/admin/components/inputs/SelectSession"
import { extractSessionInfos } from "@/app/utilities/sessions"

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
    const allocations = useFirestoreCollection<any>("allocations")
    const stages = useFirestoreCollection<any>("stages")

    const [cibleType, setCibleType] = useState<'COURS' | 'ALLOCATION' | 'STAGE'>('COURS')
    const [filterSession, setFilterSession] = useState("A26") // Default session
    const [selectedTarget, setSelectedTarget] = useState("")
    const [selectedType, setSelectedType] = useState<'ABSOLUE' | 'ORDINAIRE' | 'INTERET'>('INTERET')
    const [anneeObtention, setAnneeObtention] = useState<number>(new Date().getFullYear())

    // Ensure selectedType is strictly 'INTERET' for allocations and stages
    useEffect(() => {
        if (cibleType !== 'COURS' && selectedType !== 'INTERET') {
            setSelectedType('INTERET')
        }
        // Reset selected target when changing type or session
        setSelectedTarget("")
    }, [cibleType, filterSession])

    const filteredPreferences = useMemo(() => {
        if (!preferences) return [];
        const { saison } = extractSessionInfos(filterSession);

        return preferences.filter(pref => {
            if (pref.cours) {
                const c = courses?.find(c => c.id === pref.cours);
                if (!c || !c.saison) return true;
                return c.saison === saison;
            }
            if (pref.allocation) {
                const a = allocations?.find(a => a.id === pref.allocation);
                return a?.session === filterSession;
            }
            if (pref.stage) {
                const s = stages?.find(s => s.id === pref.stage);
                return s?.session === filterSession;
            }
            return true;
        });
    }, [preferences, filterSession, courses, allocations, stages]);

    if (authLoading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>
    if (!user) { router.push("/login"); return null }
    if (enseignants && !enseignant) return <div className="container mt-5 text-center"><div className="alert alert-danger">Enseignant non trouvé</div><Link href="/admin/enseignants" className="btn btn-primary">Retour</Link></div>

    const handleAddPreference = async () => {
        if (!selectedTarget) {
            toast.error("Veuillez sélectionner une cible")
            return
        }

        // Check limits for COURS only, as INTERET has no specific limits right now
        if (cibleType === 'COURS') {
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

            if (preferences?.some(p => p.cours === selectedTarget)) {
                toast.error("Une préférence existe déjà pour ce cours")
                return
            }
        } else if (cibleType === 'ALLOCATION') {
            if (preferences?.some(p => p.allocation === selectedTarget)) {
                toast.error("Une préférence existe déjà pour cette libération")
                return
            }
        } else if (cibleType === 'STAGE') {
            if (preferences?.some(p => p.stage === selectedTarget)) {
                toast.error("Une préférence existe déjà pour ce stage")
                return
            }
        }

        const prefData: any = {
            enseignant: id,
            type: selectedType
        }
        
        if (cibleType === 'COURS') prefData.cours = selectedTarget
        else if (cibleType === 'ALLOCATION') prefData.allocation = selectedTarget
        else if (cibleType === 'STAGE') prefData.stage = selectedTarget

        if (selectedType === 'ORDINAIRE') {
            prefData.anneeObtention = anneeObtention
        }

        try {
            await PreferenceService.add(prefData)
            toast.success("Préférence ajoutée")
            setSelectedTarget("")
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
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-uppercase text-muted">Cible</label>
                            <select className="form-select" value={cibleType} onChange={e => setCibleType(e.target.value as any)}>
                                <option value="COURS">Cours</option>
                                <option value="ALLOCATION">Libération</option>
                                <option value="STAGE">Coordination de stage</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-uppercase text-muted">Session</label>
                            <SelectSession code={filterSession} onChange={setFilterSession} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-uppercase text-muted">Sélection</label>
                            {cibleType === 'COURS' && <SelectCours value={selectedTarget} onChange={setSelectedTarget} saison={extractSessionInfos(filterSession).saison} />}
                            {cibleType === 'ALLOCATION' && <SelectAllocation value={selectedTarget} onChange={setSelectedTarget} session={filterSession} />}
                            {cibleType === 'STAGE' && <SelectStage value={selectedTarget} onChange={setSelectedTarget} session={filterSession} />}
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-uppercase text-muted">Type</label>
                            <select className="form-select" value={selectedType} onChange={e => setSelectedType(e.target.value as any)} disabled={cibleType !== 'COURS'}>
                                {cibleType === 'COURS' && (
                                    <>
                                        <option value="ABSOLUE">Priorité Absolue 🌟</option>
                                        <option value="ORDINAIRE">Priorité Ordinaire ⭐</option>
                                    </>
                                )}
                                <option value="INTERET">Intérêt ❤️</option>
                            </select>
                        </div>
                        {selectedType === 'ORDINAIRE' && (
                            <div className="col-md-1">
                                <label className="form-label fw-bold small text-uppercase text-muted">Année</label>
                                <input 
                                    type="number" 
                                    className="form-control px-1 text-center" 
                                    value={anneeObtention} 
                                    onChange={e => setAnneeObtention(parseInt(e.target.value) || 0)} 
                                />
                            </div>
                        )}
                        <div className="col-md-2 flex-grow-1">
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
                                <th>Cible</th>
                                <th>Élément</th>
                                <th>Type</th>
                                <th>Année d'obtention</th>
                                <th style={{ width: "100px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPreferences.map(pref => {
                                let badge = null;
                                let name = "";
                                let desc = "";
                                
                                if (pref.cours) {
                                    const c = courses?.find(c => c.id === pref.cours);
                                    badge = <span className="badge bg-secondary">📚 Cours</span>;
                                    name = c?.sigle || "Inconnu";
                                    desc = c?.nom || "";
                                } else if (pref.allocation) {
                                    const a = allocations?.find(a => a.id === pref.allocation);
                                    badge = <span className="badge bg-info text-dark">🕊️ Libération</span>;
                                    name = a?.code || "Inconnue";
                                    desc = a?.description || "";
                                } else if (pref.stage) {
                                    const s = stages?.find(s => s.id === pref.stage);
                                    badge = <span className="badge bg-success">🎓 Stage</span>;
                                    name = s?.nom || "Inconnu";
                                    desc = "Coordination ou supervision";
                                }

                                return (
                                    <tr key={pref.id} className="align-middle">
                                        <td>{badge}</td>
                                        <td>
                                            <div className="fw-bold">{name}</div>
                                            <div className="small text-muted">{desc}</div>
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
                            {filteredPreferences.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-5">
                                        <div className="mb-2" style={{fontSize: "2rem"}}>📋</div>
                                        Aucune préférence à afficher pour cette session
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
