'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"

export default function(){
    const CIReelles = useLiveQuery(() => db.CIReelles.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: 0, CI: 0 })

    function startEdit(cireelle: any) {
        setEditingId(cireelle.id)
        setEditData({ ...cireelle })
    }

    async function saveEdit() {
        if (editingId) {
            await db.CIReelles.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant) {
            await db.CIReelles.add({ ...newData, session })
            setNewData({ enseignant: 0, CI: 0 })
        } else {
            alert("L'enseignant est requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th>CI</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(CIReelles ?? []).filter(ci => ci.session === session).map((ci) => {
                    const enseignant = enseignants?.find(e => e.id === ci.enseignant)
                    return <tr key={ci.id}>
                        {editingId === ci.id ? (
                            <>
                                <td>
                                    <SelectEnseignant id={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: Number(val)})} />
                                </td>
                                <td>
                                    <input type="number" step="0.01" className="form-control" value={editData.CI} onChange={e => setEditData({...editData, CI: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{ci.CI}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(ci)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.CIReelles.delete(ci.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectEnseignant id={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: Number(val)})} />
                    </td>
                    <td>
                        <input type="number" step="0.01" className="form-control" placeholder="CI" value={newData.CI} onChange={e => setNewData({...newData, CI: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}