'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import SelectAllocation from "../../components/inputs/SelectAllocation"
import { useAuth } from "@/app/utilities/auth"
import type { Liberation, Enseignant, Allocation } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import toast from "react-hot-toast"

export default function(){
    const { user, loading } = useAuth()
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const liberations = useFirestoreCollection<Liberation>("liberations")
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    const enrichedLiberations = useMemo(() => {
        return (liberations ?? []).filter(l => {
            const allocation = allocations?.find(a => a.id === l.allocation)
            return allocation?.session === session
        }).map(l => {
            const alloc = allocations?.find(a => a.id === l.allocation)
            const ens = enseignants?.find(e => e.id === l.enseignant)
            return {
                ...l,
                allocationNom: alloc ? `${alloc.code} - ${alloc.description}` : "",
                enseignantNom: ens ? `${ens.prenom} ${ens.nom}` : "",
            }
        })
    }, [liberations, allocations, enseignants, session])

    const [search, setSearch] = useState("")

    const filteredBySearch = useMemo(() => {
        if (!search) return enrichedLiberations
        const searchLower = search.toLowerCase()
        return enrichedLiberations.filter(l => 
            l.allocationNom.toLowerCase().includes(searchLower) ||
            l.enseignantNom.toLowerCase().includes(searchLower) ||
            l.quantite.toString().includes(searchLower)
        )
    }, [enrichedLiberations, search])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredBySearch, "allocationNom")
    
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: "", allocation: "", quantite: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(liberation: any) {
        setEditingId(liberation.id)
        setEditData({ ...liberation })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.liberations.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.allocation) {
            await firebaseDb.liberations.add(newData)
            setNewData({ ...newData, enseignant: "", quantite: 0 })
        } else {
            toast.error("L'enseignant et l'allocation sont requis.")
        }
    }

    return <div className="container mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">{saison} {annee}</h1>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Rechercher par allocation ou enseignant..." 
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
                    <th onClick={() => toggleSort("allocationNom")} style={{cursor: "pointer"}}>Allocation {getSortIcon("allocationNom")}</th>
                    <th onClick={() => toggleSort("enseignantNom")} style={{cursor: "pointer"}}>Enseignant {getSortIcon("enseignantNom")}</th>
                    <th onClick={() => toggleSort("quantite")} style={{cursor: "pointer"}}>Quantité (ETC) {getSortIcon("quantite")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((liberation) => {
                    const allocation = allocations?.find((a) => a.id == liberation.allocation)
                    const enseignant = enseignants?.find((e) => e.id == liberation.enseignant)
                    
                    return <tr key={liberation.id}>
                        {editingId === liberation.id ? (
                            <>
                                <td>
                                    <SelectAllocation value={editData.allocation} session={session} onChange={(val:any) => setEditData({...editData, allocation: val})} />
                                </td>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: val})} />
                                </td>
                                <td>
                                    <input type="number" step="0.001" className="form-control" value={editData.quantite} onChange={e => setEditData({...editData, quantite: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{allocation?.code} - {allocation?.description} ({allocation?.quantite})</td>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{liberation.quantite}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(liberation)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.liberations.delete(liberation.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectAllocation value={newData.allocation} session={session} onChange={(val:any) => setNewData({...newData, allocation: val})} />
                    </td>
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: val})} />
                    </td>
                    <td>
                        <input type="number" step="0.001" className="form-control" placeholder="Qté" value={newData.quantite} onChange={e => setNewData({...newData, quantite: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}
