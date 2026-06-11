'use client'

import { useGenericAdmin } from "@/app/admin/components/useGenericAdmin"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense, useState, useMemo } from "react"
import { useAuth } from "@/app/utilities/auth"
import type { Enseignant, Departement } from "@/app/db/db"
import { toast } from "react-hot-toast"

import { DeletionService } from "@/app/utilities/deletionService"
import Skeleton from "@/app/utilities/Skeleton";
import CreateAccountModal from "@/app/admin/enseignants/CreateAccountModal"
import SelectDepartement from "@/app/admin/components/inputs/SelectDepartement"
import { useFirestoreCollection } from "@/app/utilities/firebaseDb"
import Link from "next/link"

function SuperEnseignantsPageContent(){
    const { user, loading, refreshUser } = useAuth()
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

    const {
        search, setSearch, sortedData, toggleSort, getSortIcon,
        editingId, editData, setEditData, newData, setNewData,
        startEdit, cancelEdit, saveEdit, addNew, deleteItem
    } = useGenericAdmin<Enseignant>({
        collectionName: "enseignants",
        initialSortKey: "nom",
        filterFn: (e, search) => {
            const s = search.toLowerCase()
            const deptName = departements?.find(d => d.id === e.departementId)?.nom || ""
            return (e.nom ?? "").toLowerCase().includes(s) || 
                   (e.prenom ?? "").toLowerCase().includes(s) ||
                   (e.numeroEmploye ?? "").toLowerCase().includes(s) ||
                   deptName.toLowerCase().includes(s)
        },
        defaultNewData: { 
            numeroEmploye: "", 
            prenom: "", 
            nom: "", 
            courriel: "", 
            role: "ENSEIGNANT",
            departementId: "" 
        },
        onBeforeAdd: (data) => {
            if (!data.nom || !data.prenom || !data.courriel) {
                toast.error("Le nom, le prénom et le courriel sont requis.")
                return false
            }
        },
        onAdd: async (data) => {
            const res = await fetch('/api/admin/enseignants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            
            if (result.tempPassword) {
                toast.success(`Utilisateur et compte créés ! Mot de passe : ${result.tempPassword}`, { duration: 10000 })
            } else {
                toast.success("Utilisateur ajouté")
            }
            return result
        },
        onSave: async (id, data) => {
            const res = await fetch('/api/admin/enseignants', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...data, id })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            
            if (user?.email === data.courriel) {
                await refreshUser();
                toast.success("Votre profil et vos permissions ont été mis à jour.")
            }

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
    
    if (!user || user.role !== 'ADMIN') {
        router.push("/admin")
        return null
    }

    return (
        <div className="container mt-3">
             <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/admin">Administration</Link></li>
                    <li className="breadcrumb-item"><Link href="/admin/super">Super Admin</Link></li>
                    <li className="breadcrumb-item active">Gestion des Utilisateurs</li>
                </ol>
            </nav>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Gestion globale des utilisateurs</h1>
                <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                    <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                    <input 
                        type="text" 
                        className="form-control border-start-0 ps-0" 
                        placeholder="Rechercher par nom, département..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                    {search && (
                        <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>✕</button>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th onClick={() => toggleSort("numeroEmploye")} style={{cursor: "pointer"}}>No d'employé {getSortIcon("numeroEmploye")}</th>
                                <th onClick={() => toggleSort("prenom")} style={{cursor: "pointer"}}>Prénom {getSortIcon("prenom")}</th>
                                <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom {getSortIcon("nom")}</th>
                                <th onClick={() => toggleSort("courriel")} style={{cursor: "pointer"}}>Courriel {getSortIcon("courriel")}</th>
                                <th onClick={() => toggleSort("departementId")} style={{cursor: "pointer"}}>Département {getSortIcon("departementId")}</th>
                                <th onClick={() => toggleSort("role")} style={{cursor: "pointer"}}>Rôle {getSortIcon("role")}</th>
                                <th style={{width: "120px"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((enseignant) => {
                                const isHighlighted = highlightId === enseignant.id
                                return <tr key={enseignant.id} id={`row-${enseignant.id}`} className={isHighlighted ? "table-warning" : ""}>
                                    {editingId === enseignant.id ? (
                                        <>
                                            <td><input className="form-control form-control-sm" value={editData.numeroEmploye} onChange={e => setEditData({...editData, numeroEmploye: e.target.value})} /></td>
                                            <td><input className="form-control form-control-sm" value={editData.prenom} onChange={e => setEditData({...editData, prenom: e.target.value})} /></td>
                                            <td><input className="form-control form-control-sm" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                            <td><input className="form-control form-control-sm" value={editData.courriel} onChange={e => setEditData({...editData, courriel: e.target.value})} /></td>
                                            <td>
                                                <SelectDepartement 
                                                    value={editData.departementId || ""} 
                                                    onChange={val => setEditData({...editData, departementId: val})} 
                                                />
                                            </td>
                                            <td>
                                                <select 
                                                    className="form-select form-select-sm" 
                                                    value={editData.role || "ENSEIGNANT"} 
                                                    onChange={e => setEditData({...editData, role: e.target.value as any})}
                                                >
                                                    <option value="ENSEIGNANT">Enseignant</option>
                                                    <option value="COORDONNATEUR">Coordonnateur</option>
                                                    <option value="ADMIN">Admin</option>
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
                                            <td className="small text-muted">{departements?.find(d => d.id === enseignant.departementId)?.nom || "-"}</td>
                                            <td>
                                                <span className={`badge ${enseignant.role === 'ADMIN' ? 'bg-danger' : enseignant.role === 'COORDONNATEUR' ? 'bg-primary' : 'bg-secondary'}`}>
                                                    {enseignant.role || "ENSEIGNANT"}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(enseignant)}>✏️</button>
                                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => deleteItem(enseignant.id)}>🗑️</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            })}
                            <tr className="table-info">
                                <td><input className="form-control form-control-sm" placeholder="No..." value={newData.numeroEmploye} onChange={e => setNewData({...newData, numeroEmploye: e.target.value})} /></td>
                                <td><input className="form-control form-control-sm" placeholder="Prénom" value={newData.prenom} onChange={e => setNewData({...newData, prenom: e.target.value})} /></td>
                                <td><input className="form-control form-control-sm" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                                <td><input className="form-control form-control-sm" placeholder="Courriel" value={newData.courriel} onChange={e => setNewData({...newData, courriel: e.target.value})} /></td>
                                <td>
                                    <SelectDepartement 
                                        value={newData.departementId || ""} 
                                        onChange={val => setNewData({...newData, departementId: val})} 
                                    />
                                </td>
                                <td>
                                    <select 
                                        className="form-select form-select-sm" 
                                        value={newData.role || "ENSEIGNANT"} 
                                        onChange={e => setNewData({...newData, role: e.target.value as any})}
                                    >
                                        <option value="ENSEIGNANT">Enseignant</option>
                                        <option value="COORDONNATEUR">Coordonnateur</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default function SuperEnseignantsPage() {
    return (
        <Suspense fallback={<div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <SuperEnseignantsPageContent />
        </Suspense>
    )
}
