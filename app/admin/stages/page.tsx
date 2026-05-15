'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectSession from "../components/inputs/SelectSession"

export default function(){
    const stages = useLiveQuery(() => db.stages.toArray())
    const router = useRouter()
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ session: "A26", ETCparStagiaire: 0, nbStagiaires: 0 })

    function startEdit(stage: any) {
        setEditingId(stage.id)
        setEditData({ ...stage })
    }

    async function saveEdit() {
        if (editingId) {
            await db.stages.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.session) {
            await db.stages.add(newData)
            // Default to next session or reset
            setNewData({ ...newData, nbStagiaires: 0 })
        } else {
            alert("La session est requise.")
        }
    }

    function formatSession(code: string) {
        try {
            const {saison, annee} = extractSessionInfos(code)
            return `${saison} ${annee}`
        } catch {
            return code
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Session</th>
                    <th>ETC par stagiaire</th>
                    <th>Nombre de stagiaires</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(stages ?? []).map((stage) => (
                    <tr key={stage.id}>
                        {editingId === stage.id ? (
                            <>
                                <td>
                                    <SelectSession code={editData.session} onChange={(val:any) => setEditData({...editData, session: val})} />
                                </td>
                                <td>
                                    <input type="number" step="0.001" className="form-control" value={editData.ETCparStagiaire} onChange={e => setEditData({...editData, ETCparStagiaire: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" value={editData.nbStagiaires} onChange={e => setEditData({...editData, nbStagiaires: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{formatSession(stage.session)}</td>
                                <td>{stage.ETCparStagiaire}</td>
                                <td>{stage.nbStagiaires}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(stage)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.stages.delete(stage.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td>
                        <SelectSession code={newData.session} onChange={(val:any) => setNewData({...newData, session: val})} />
                    </td>
                    <td>
                        <input type="number" step="0.001" className="form-control" placeholder="ETC/Stagiaire" value={newData.ETCparStagiaire} onChange={e => setNewData({...newData, ETCparStagiaire: Number(e.target.value)})} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Nb Stagiaires" value={newData.nbStagiaires} onChange={e => setNewData({...newData, nbStagiaires: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}