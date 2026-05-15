'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"

export default function(){
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ code: "", description: "", quantite: 0 })

    function startEdit(allocation: any) {
        setEditingId(allocation.id)
        setEditData({ ...allocation })
    }

    async function saveEdit() {
        if (editingId) {
            await db.allocations.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.code && newData.description) {
            await db.allocations.add({ ...newData, session })
            setNewData({ code: "", description: "", quantite: 0 })
        } else {
            alert("Le code et la description sont requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Quantité (ETC)</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(allocations ?? []).filter(a => a.session === session).map((allocation) => (
                    <tr key={allocation.id}>
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
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.allocations.delete(allocation.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
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
    </>
}