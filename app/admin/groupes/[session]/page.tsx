'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectCours from "../../components/inputs/SelectCours"

export default function(){
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())

    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ cours: 0, nbEtudiants: 0 })

    function startEdit(groupe: any) {
        setEditingId(groupe.id)
        setEditData({ ...groupe })
    }

    async function saveEdit() {
        if (editingId) {
            await db.groupes.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.cours) {
            await db.groupes.add({ ...newData, session })
            setNewData({ cours: 0, nbEtudiants: 0 })
        } else {
            alert("Le cours est requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Cours</th>
                    <th>Nombre d'étudiants</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(groupes ?? []).filter(g => g.session === session).map((groupe) => {
                    const cour = cours?.find((el) => el.id == groupe.cours)
                    
                    return <tr key={groupe.id}>
                        {editingId === groupe.id ? (
                            <>
                                <td>
                                    <SelectCours value={editData.cours} onChange={(val:any) => setEditData({...editData, cours: Number(val)})} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" value={editData.nbEtudiants} onChange={e => setEditData({...editData, nbEtudiants: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{cour?.sigle} - {cour?.nom}</td> 
                                <td>{groupe.nbEtudiants}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(groupe)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.groupes.delete(groupe.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectCours value={newData.cours} onChange={(val:any) => setNewData({...newData, cours: Number(val)})} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Étudiants" value={newData.nbEtudiants} onChange={e => setNewData({...newData, nbEtudiants: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}