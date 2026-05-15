'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../components/inputs/SelectEnseignant"
import SelectCours from "../components/inputs/SelectCours"
import SelectSession from "../components/inputs/SelectSession"

export default function(){
    const priorites = useLiveQuery(() => db.priorites.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const cours = useLiveQuery(() => db.cours.toArray())
    const router = useRouter()
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: 0, cours: 0, sessionDebut: "A24" })

    function startEdit(priorite: any) {
        setEditingId(priorite.id)
        setEditData({ ...priorite })
    }

    async function saveEdit() {
        if (editingId) {
            await db.priorites.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.cours && newData.sessionDebut) {
            await db.priorites.add(newData)
            // Keep the same session for convenience when adding multiple
            setNewData({ ...newData, enseignant: 0, cours: 0 })
        } else {
            alert("Tous les champs sont requis.")
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

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th>Cours</th>
                    <th>Session de début</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(priorites ?? []).map((priorite) => {
                    const enseignant = enseignants?.find((el) => el.id == priorite.enseignant)
                    const cour = cours?.find((el) => el.id == priorite.cours)
                    
                    return <tr key={priorite.id}>
                        {editingId === priorite.id ? (
                            <>
                                <td>
                                    <SelectEnseignant value={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: Number(val)})} />
                                </td>
                                <td>
                                    <SelectCours value={editData.cours} onChange={(val:any) => setEditData({...editData, cours: Number(val)})} />
                                </td>
                                <td>
                                    <SelectSession code={editData.sessionDebut} onChange={(val:any) => setEditData({...editData, sessionDebut: val})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{cour?.sigle} - {cour?.nom}</td>
                                <td>{formatSession(priorite.sessionDebut)}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(priorite)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.priorites.delete(priorite.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                })}
                <tr className="table-info">
                    <td>
                        <SelectEnseignant value={newData.enseignant} onChange={(val:any) => setNewData({...newData, enseignant: Number(val)})} />
                    </td>
                    <td>
                        <SelectCours value={newData.cours} onChange={(val:any) => setNewData({...newData, cours: Number(val)})} />
                    </td>
                    <td>
                        <SelectSession code={newData.sessionDebut} onChange={(val:any) => setNewData({...newData, sessionDebut: val})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}