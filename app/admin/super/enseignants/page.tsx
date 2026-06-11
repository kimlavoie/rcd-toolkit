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
            return (e.nom ?? "").toLowerCase().includes(s) || 
                   (e.prenom ?? "").toLowerCase().includes(s) ||
                   (e.numeroEmploye ?? "").toLowerCase().includes(s)
        },
        defaultNewData: { 
            numeroEmploye: "", 
            prenom: "", 
            nom: "", 
            courriel: "", 
            isAdmin: false,
            departements: {} 
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
            } else if (result.isReused) {
                toast.success("Utilisateur existant mis à jour avec ces nouveaux rôles.")
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

    const toggleDepartment = (dataObj: Partial<Enseignant>, deptId: string, setData: Function) => {
        const newDepts = { ...(dataObj.departements || {}) };
        if (newDepts[deptId]) {
            delete newDepts[deptId];
        } else {
            newDepts[deptId] = 'ENSEIGNANT';
        }
        setData({ ...dataObj, departements: newDepts });
    };

    const changeDeptRole = (dataObj: Partial<Enseignant>, deptId: string, role: string, setData: Function) => {
        const newDepts = { ...(dataObj.departements || {}) };
        if (newDepts[deptId]) {
             newDepts[deptId] = role as any;
             setData({ ...dataObj, departements: newDepts });
        }
    }

    const renderDeptSelector = (dataObj: Partial<Enseignant>, setData: Function) => {
        return (
            <div className="border p-2 rounded bg-white" style={{maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem'}}>
                {departements?.map(dept => {
                    const isSelected = !!dataObj.departements?.[dept.id];
                    return (
                        <div key={dept.id} className="d-flex align-items-center justify-content-between mb-1">
                            <label className="d-flex align-items-center gap-2 mb-0 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => toggleDepartment(dataObj, dept.id, setData)} 
                                />
                                <span className={isSelected ? "fw-bold" : ""}>{dept.nom}</span>
                            </label>
                            {isSelected && (
                                <select 
                                    className="form-select form-select-sm w-auto py-0 px-1" 
                                    style={{fontSize: '0.75rem', height: '22px'}}
                                    value={dataObj.departements?.[dept.id]}
                                    onChange={(e) => changeDeptRole(dataObj, dept.id, e.target.value, setData)}
                                >
                                    <option value="ENSEIGNANT">Ens.</option>
                                    <option value="COORDONNATEUR">Coord.</option>
                                </select>
                            )}
                        </div>
                    )
                })}
            </div>
        )
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
                        placeholder="Rechercher par nom, courriel..." 
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
                                <th onClick={() => toggleSort("numeroEmploye")} style={{cursor: "pointer"}}>No Emp. {getSortIcon("numeroEmploye")}</th>
                                <th onClick={() => toggleSort("prenom")} style={{cursor: "pointer"}}>Nom complet {getSortIcon("prenom")}</th>
                                <th onClick={() => toggleSort("courriel")} style={{cursor: "pointer"}}>Courriel {getSortIcon("courriel")}</th>
                                <th style={{width: "250px"}}>Départements & Rôles</th>
                                <th onClick={() => toggleSort("isAdmin")} style={{cursor: "pointer", width: "100px"}}>Super Admin {getSortIcon("isAdmin")}</th>
                                <th style={{width: "100px"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((enseignant) => {
                                const isHighlighted = highlightId === enseignant.id
                                return <tr key={enseignant.id} id={`row-${enseignant.id}`} className={isHighlighted ? "table-warning" : ""}>
                                    {editingId === enseignant.id ? (
                                        <>
                                            <td><input className="form-control form-control-sm" value={editData.numeroEmploye} onChange={e => setEditData({...editData, numeroEmploye: e.target.value})} /></td>
                                            <td>
                                                <input className="form-control form-control-sm mb-1" placeholder="Prénom" value={editData.prenom} onChange={e => setEditData({...editData, prenom: e.target.value})} />
                                                <input className="form-control form-control-sm" placeholder="Nom" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} />
                                            </td>
                                            <td><input className="form-control form-control-sm" value={editData.courriel} onChange={e => setEditData({...editData, courriel: e.target.value})} /></td>
                                            <td>
                                                {renderDeptSelector(editData, setEditData)}
                                            </td>
                                            <td className="text-center">
                                                <div className="form-check form-switch d-flex justify-content-center">
                                                    <input className="form-check-input" type="checkbox" role="switch" checked={editData.isAdmin || false} onChange={e => setEditData({...editData, isAdmin: e.target.checked})} />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    <button className="btn btn-success btn-sm" onClick={saveEdit}>💾 Sauver</button>
                                                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌ Annuler</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="small">{enseignant.numeroEmploye}</td>
                                            <td className="fw-bold">{enseignant.prenom} {enseignant.nom}</td>
                                            <td className="small">{enseignant.courriel}</td>
                                            <td>
                                                {enseignant.departements && Object.keys(enseignant.departements).length > 0 ? (
                                                    <ul className="list-unstyled mb-0 small">
                                                        {Object.entries(enseignant.departements).map(([deptId, role]) => (
                                                            <li key={deptId}>
                                                                <span className="fw-bold">{departements?.find(d => d.id === deptId)?.nom || deptId}:</span> 
                                                                <span className="ms-1 text-muted">{role === 'COORDONNATEUR' ? 'Coord.' : 'Ens.'}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-muted small italic">Aucun département</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {enseignant.isAdmin ? <span className="badge bg-danger">ADMIN</span> : <span className="text-muted">-</span>}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => startEdit(enseignant)}>✏️ Éditer</button>
                                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => deleteItem(enseignant.id)}>🗑️ Supprimer</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            })}
                            <tr className="table-info">
                                <td><input className="form-control form-control-sm" placeholder="No..." value={newData.numeroEmploye} onChange={e => setNewData({...newData, numeroEmploye: e.target.value})} /></td>
                                <td>
                                    <input className="form-control form-control-sm mb-1" placeholder="Prénom" value={newData.prenom} onChange={e => setNewData({...newData, prenom: e.target.value})} />
                                    <input className="form-control form-control-sm" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} />
                                </td>
                                <td><input className="form-control form-control-sm" placeholder="Courriel" value={newData.courriel} onChange={e => setNewData({...newData, courriel: e.target.value})} /></td>
                                <td>
                                    {renderDeptSelector(newData, setNewData)}
                                </td>
                                <td className="text-center">
                                    <div className="form-check form-switch d-flex justify-content-center">
                                        <input className="form-check-input" type="checkbox" role="switch" checked={newData.isAdmin || false} onChange={e => setNewData({...newData, isAdmin: e.target.checked})} />
                                    </div>
                                </td>
                                <td>
                                    <button className="btn btn-primary btn-sm w-100 h-100" onClick={addNew}>+</button>
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
