'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { extractSessionInfos } from "@/app/utilities/sessions"
import SelectEnseignant from "../../components/inputs/SelectEnseignant"
import SelectGroupe from "../../components/inputs/SelectGroupe"

export default function(){
    const params = useParams()
    const router = useRouter()
    const session = params.session as string
    const {saison, annee} = extractSessionInfos(session)

    const charges = useLiveQuery(() => db.charges.toArray())
    const enseignants = useLiveQuery(() => db.enseignants.toArray())
    const groupes = useLiveQuery(() => db.groupes.toArray())
    const coursListe = useLiveQuery(() => db.cours.toArray())
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ enseignant: 0, groupe: 0, nbSemaines: 15 })

    function startEdit(charge: any) {
        setEditingId(charge.id)
        setEditData({ ...charge })
    }

    async function saveEdit() {
        if (editingId) {
            await db.charges.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.enseignant && newData.groupe) {
            await db.charges.add(newData)
            setNewData({ ...newData, enseignant: 0, groupe: 0 })
        } else {
            alert("L'enseignant et le groupe sont requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <h1>{saison} {annee}</h1>
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th>Groupe</th>
                    <th>Nombre de semaines</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(charges ?? []).filter(c => {
                    const groupe = groupes?.find(g => g.id === c.groupe)
                    return groupe?.session === session
                }).map((charge) => {
                    const enseignant = enseignants?.find((el) => el.id == charge.enseignant)
                    const groupe = groupes?.find((el) => el.id == charge?.groupe)
                    const cours = coursListe?.find((el) => el.id == groupe?.cours)
                    
                    return <tr key={charge.id}>
                        {editingId === charge.id ? (
                            <>
                                <td>
                                    <SelectEnseignant id={editData.enseignant} onChange={(val:any) => setEditData({...editData, enseignant: Number(val)})} />
                                </td>
                                <td>
                                    <SelectGroupe id={editData.groupe} session={session} onChange={(val:any) => setEditData({...editData, groupe: Number(val)})} />
                                </td>
                                <td>
                                    <input type="number" className="form-control" value={editData.nbSemaines} onChange={e => setEditData({...editData, nbSemaines: Number(e.target.value)})} />
                                </td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{enseignant?.prenom} {enseignant?.nom}</td>
                                <td>{cours?.sigle} - {cours?.nom} ({groupe?.nbEtudiants})</td>
                                <td>{charge.nbSemaines}</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(charge)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.charges.delete(charge.id)}>🗑️</button>
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
                        <SelectGroupe id={newData.groupe} session={session} onChange={(val:any) => setNewData({...newData, groupe: Number(val)})} />
                    </td>
                    <td>
                        <input type="number" className="form-control" placeholder="Semaines" value={newData.nbSemaines} onChange={e => setNewData({...newData, nbSemaines: Number(e.target.value)})} />
                    </td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}