'use client'

import { useGenericAdmin } from "@/app/admin/components/useGenericAdmin"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense, useState, useMemo } from "react"
import { useAuth } from "@/app/utilities/auth"
import Link from "next/link"
import type { Enseignant } from "@/app/db/db"
import { toast } from "react-hot-toast"

import { DeletionService } from "@/app/utilities/deletionService"
import Skeleton from "@/app/utilities/Skeleton";
import CreateAccountModal from "./CreateAccountModal"
import SelectDepartement from "@/app/admin/components/inputs/SelectDepartement"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import type { Departement } from "@/app/db/db"

function EnseignantsPageContent(){
    const { user, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")
    
    const [token, setToken] = useState<string>("")
    const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    const departements = useFirestoreCollection<Departement>("departements")

    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken)
        }
    }, [user])

    const isAdmin = user?.role === 'ADMIN'

    const {
        search, setSearch, sortedData, toggleSort, getSortIcon,
        editingId, editData, setEditData, newData, setNewData,
        startEdit, cancelEdit, saveEdit, addNew, deleteItem
    } = useGenericAdmin<Enseignant>({
        collectionName: "enseignants",
        initialSortKey: "nom",
        filterFn: (e, search) => {
            const s = search.toLowerCase()
            return (e.nom ?? "").toLowerCase().includes(s) || 
                   (e.prenom ?? "").toLowerCase().includes(s) ||
                   (e.numeroEmploye ?? "").toLowerCase().includes(s)
        },
        defaultNewData: { 
            numeroEmploye: "", 
            prenom: "", 
            nom: "", 
            courriel: "", 
            role: "ENSEIGNANT",
            departementId: user?.departementId || "" 
        },
        onBeforeAdd: (data) => {
            if (!data.nom || !data.prenom || !data.courriel) {
                toast.error("Le nom, le prénom et le courriel sont requis.")
                return false
            }
            if (!user?.departementId) {
                toast.error("Vous devez être associé à un département pour ajouter un enseignant ici.")
                return false
            }
        },
        onAdd: async (data) => {
            const payload = { 
                ...data, 
                departementId: user?.departementId 
            };
            
            const res = await fetch('/api/admin/enseignants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            
            if (result.tempPassword) {
                toast.success(`Enseignant et compte créés ! Mot de passe : ${result.tempPassword}`, { duration: 10000 })
            } else {
                toast.success("Enseignant ajouté")
            }
            return result
        },
        onSave: async (id, data) => {
            const payload = { 
                ...data, 
                id,
                departementId: user?.departementId 
            };

            const res = await fetch('/api/admin/enseignants', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            return result
        },
        onDelete: DeletionService.deleteEnseignant
    })

    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`row-${highlightId}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }, [highlightId, sortedData])

    if (loading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) {
        router.push("/login")
        return null
    }

    const currentDeptName = departements?.find(d => d.id === user.departementId)?.nom || user.departementId || "Aucun département associé"

    return <div className="container mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h1 className="mb-0">Gestion des enseignants</h1>
                <p className="text-muted small mb-0">
                    Département: <span className={user.departementId ? "fw-bold text-dark" : "text-danger italic"}>{currentDeptName}</span>
                    {!user.departementId && isAdmin && (
                        <Link href="/admin/super/enseignants" className="ms-2 badge bg-info text-decoration-none">S'associer à un département</Link>
                    )}
                </p>
            </div>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Rechercher par nom, prénom, no..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                {search && (
                    <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>✕</button>
                )}
            </div>
        </div>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("numeroEmploye")} style={{cursor: "pointer"}}>No d'employé {getSortIcon("numeroEmploye")}</th>
                    <th onClick={() => toggleSort("prenom")} style={{cursor: "pointer"}}>Prénom {getSortIcon("prenom")}</th>
                    <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom {getSortIcon("nom")}</th>
                    <th onClick={() => toggleSort("courriel")} style={{cursor: "pointer"}}>Courriel {getSortIcon("courriel")}</th>
                    <th onClick={() => toggleSort("role")} style={{cursor: "pointer"}}>Rôle {getSortIcon("role")}</th>
                    <th style={{width: "150px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((enseignant) => {
                    const isHighlighted = highlightId === enseignant.id
                    const isEnseignantAdmin = enseignant.role === 'ADMIN'
                    const canEditThisEnseignant = isAdmin || !isEnseignantAdmin

                    return <tr key={enseignant.id} id={`row-${enseignant.id}`} className={isHighlighted ? "table-warning border border-warning" : ""}>
                        {editingId === enseignant.id ? (
                            <>
                                <td><input className="form-control" value={editData.numeroEmploye} onChange={e => setEditData({...editData, numeroEmploye: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.prenom} onChange={e => setEditData({...editData, prenom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.courriel} onChange={e => setEditData({...editData, courriel: e.target.value})} /></td>
                                <td>
                                    <select 
                                        className="form-select" 
                                        value={editData.role || "ENSEIGNANT"} 
                                        onChange={e => setEditData({...editData, role: e.target.value as any})}
                                    >
                                        <option value="ENSEIGNANT">Enseignant</option>
                                        <option value="COORDONNATEUR">Coordonnateur</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant.numeroEmploye}</td>
                                <td>{enseignant.prenom}</td>
                                <td>{enseignant.nom}</td>
                                <td>{enseignant.courriel}</td>
                                <td>
                                    <span className={`badge ${enseignant.role === 'ADMIN' ? 'bg-danger' : enseignant.role === 'COORDONNATEUR' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {enseignant.role || "ENSEIGNANT"}
                                    </span>
                                </td>
                                <td>
                                    {(!isAdmin && isEnseignantAdmin) ? (
                                        <span className="text-muted small italic">Lecture seule</span>
                                    ) : (
                                        <>
                                            {(!enseignant.authUid && !isEnseignantAdmin) && (
                                                <button type="button" className="btn btn-outline-info btn-sm me-1" onClick={() => { setSelectedEnseignant(enseignant); setIsModalOpen(true); }} title="Créer un accès">🔑</button>
                                            )}
                                            <button type="button" className="btn btn-outline-warning btn-sm me-1" onClick={() => router.push(`/admin/enseignants/${enseignant.id}/preferences`)} title="Préférences">⭐</button>
                                            <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(enseignant)}>✏️</button>
                                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => deleteItem(enseignant.id)}>🗑️</button>
                                        </>
                                    )}
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Nouveau..." value={newData.numeroEmploye} onChange={e => setNewData({...newData, numeroEmploye: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Prénom" value={newData.prenom} onChange={e => setNewData({...newData, prenom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Courriel" value={newData.courriel} onChange={e => setNewData({...newData, courriel: e.target.value})} /></td>
                    <td>
                        <select 
                            className="form-select" 
                            value={newData.role || "ENSEIGNANT"} 
                            onChange={e => setNewData({...newData, role: e.target.value as any})}
                        >
                            <option value="ENSEIGNANT">Enseignant</option>
                            <option value="COORDONNATEUR">Coordonnateur</option>
                        </select>
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>


        <CreateAccountModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setSelectedEnseignant(null); }} 
            enseignant={selectedEnseignant} 
            currentUserToken={token}
            departementId={user?.departementId}
        />
    </div>
}

export default function EnseignantsPage() {
    return (
        <Suspense fallback={(
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )}>
            <EnseignantsPageContent />
        </Suspense>
    )
}
