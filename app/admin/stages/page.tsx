'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectSession from "../components/inputs/SelectSession"
import { useAuth } from "@/app/utilities/auth"
import type { Stage } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"

export default function(){
    const { user, loading } = useAuth()
    const stages = useFirestoreCollection<Stage>("stages")
    const router = useRouter()
    
    const { sortedData, toggleSort, getSortIcon } = useTableSort(stages, "session")

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ session: "A26", ETCparStagiaire: 0, nbStagiaires: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(stage: any) {
        setEditingId(stage.id)
        setEditData({ ...stage })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.stages.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.session) {
            await firebaseDb.stages.add(newData)
            setNewData({ ...newData, nbStagiaires: 0 })
        } else {
            toast.error("La session est requise.")
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

    return <div className="container mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill mb-4 w-25" onClick={() => router.push(".")}>← Retour</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("session")} style={{cursor: "pointer"}}>Session {getSortIcon("session")}</th>
                    <th onClick={() => toggleSort("ETCparStagiaire")} style={{cursor: "pointer"}}>ETC par stagiaire {getSortIcon("ETCparStagiaire")}</th>
                    <th onClick={() => toggleSort("nbStagiaires")} style={{cursor: "pointer"}}>Nombre de stagiaires {getSortIcon("nbStagiaires")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((stage) => (
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
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.stages.delete(stage.id)}>🗑️</button>
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
    </div>
}
