'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function(){
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const router = useRouter()
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ numeroEmploye: "", prenom: "", nom: "", courriel: "" })

    function startEdit(enseignant: any) {
        setEditingId(enseignant.id)
        setEditData({ ...enseignant })
    }

    async function saveEdit() {
        if (editingId) {
            await db.enseignants.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.numeroEmploye && newData.nom) {
            await db.enseignants.add(newData)
            setNewData({ numeroEmploye: "", prenom: "", nom: "", courriel: "" })
        } else {
            alert("Le numéro d'employé et le nom sont requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>No d'employé</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Courriel</th>
                    <th style={{width: "150px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(enseignants ?? []).map((enseignant) => (
                    <tr key={enseignant.id}>
                        {editingId === enseignant.id ? (
                            <>
                                <td><input className="form-control" value={editData.numeroEmploye} onChange={e => setEditData({...editData, numeroEmploye: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.prenom} onChange={e => setEditData({...editData, prenom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.courriel} onChange={e => setEditData({...editData, courriel: e.target.value})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant.numeroEmploye}</td>
                                <td>{enseignant.prenom}</td>
                                <td>{enseignant.nom}</td>
                                <td>{enseignant.courriel}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(enseignant)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.enseignants.delete(enseignant.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Nouveau..." value={newData.numeroEmploye} onChange={e => setNewData({...newData, numeroEmploye: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Prénom" value={newData.prenom} onChange={e => setNewData({...newData, prenom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Courriel" value={newData.courriel} onChange={e => setNewData({...newData, courriel: e.target.value})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}