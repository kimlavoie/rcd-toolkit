'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import { useAuth } from "@/app/utilities/auth"
import type { CIReelle, Enseignant } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"

export default function(){
    const { user, loading } = useAuth()
    const CIReelles = useFirestoreCollection<CIReelle>("CIReelles")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")

    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const enrichedCI = useMemo(() => {
        return (CIReelles ?? []).filter(ci => ci.session === session).map(ci => {
            const ens = enseignants?.find(e => e.id === ci.enseignant)
            return {
                ...ci,
                enseignantNom: ens ? `${ens.prenom} ${ens.nom}` : "",
            }
        })
    }, [CIReelles, enseignants, session])

    const [search, setSearch] = useState("")

    const filteredBySearch = useMemo(() => {
        if (!search) return enrichedCI
        const searchLower = search.toLowerCase()
        return enrichedCI.filter(ci => 
            ci.enseignantNom.toLowerCase().includes(searchLower) ||
            ci.CI.toString().includes(searchLower)
        )
    }, [enrichedCI, search])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredBySearch, "enseignantNom")
    
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: "", CI: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(cireelle: any) {
        setEditingId(cireelle.id)
        setEditData({ ...cireelle })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.CIReelles.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant) {
            await firebaseDb.CIReelles.add({ ...newData, session })
            setNewData({ enseignant: "", CI: 0 })
        } else {
            toast.error("L'enseignant est requis.")
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
                    placeholder="Rechercher par enseignant..." 
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
                    <th onClick={() => toggleSort("enseignantNom")} style={{cursor: "pointer"}}>Enseignant {getSortIcon("enseignantNom")}</th>
                    <th onClick={() => toggleSort("CI")} style={{cursor: "pointer"}}>CI {getSortIcon("CI")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((ci) => {
                    const enseignant = enseignants?.find(e => e.id === ci.enseignant)
                    return <tr key={ci.id}>
                        {editingId === ci.id ? (
                            <>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: val})} />
                                </td>
                                <td>
                                    <input type="number" step="0.01" className="form-control" value={editData.CI} onChange={e => setEditData({...editData, CI: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{ci.CI}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(ci)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.CIReelles.delete(ci.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: val})} />
                    </td>
                    <td>
                        <input type="number" step="0.01" className="form-control" placeholder="CI" value={newData.CI} onChange={e => setNewData({...newData, CI: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}
