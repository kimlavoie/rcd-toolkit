'use client'

import { firebaseDb, useFirestoreCollection } from "@/app/utilities/firebaseDb"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../components/inputs/SelectEnseignant"
import SelectStage from "../components/inputs/SelectStage"
import { useAuth } from "@/app/utilities/auth"
import type { Supervision, Enseignant, Stage } from "@/app/db/db"
import { useTableSort } from "@/app/utilities/sorting"
import { toast } from "react-hot-toast"

export default function(){
    const { user, loading } = useAuth()
    const supervisions = useFirestoreCollection<Supervision>("supervisions")
    const enseignants = useFirestoreCollection<Enseignant>("enseignants")
    const stages = useFirestoreCollection<Stage>("stages")
    const router = useRouter()
    
    const enrichedSupervisions = useMemo(() => {
        return (supervisions ?? []).map(s => {
            const enseignant = enseignants?.find(e => e.id === s.enseignant)
            const stage = stages?.find(st => st.id === s.stage)
            let stageLabel = "Stage inconnu"
            if (stage) {
                try {
                    const {saison, annee} = extractSessionInfos(stage.session)
                    stageLabel = `${saison} ${annee}`
                } catch {
                    stageLabel = stage.session
                }
            }
            return {
                ...s,
                enseignantName: enseignant ? `${enseignant.nom} ${enseignant.prenom}` : "",
                stageName: stageLabel
            }
        })
    }, [supervisions, enseignants, stages])

    const { sortedData, toggleSort, getSortIcon } = useTableSort(enrichedSupervisions, "stageName")

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: "", stage: "", nbStagiaires: 0 })

    if (loading) return <div className="container mt-5">Chargement...</div>
    if (!user) {
        router.push("/login")
        return null
    }

    function startEdit(supervision: any) {
        setEditingId(supervision.id)
        setEditData({ ...supervision })
    }

    async function saveEdit() {
        if (editingId) {
            await firebaseDb.supervisions.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.stage) {
            await firebaseDb.supervisions.add(newData)
            setNewData({ ...newData, nbStagiaires: 0 })
        } else {
            toast.error("L'enseignant et le stage sont requis.")
        }
    }

    return <div className="container mt-3">
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th onClick={() => toggleSort("stageName")} style={{cursor: "pointer"}}>Session du stage {getSortIcon("stageName")}</th>
                    <th onClick={() => toggleSort("enseignantName")} style={{cursor: "pointer"}}>Enseignant {getSortIcon("enseignantName")}</th>
                    <th onClick={() => toggleSort("nbStagiaires")} style={{cursor: "pointer"}}>Nombre de stagiaires {getSortIcon("nbStagiaires")}</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedData.map((supervision) => {
                    const enseignant = enseignants?.find((el) => el.id == supervision.enseignant)
                    
                    return <tr key={supervision.id}>
                        {editingId === supervision.id ? (
                            <>
                                <td>
                                    <SelectStage value={editData.stage} onChange={(val:any) => setEditData({...editData, stage: val})} />
                                </td>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: val})} />
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
                                <td>{supervision.stageName}</td>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{supervision.nbStagiaires}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(supervision)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => firebaseDb.supervisions.delete(supervision.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectStage value={newData.stage} onChange={(val:any) => setNewData({...newData, stage: val})} />
                    </td>
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: val})} />
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
    </div>
}
