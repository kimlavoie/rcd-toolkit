'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useAuth } from "@/app/utilities/auth"
import type { Allocation } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"

function AllocationsPageContent(){
    const { user, loading } = useAuth()
    const allocations = useFirestoreCollection<Allocation>("allocations")
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")

    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const filteredAllocations = (allocations ?? []).filter(a => a.session === session)
    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredAllocations, "code")
    
    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`row-${highlightId}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }, [highlightId, sortedData])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ code: "", description: "", quantite: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(allocation: any) {
        setEditingId(allocation.id)
        setEditData({ ...allocation })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.allocations.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.code && newData.description) {
            await firebaseDb.allocations.add({ ...newData, session })
            setNewData({ code: "", description: "", quantite: 0 })
        } else {
            alert("Le code et la description sont requis.")
        }
    }

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push(".")}>← Retour</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("code")} style={{cursor: "pointer"}}>Code {getSortIcon("code")}</th>
                    <th onClick={() => toggleSort("description")} style={{cursor: "pointer"}}>Description {getSortIcon("description")}</th>
                    <th onClick={() => toggleSort("quantite")} style={{cursor: "pointer"}}>Quantité (ETC) {getSortIcon("quantite")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((allocation) => {
                    const isHighlighted = highlightId === allocation.id
                    return <tr key={allocation.id} id={`row-${allocation.id}`} className={isHighlighted ? "table-warning border border-warning" : ""}>
                        {editingId === allocation.id ? (
                            <>
                                <td><input className="form-control" value={editData.code} onChange={e => setEditData({...editData, code: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} /></td>
                                <td><input type="number" step="0.001" className="form-control" value={editData.quantite} onChange={e => setEditData({...editData, quantite: Number(e.target.value)})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{allocation.code}</td>
                                <td>{allocation.description}</td>
                                <td>{allocation.quantite}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(allocation)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.allocations.delete(allocation.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Code" value={newData.code} onChange={e => setNewData({...newData, code: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Description" value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} /></td>
                    <td><input type="number" step="0.001" className="form-control" placeholder="Qté" value={newData.quantite} onChange={e => setNewData({...newData, quantite: Number(e.target.value)})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function AllocationsPage() {
    return (
        <Suspense fallback={<div className="container mt-5">Chargement...</div>}>
            <AllocationsPageContent />
        </Suspense>
    )
}