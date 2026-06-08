'use client'
import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState, useMemo, Suspense, useCallback } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../components/inputs/SelectEnseignant"
import SelectStage from "../components/inputs/SelectStage"
import { useAuth } from "@/app/utilities/auth"
import type { Supervision, Enseignant, Stage } from "@/app/db/db"
import { toast } from "react-hot-toast"
import { useAdminTable } from "../components/useAdminTable"
import AdminHeader from "../components/AdminHeader"
import Skeleton from "@/app/utilities/Skeleton";


function SupervisionsPageContent() {
    const { user, loading } = useAuth()
    const supervisions = useFirestoreCollection<Supervision>("supervisions")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const stages = useFirestoreCollection<Stage>("stages")
    const router = useRouter()
    
    const enrichedSupervisions = useMemo(() => {
        return (supervisions ?? []).map(s => {
            const ens = enseignants?.find(e => e.id === s.enseignant)
            const stage = stages?.find(st => st.id === s.stage)
            let stageLabel = "Stage inconnu"
            if (stage) {
                try {
                    const {saison, annee} = extractSessionInfos(stage.session)
                    stageLabel = `${stage.nom} (${saison} ${annee})`
                } catch { stageLabel = `${stage.nom} (${stage.session})` }
            }
            return {
                ...s,
                enseignantName: ens ? `${ens.nom} ${ens.prenom}` : "",
                stageName: stageLabel
            }
        })
    }, [supervisions, enseignants, stages])

    const filterFn = useCallback((s: any, search: string) => {
        const searchLower = search.toLowerCase()
        return (
            s.enseignantName.toLowerCase().includes(searchLower) ||
            s.stageName.toLowerCase().includes(searchLower) ||
            (s.nbStagiaires ?? 0).toString().includes(searchLower) ||
            (s.coordination ?? 0).toString().includes(searchLower)
        )
    }, [])

    const { search, setSearch, sortedData, toggleSort, getSortIcon } = useAdminTable({
        data: enrichedSupervisions,
        initialSortKey: "stageName",
        filterFn
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: "", stage: "", nbStagiaires: 0, coordination: 0 })

    if (loading) return (
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )
    if (!user) { router.push("/login"); return null; }

    return <div className="container mt-3">
        <AdminHeader title="Gestion des supervisions" search={search} setSearch={setSearch} />
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("stageName")} style={{cursor: "pointer"}}>Stage / Session {getSortIcon("stageName")}</th>
                    <th onClick={() => toggleSort("enseignantName")} style={{cursor: "pointer"}}>Enseignant {getSortIcon("enseignantName")}</th>
                    <th onClick={() => toggleSort("nbStagiaires")} style={{cursor: "pointer"}}>Stagiaires {getSortIcon("nbStagiaires")}</th>
                    <th onClick={() => toggleSort("coordination")} style={{cursor: "pointer"}}>Coordination (CI) {getSortIcon("coordination")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((supervision) => (
                    <tr key={supervision.id}>
                        {editingId === supervision.id ? (
                            <>
                                <td><SelectStage value={editData.stage} onChange={(val:any) => setEditData({...editData, stage: val})} /></td>
                                <td><SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: val})} /></td>
                                <td><input type="number" className="form-control" value={editData.nbStagiaires} onChange={e => setEditData({...editData, nbStagiaires: Number(e.target.value)})} /></td>
                                <td><input type="number" step="0.01" className="form-control" value={editData.coordination} onChange={e => setEditData({...editData, coordination: Number(e.target.value)})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={async () => { await firebaseDb.supervisions.update(editingId, editData); setEditingId(null); }}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{supervision.stageName}</td>
                                <td>{supervision.enseignantName}</td>
                                <td>{supervision.nbStagiaires}</td>
                                <td>{supervision.coordination ?? 0} CI</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => { setEditingId(supervision.id); setEditData({...supervision}); }}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.supervisions.delete(supervision.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td><SelectStage value={newData.stage} onChange={(val:any) => setNewData({...newData, stage: val})} /></td>
                    <td><SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: val})} /></td>
                    <td><input type="number" className="form-control" placeholder="Étud." value={newData.nbStagiaires} onChange={e => setNewData({...newData, nbStagiaires: Number(e.target.value)})} /></td>
                    <td><input type="number" step="0.01" className="form-control" placeholder="Coord (CI)" value={newData.coordination} onChange={e => setNewData({...newData, coordination: Number(e.target.value)})} /></td>
                    <td><button className="btn btn-primary btn-sm w-100" onClick={async () => { if(newData.enseignant && newData.stage) { await firebaseDb.supervisions.add(newData); setNewData({...newData, nbStagiaires: 0, coordination: 0}); } else { toast.error("Enseignant et stage requis"); } }}>+</button></td>
                </tr>
            </tbody>
        </table>
    </div>
}

export default function SupervisionsPage() {
    return <Suspense fallback={(
        <div className="container mt-5">
            <Skeleton height="40px" width="300px" className="mb-4" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" className="mb-2" />
            <Skeleton height="60px" />
        </div>
    )}><SupervisionsPageContent /></Suspense>
}
