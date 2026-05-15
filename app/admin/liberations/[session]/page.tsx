'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import SelectAllocation from "../../components/inputs/SelectAllocation"

export default function(){
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const liberations = useLiveQuery(() => db.liberations.toArray())
    const allocations = useLiveQuery(() => db.allocations.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: 0, allocation: 0, quantite: 0 })

    function startEdit(liberation: any) {
        setEditingId(liberation.id)
        setEditData({ ...liberation })
    }

    async function saveEdit() {
        if (editingId) {
            await db.liberations.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.allocation) {
            await db.liberations.add(newData)
            setNewData({ ...newData, enseignant: 0, quantite: 0 })
        } else {
            alert("L'enseignant et l'allocation sont requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Allocation</th>
                    <th>Enseignant</th>
                    <th>Quantité (ETC)</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(liberations ?? []).filter(l => {
                    const allocation = allocations?.find(a => a.id === l.allocation)
                    return allocation?.session === session
                }).map((liberation) => {
                    const allocation = allocations?.find((a) => a.id == liberation.allocation)
                    const enseignant = enseignants?.find((e) => e.id == liberation.enseignant)
                    
                    return <tr key={liberation.id}>
                        {editingId === liberation.id ? (
                            <>
                                <td>
                                    <SelectAllocation value={editData.allocation} session={session} onChange={(val:any) => setEditData({...editData, allocation: Number(val)})} />
                                </td>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: Number(val)})} />
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
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.liberations.delete(liberation.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectAllocation value={newData.allocation} session={session} onChange={(val:any) => setNewData({...newData, allocation: Number(val)})} />
                    </td>
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: Number(val)})} />
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
    </>
}