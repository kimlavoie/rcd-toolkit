'use client'

import { useGenericAdmin } from "@/app/admin/components/useGenericAdmin"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import { useAuth } from "@/app/utilities/auth"
import type { Allocation } from "@/app/db/db"
import { toast } from "react-hot-toast"

import { DeletionService } from "@/app/utilities/deletionService"
import Skeleton from "@/app/utilities/Skeleton";


function AllocationsPageContent(){
    const { user, loading } = useAuth()
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get("highlight")

    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const {
        search, setSearch, sortedData, toggleSort, getSortIcon,
        editingId, editData, setEditData, newData, setNewData,
        startEdit, cancelEdit, saveEdit, addNew, deleteItem
    } = useGenericAdmin<Allocation>({
        collectionName: "allocations",
        initialSortKey: "code",
        filterFn: (a, search) => {
            if (a.session !== session) return false
            if (!search) return true
            const s = search.toLowerCase()
            return (a.code ?? "").toLowerCase().includes(s) || 
                   (a.description ?? "").toLowerCase().includes(s)
        },
        defaultNewData: { code: "", description: "", quantite: 0 },
        onBeforeAdd: (data) => {
            if (!data.code || !data.description) {
                toast.error("Le code et la description sont requis.")
                return false
            }
            data.session = session
        },
        onDelete: DeletionService.deleteAllocation
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

    return <div className="container mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">{saison} {annee}</h1>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Rechercher par code ou description..." 
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
                                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{allocation.code}</td>
                                <td>{allocation.description}</td>
                                <td>{allocation.quantite}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(allocation)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => deleteItem(allocation.id)}>🗑️</button>
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
        <Suspense fallback={(
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )}>
            <AllocationsPageContent />
        </Suspense>
    )
}
