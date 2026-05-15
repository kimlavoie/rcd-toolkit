'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../components/inputs/SelectEnseignant"
import SelectStage from "../components/inputs/SelectStage"

export default function(){
    const supervisions = useLiveQuery(() => db.supervisions.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const stages = useLiveQuery(() => db.stages.toArray())
    const router = useRouter()
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: 0, stage: 0, nbStagiaires: 0 })

    function startEdit(supervision: any) {
        setEditingId(supervision.id)
        setEditData({ ...supervision })
    }

    async function saveEdit() {
        if (editingId) {
            await db.supervisions.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.stage) {
            await db.supervisions.add(newData)
            setNewData({ ...newData, nbStagiaires: 0 })
        } else {
            alert("L'enseignant et le stage sont requis.")
        }
    }

    function formatStage(stageId: number) {
        const stage = stages?.find(s => s.id === stageId)
        if (!stage) return "Stage inconnu"
        try {
            const {saison, annee} = extractSessionInfos(stage.session)
            return `${saison} ${annee}`
        } catch {
            return stage.session
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Session du stage</th>
                    <th>Enseignant</th>
                    <th>Nombre de stagiaires</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(supervisions ?? []).map((supervision) => {
                    const enseignant = enseignants?.find((el) => el.id == supervision.enseignant)
                    
                    return <tr key={supervision.id}>
                        {editingId === supervision.id ? (
                            <>
                                <td>
                                    <SelectStage value={editData.stage} onChange={(val:any) => setEditData({...editData, stage: Number(val)})} />
                                </td>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: Number(val)})} />
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
                                <td>{formatStage(supervision.stage)}</td>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{supervision.nbStagiaires}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(supervision)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.supervisions.delete(supervision.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectStage value={newData.stage} onChange={(val:any) => setNewData({...newData, stage: Number(val)})} />
                    </td>
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: Number(val)})} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Stagiaires" value={newData.nbStagiaires} onChange={e => setNewData({...newData, nbStagiaires: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}