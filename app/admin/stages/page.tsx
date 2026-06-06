'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState, useMemo, Suspense } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectSession from "../components/inputs/SelectSession"
import { useAuth } from "@/app/utilities/auth"
import type { Stage } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import toast from "react-hot-toast"

function StagesPageContent() {
    const { user, loading } = useAuth()
    const stages = useFirestoreCollection<Stage>("stages")
    const router = useRouter()
    
    const [search, setSearch] = useState("")

    const filteredBySearch = useMemo(() => {
        if (!search) return stages || []
        const searchLower = search.toLowerCase()
        return (stages ?? []).filter(s => {
            const sessionLabel = formatSession(s.session).toLowerCase()
            return (
                sessionLabel.includes(searchLower) ||
                s.nom.toLowerCase().includes(searchLower) ||
                s.session.toLowerCase().includes(searchLower) ||
                s.CIparStagiaire.toString().includes(searchLower) ||
                s.nbStagiaires.toString().includes(searchLower)
            )
        })
    }, [stages, search])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(filteredBySearch, "session")

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ session: "A26", nom: "", CIparStagiaire: 0, nbStagiaires: 0, pourcentageCoordination: 0 })

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
        if (newData.session && newData.nom) {
            await firebaseDb.stages.add(newData)
            setNewData({ ...newData, nom: "", nbStagiaires: 0 })
        } else {
            toast.error("La session et le nom sont requis.")
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
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Gestion des stages</h1>
            <div className="input-group input-group-sm w-auto shadow-sm" style={{maxWidth: "300px"}}>
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Rechercher..." 
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
                    <th onClick={() => toggleSort("session")} style={{cursor: "pointer"}}>Session {getSortIcon("session")}</th>
                    <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom du stage {getSortIcon("nom")}</th>
                    <th onClick={() => toggleSort("CIparStagiaire")} style={{cursor: "pointer"}}>CI par stagiaire {getSortIcon("CIparStagiaire")}</th>
                    <th onClick={() => toggleSort("nbStagiaires")} style={{cursor: "pointer"}}>Nombre total d'étudiants {getSortIcon("nbStagiaires")}</th>
                    <th onClick={() => toggleSort("pourcentageCoordination")} style={{cursor: "pointer"}}>Coordination (%) {getSortIcon("pourcentageCoordination")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((stage) => (
                    <tr key={stage.id}>
                        {editingId === stage.id ? (
                            <>
                                <td><SelectSession code={editData.session} onChange={(val:any) => setEditData({...editData, session: val})} /></td>
                                <td><input type="text" className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td><input type="number" step="0.0001" className="form-control" value={editData.CIparStagiaire} onChange={e => setEditData({...editData, CIparStagiaire: Number(e.target.value)})} /></td>
                                <td><input type="number" className="form-control" value={editData.nbStagiaires} onChange={e => setEditData({...editData, nbStagiaires: Number(e.target.value)})} /></td>
                                <td><input type="number" min="0" max="100" className="form-control" value={editData.pourcentageCoordination} onChange={e => setEditData({...editData, pourcentageCoordination: Number(e.target.value)})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{formatSession(stage.session)}</td>
                                <td>{stage.nom}</td>
                                <td>{stage.CIparStagiaire?.toFixed(4)}</td>
                                <td>{stage.nbStagiaires}</td>
                                <td>{stage.pourcentageCoordination ?? 0}%</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(stage)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.stages.delete(stage.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td><SelectSession code={newData.session} onChange={(val:any) => setNewData({...newData, session: val})} /></td>
                    <td><input type="text" className="form-control" placeholder="Nom du stage" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td><input type="number" step="0.0001" className="form-control" placeholder="CI/Stagiaire" value={newData.CIparStagiaire} onChange={e => setNewData({...newData, CIparStagiaire: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Total Étud." value={newData.nbStagiaires} onChange={e => setNewData({...newData, nbStagiaires: Number(e.target.value)})} /></td>
                    <td><input type="number" min="0" max="100" className="form-control" placeholder="Coord %" value={newData.pourcentageCoordination} onChange={e => setNewData({...newData, pourcentageCoordination: Number(e.target.value)})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function StagesPage() {
    return (
        <Suspense fallback={<div className="container mt-5">Chargement...</div>}>
            <StagesPageContent />
        </Suspense>
    )
}
