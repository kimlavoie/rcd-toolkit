'use client'

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/app/db/db"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function(){
    const cours = useLiveQuery(() => db.cours.toArray())
    const router = useRouter()
    
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState({ sigle: "", nom: "", saison: "Automne", couleur: "#000000", heuresTheorie: 0, heuresPratique: 0, heuresMaison: 0 })

    function startEdit(cour: any) {
        setEditingId(cour.id)
        setEditData({ ...cour })
    }

    async function saveEdit() {
        if (editingId) {
            await db.cours.update(editingId, editData)
            setEditingId(null)
        }
    }

    async function addNew() {
        if (newData.sigle && newData.nom) {
            await db.cours.add(newData)
            setNewData({ sigle: "", nom: "", saison: "Automne", couleur: "#000000", heuresTheorie: 0, heuresPratique: 0, heuresMaison: 0 })
        } else {
            alert("Le sigle et le nom sont requis.")
        }
    }

    return <>
        <button type="button" className="btn btn-primary rounded-pill mb-3" onClick={() => router.push(".")}>←</button>  
        <table className="table table-striped align-middle">
            <thead>
                <tr>
                    <th>Sigle</th>
                    <th>Nom</th>
                    <th>Saison</th>
                    <th>Couleur</th>
                    <th>Théorie</th>
                    <th>Pratique</th>
                    <th>Maison</th>
                    <th style={{width: "120px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {(cours ?? []).map((cour) => (
                    <tr key={cour.id}>
                        {editingId === cour.id ? (
                            <>
                                <td><input className="form-control" value={editData.sigle} onChange={e => setEditData({...editData, sigle: e.target.value})} /></td>
                                <td><input className="form-control" value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} /></td>
                                <td>
                                    <select className="form-select" value={editData.saison} onChange={e => setEditData({...editData, saison: e.target.value})}>
                                        <option value="Automne">Automne</option>
                                        <option value="Hiver">Hiver</option>
                                    </select>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <input type="color" className="form-control form-control-color me-1" value={editData.couleur} onChange={e => setEditData({...editData, couleur: e.target.value})} />
                                        <input className="form-control form-control-sm" style={{width: "80px"}} value={editData.couleur} onChange={e => setEditData({...editData, couleur: e.target.value})} />
                                    </div>
                                </td>
                                <td><input type="number" className="form-control" value={editData.heuresTheorie} onChange={e => setEditData({...editData, heuresTheorie: Number(e.target.value)})} /></td>
                                <td><input type="number" className="form-control" value={editData.heuresPratique} onChange={e => setEditData({...editData, heuresPratique: Number(e.target.value)})} /></td>
                                <td><input type="number" className="form-control" value={editData.heuresMaison} onChange={e => setEditData({...editData, heuresMaison: Number(e.target.value)})} /></td>
                                <td>
                                    <button className="btn btn-success btn-sm me-1" onClick={saveEdit}>💾</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>❌</button>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>{cour.sigle}</td>
                                <td>{cour.nom}</td>
                                <td>{cour.saison}</td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div style={{width: "20px", height: "20px", backgroundColor: cour.couleur, border: "1px solid #ccc", marginRight: "5px"}}></div>
                                        {cour.couleur}
                                    </div>
                                </td>
                                <td>{cour.heuresTheorie}h</td>
                                <td>{cour.heuresPratique}h</td>
                                <td>{cour.heuresMaison}h</td>
                                <td>
                                    <button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(cour)}>✏️</button>
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => db.cours.delete(cour.id)}>🗑️</button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
                <tr className="table-info">
                    <td><input className="form-control" placeholder="Sigle" value={newData.sigle} onChange={e => setNewData({...newData, sigle: e.target.value})} /></td>
                    <td><input className="form-control" placeholder="Nom du cours" value={newData.nom} onChange={e => setNewData({...newData, nom: e.target.value})} /></td>
                    <td>
                        <select className="form-select" value={newData.saison} onChange={e => setNewData({...newData, saison: e.target.value})}>
                            <option value="Automne">Automne</option>
                            <option value="Hiver">Hiver</option>
                        </select>
                    </td>
                    <td>
                        <div className="d-flex align-items-center">
                            <input type="color" className="form-control form-control-color me-1" value={newData.couleur} onChange={e => setNewData({...newData, couleur: e.target.value})} />
                            <input className="form-control form-control-sm" style={{width: "80px"}} value={newData.couleur} onChange={e => setNewData({...newData, couleur: e.target.value})} />
                        </div>
                    </td>
                    <td><input type="number" className="form-control" placeholder="Théorie" value={newData.heuresTheorie} onChange={e => setNewData({...newData, heuresTheorie: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Pratique" value={newData.heuresPratique} onChange={e => setNewData({...newData, heuresPratique: Number(e.target.value)})} /></td>
                    <td><input type="number" className="form-control" placeholder="Maison" value={newData.heuresMaison} onChange={e => setNewData({...newData, heuresMaison: Number(e.target.value)})} /></td>
                    <td>
                        <button className="btn btn-primary btn-sm w-100" onClick={addNew}>+</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </>
}