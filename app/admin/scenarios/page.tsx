'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/app/utilities/auth"
import type { Scenario } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"
import SelectSession from "../components/inputs/SelectSession"

export default function ScenariosPage() {
    const { user, loading } = useAuth()
    const scenarios = useFirestoreCollection<Scenario>("scenarios")
    const router = useRouter()
    
    const { sortedData, toggleSort, getSortIcon } = useTableSort(scenarios, "session")

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ nom: "", session: "A26", notes: "", isDefault: false })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(scenario: any) {
        setEditingId(scenario.id)
        setEditData({ ...scenario })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.scenarios.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.nom && newData.session) {
            await firebaseDb.scenarios.add(newData)
            setNewData({ nom: "", session: "A26", notes: "", isDefault: false })
        } else {
            toast.error("Le nom et la session sont requis.")
        }
    }

    async function toggleDefault(scenario: Scenario) {
        // Unset other defaults for the same session
        const others = scenarios?.filter(s => s.session === scenario.session && s.id !== scenario.id && s.isDefault)
        if (others) {
            for (const other of others) {
                await firebaseDb.scenarios.update(other.id, { isDefault: false })
            }
        }
        await firebaseDb.scenarios.update(scenario.id, { isDefault: !scenario.isDefault })
    }

    return <div className="container mt-3">
        <h2 className="mb-4 text-primary">Gestion des Scénarios</h2>
        <div className="card shadow-sm p-4">
            <table className="table table-striped align-middle">
                <thead>
                    <tr>
                        <th onClick={() => toggleSort("session")} style={{cursor: "pointer"}}>Session {getSortIcon("session")}</th>
                        <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom du scénario {getSortIcon("nom")}</th>
                        <th>Notes</th>
                        <th style={{width: "100px"}}>Défaut</th>
                        <th style={{width: "150px"}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((scenario) => (
                        <tr key={scenario.id}>
                            {editingId === scenario.id ? (
                                <>
                                    <td><SelectSession code={editData.session} onChange={val => setEditData({...editData, session: val})} /></td>
                                    <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                    <td><input className="form-control" value={editData.notes || ""} onChange={e => setEditData({...editData, notes: e.target.value})} /></td>
                                    <td className="text-center">
                                        <input type="checkbox" checked={editData.isDefault} onChange={e => setEditData({...editData, isDefault: e.target.checked})} />
                                    </td>
                                    <td>
                                        <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{scenario.session}</td>
                                    <td>{scenario.nom}</td>
                                    <td>{scenario.notes}</td>
                                    <td className="text-center">
                                        <button 
                                            className={`btn btn-sm ${scenario.isDefault ? 'btn-warning' : 'btn-outline-secondary'}`}
                                            onClick={() => toggleDefault(scenario)}
                                            title="Définir comme scénario par défaut pour cette session"
                                        >
                                            {scenario.isDefault ? '⭐' : '☆'}
                                        </button>
                                    </td>
                                    <td>
                                        <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(scenario)}>✏️</button>
                                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.scenarios.delete(scenario.id)}>🗑️</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    <tr className="table-info">
                        <td><SelectSession code={newData.session} onChange={val => setNewData({...newData, session: val})} /></td>
                        <td><input className="form-control" placeholder="Nom..." value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                        <td><input className="form-control" placeholder="Notes..." value={newData.notes} onChange={e => setNewData({...newData, notes: e.target.value})} /></td>
                        <td className="text-center">
                            <input type="checkbox" checked={newData.isDefault} onChange={e => setNewData({...newData, isDefault: e.target.checked})} />
                        </td>
                        <td>
                            <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
}
