'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState, Suspense, useCallback } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectSession from "../components/inputs/SelectSession"
import { useAuth } from "@/app/utilities/auth"
import type { Stage } from "@/app/db/db"
import toast from "react-hot-toast"
import { useAdminTable } from "../components/useAdminTable"
import AdminHeader from "../components/AdminHeader"

function StagesPageContent() {
    const { user, loading } = useAuth()
    const stages = useFirestoreCollection<Stage>("stages")
    const router = useRouter()

    const filterFn = useCallback((s: Stage, search: string) => {
        const searchLower = search.toLowerCase()
        const sessionLabel = formatSession(s.session).toLowerCase()
        return (
            sessionLabel.includes(searchLower) ||
            (s.nom || "").toLowerCase().includes(searchLower) ||
            s.session.toLowerCase().includes(searchLower) ||
            s.CIparStagiaire.toString().includes(searchLower) ||
            s.nbStagiaires.toString().includes(searchLower)
        )
    }, [])

    const { search, setSearch, sortedData, toggleSort, getSortIcon } = useAdminTable({
        data: stages,
        initialSortKey: "session",
        filterFn
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ session: "A26", nom: "", CIparStagiaire: 0, nbStagiaires: 0, pourcentageCoordination: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) { router.push("/login"); return null; }

    function formatSession(code: string) {
        try {
            const {saison, annee} = extractSessionInfos(code)
            return `${saison} ${annee}`
        } catch { return code }
    }

    return <div className="container mt-3">
        <AdminHeader title="Gestion des stages" search={search} setSearch={setSearch} />
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("session")} style={{cursor: "pointer"}}>Session {getSortIcon("session")}</th>
                    <th onClick={() => toggleSort("nom")} style={{cursor: "pointer"}}>Nom {getSortIcon("nom")}</th>
                    <th onClick={() => toggleSort("CIparStagiaire")} style={{cursor: "pointer"}}>CI/Stagiaire {getSortIcon("CIparStagiaire")}</th>
                    <th onClick={() => toggleSort("nbStagiaires")} style={{cursor: "pointer"}}>Nb Étud. {getSortIcon("nbStagiaires")}</th>
                    <th onClick={() => toggleSort("pourcentageCoordination")} style={{cursor: "pointer"}}>Coord % {getSortIcon("pourcentageCoordination")}</th>
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
                                    <button className="btn btn-success btn-sm me-1" onClick={async () => { await firebaseDb.stages.update(editingId, editData); setEditingId(null); }}>💾</button>
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
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => { setEditingId(stage.id); setEditData({...stage}); }}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.stages.delete(stage.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td><SelectSession code={newData.session} onChange={(val:any) => setNewData({...newData, session: val})} /></td>
                    <td><input type="text" className="form-control" placeholder="Nom" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td><input type="number" step="0.0001" className="form-control" placeholder="CI/Stag" value={newData.CIparStagiaire} onChange={e => setNewData({...newData, CIparStagiaire: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Total" value={newData.nbStagiaires} onChange={e => setNewData({...newData, nbStagiaires: Number(e.target.value)})} /></td>
                    <td><input type="number" min="0" max="100" className="form-control" placeholder="%" value={newData.pourcentageCoordination} onChange={e => setNewData({...newData, pourcentageCoordination: Number(e.target.value)})} /></td>
                    <td><button className="btn btn-primary btn-sm w-100" onClick={async () => { if(newData.nom) { await firebaseDb.stages.add(newData); setNewData({...newData, nom: ""}); } else { toast.error("Nom requis"); } }}>+</button></td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function StagesPage() {
    return <Suspense fallback={<div className="container mt-5">Chargement...</div>}><StagesPageContent /></Suspense>
}
